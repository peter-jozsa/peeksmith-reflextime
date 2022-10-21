const SMP_OP_READ       = 0;
const SMP_OP_READ_RSP   = 1;
const SMP_OP_WRITE      = 2;
const SMP_OP_WRITE_RSP  = 3;

const SMP_GROUP_DEFAULT = 0;
const SMP_GROUP_IMAGES  = 1;

// default group
const SMP_ID_DEFAULT_ECHO     = 0;
const SMP_ID_DEFAULT_TASKSTAT = 2;
const SMP_ID_DEFAULT_MPSTAT   = 3;
const SMP_ID_DEFAULT_RESET    = 5;

// images group
const SMP_ID_IMAGES_LIST = 0;

class PeekSmithDevice {
    constructor(di = {}) {
        this.SERVICE_UUID = 0xFFE0;
        this.SERVICE_SMP_UUID = '8d53dc1d-1db7-4cd3-868b-8a527460aa84';
        this.CHARACTERISTIC_UUID = 0xFFE1;
        this.CHARACTERISTIC_CUSTOM_UUID = 0xFFE2;
        this.CHARACTERISTIC_PROXY_UUID = 0xFFE3;
        this._characteristic = null;
        this._connectCallback = null;
        this._connectingCallback = null;
        this._disconnectCallback = null;
        this._messageCallback = null;
        this._customMessageCallback = null;
        this._proxyMessageCallback = null;
        this._batteryVoltageCallback = null;
        this._queue = [];
        this._communicationIsInProgress = false;
        this._displayInterval = null;
        this._hardwareType = '';
        this._hardwareVersion = 1;
        this._batteryVoltage = null;
        this._characteristicLimit = 19;
        this._sendInterval = 40;
        this._messageBuffer = '';
        this._brightness = 3;
        this._logger = di.logger || { info: console.log, error: console.error };
        this._devices = {};
    }
    onConnecting(callback) {
        this._connectingCallback = callback;
        return this;
    }
    onConnect(callback) {
        this._connectCallback = callback;
        return this;
    }
    onDisconnect(callback) {
        this._disconnectCallback = callback;
        return this;
    }
    onMessage(callback) {
        this._messageCallback = callback;
        return this;
    }
    onData(callback) {
        this._customMessageCallback = callback;
        return this;
    }
    onProxyData(callback) {
        this._proxyMessageCallback = callback;
        return this;
    }
    onBatteryVoltage(callback) {
        this._batteryVoltageCallback = callback;
        return this;
    }
    _notification(event) {
        const characteristicValue = event.target.value;
        const message = Array.from(new Uint8Array(characteristicValue.buffer))
            .map(ascii => String.fromCharCode(ascii))
            .join('');
        this._messageBuffer += message;
        let newlinePos;
        while ((newlinePos = this._messageBuffer.indexOf('\n')) >= 0) {
            let messagePart = this._messageBuffer.substring(0, newlinePos);
            this._messageBuffer = this._messageBuffer.substring(newlinePos + 1);
            const messageType = messagePart[0];
            if (messageType === 'i') {
                const variableName = messagePart[1];
                const variableValue = messagePart.substring(2);
                if (variableName === 'b') {
                    this._batteryVoltage = +variableValue;
                    if (this._batteryVoltageCallback) this._batteryVoltageCallback(this._batteryVoltage);
                    continue;
                }
            }
            if (this._messageCallback) this._messageCallback(messagePart);
        }
    }
    _notificationCustom(event) {
        const characteristicValue = event.target.value;
        const data = Array.from(new Uint8Array(characteristicValue.buffer));
        if (this._customMessageCallback) this._customMessageCallback(data);
    }
    _notificationProxy(event) {
        const PROXY_ADDRESS = '00:00:00:00:00:00';
        const hex2 = v => v.toString(16).padStart(2, '0');
        const deviceTypes = {
            1: 'spotted',
            4: 'peeksmith',
        };
        const messageTypes = {
            0x81: 'notification',
            0x82: 'list_begin',
            0x83: 'list_device',
            0x84: 'list_end',
            0x85: 'list_device_del'
        }
        const characteristicValue = event.target.value;
        const rawMessage = Array.from(new Uint8Array(characteristicValue.buffer));
        console.log(rawMessage);
        // console.log(rawMessage.map(hex2).join(' '));
        const message = {
            type: messageTypes[rawMessage[0]],
            source: rawMessage.slice(1, 7).map(hex2).join(':'),
        };
        if (message.source === PROXY_ADDRESS) {
            message.source = null;
            if (message.type === 'list_device') {
                message.device = {
                    addr: rawMessage.slice(7, 13).map(hex2).join(':'),
                    type: deviceTypes[rawMessage[13]] || rawMessage[13],
                    name: rawMessage.slice(14, rawMessage.length - 1).map(c => String.fromCharCode(c)).join(''),
                };
            }
            if (message.type === 'list_device_del') {
                message.device = {
                    addr: rawMessage.slice(7, 13).map(hex2).join(':')
                };
            }
        }
        if (message.source) {
            message.device = { addr: rawMessage.slice(1, 6).map(hex2).join(':') };
            if (this._devices[message.device.addr]) {
                message.device = this._devices[message.device.addr];
            }
            message.char = [rawMessage[6], rawMessage[7]].map(hex2).join('');
            message.message = rawMessage.slice(9).map(c => String.fromCharCode(c)).join('');
        }
        if (this._proxyMessageCallback) this._proxyMessageCallback(message, rawMessage);
    }
    async connect() {
        try {
            const device = await this._requestDevice();
            this._sendInterval = 40;
            this.name = device.name;
            this.id = device.name.substring(10);
            if (device.name.match(/-03/)) {
                this._hardwareType = 'Display';
                this._hardwareVersion = 3;
                this._characteristicLimit = 250;
                this._sendInterval = 0;
            } else if (device.name.match(/-02/)) {
                this._hardwareType = 'Display';
                this._hardwareVersion = 2;
                this._characteristicLimit = 19;
            } else {
                this._hardwareType = 'Display';
                this._hardwareVersion = 1;
                this._characteristicLimit = 19;
            }
            this._logger.info(`Connecting to PeekSmith ${this._hardwareVersion}...`);
            device.addEventListener('gattserverdisconnected', (event) => {
                console.log(event);
                this._disconnected();
            });
            if (this._connectingCallback) this._connectingCallback();
            const server = await device.gatt.connect();
            this._logger.info(`Server connected.`);
            const service = await server.getPrimaryService(this.SERVICE_UUID);
            this._logger.info(`Primary service connected.`);
            this._characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
            this._characteristic.addEventListener('characteristicvaluechanged', this._notification.bind(this));
            await this._characteristic.startNotifications();
            if (this._hardwareVersion >= 2) await this.queryBatteryInfo();

            if (this._hardwareVersion >= 3) {
                this._characteristicCustom = await service.getCharacteristic(this.CHARACTERISTIC_CUSTOM_UUID);
                this._characteristicCustom.addEventListener('characteristicvaluechanged', this._notificationCustom.bind(this));
                await this._characteristicCustom.startNotifications();
                this._characteristicProxy = await service.getCharacteristic(this.CHARACTERISTIC_PROXY_UUID);
                this._characteristicProxy.addEventListener('characteristicvaluechanged', this._notificationProxy.bind(this));
                await this._characteristicProxy.startNotifications();
            }
        } catch (error) {
            console.log('Error: ', error.message);
            this._disconnected();
            return;
        }
        await this._connected();
    }
    displayText(message) {
        this._queue = this._queue.filter(message =>
            message[0] !== '#' &&
            message[0] !== '$' &&
            message.substring(0, 5) !== '@E\n@T'
        );
        this.send('$' + message.replace(/\n/g, '\r') + '\n');
    }
    setBrightness(brightness) {
        if (brightness <= 1) brightness = 1;
        if (brightness > 8) brightness = 8;
        this._brightness = brightness;
        this.send(`/B${brightness - 1}\n`);
    }
    increaseBrightness() {
        let brightness = this._brightness + 1;
        if (brightness > 7) brightness = 0;
        this.setBrightness(brightness);
    }
    async _requestDevice() {
        return navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: 'PeekSmith-'
            }],
            optionalServices: [this.SERVICE_UUID]
        });
    }
    async _connected() {
        if (this._connectCallback) this._connectCallback();
        this.send('/T5\n');
        this.send('/?b\n');
        this.setBrightness(5);
        this.send('$PeekSmith\n');
        this.testVibrations();
        if (this._hardwareVersion >= 2) {
            this._batteryInterval = setInterval(this.queryBatteryInfo.bind(this), 1000 * 60 * 0.5);
        }
    }
    send(message) {
        this._queue.unshift(message);
        this._display();
    }
    async sendCustom(message) {
        await this._characteristicCustom.writeValueWithoutResponse(Uint8Array.from(message));
    }
    async _disconnected() {
        if (this._displayInterval) clearInterval(this._displayInterval);
        if (this._batteryInterval) clearInterval(this._batteryInterval);
        if (this._disconnectCallback) this._disconnectCallback();
        this._hardwareVersion = null;
        this._batteryVoltage = null;
        this._characteristicLimit = 19;
    }
    _sendString(string) {
        const encoder = new TextEncoder('utf-8');
        return this._characteristic.writeValue(encoder.encode(string));
    }
    _sendProxyListQuery() {
        const proxyAddr = [0, 0, 0, 0, 0, 0];
        const message = [3, ...proxyAddr]; // CMD_PROXY_LIST
        this._characteristicProxy.writeValueWithoutResponse(Uint8Array.from(message));
    }
    async queryBatteryInfo() {
        this.send('/?b\n');
    }
    _display() {
        if (this._communicationIsInProgress) {
            setTimeout(this._display.bind(this), 5);
            return;
        }
        if (this._queue.length === 0) return;

        let buffer = this._queue.pop();
        this._communicationIsInProgress = true;
        function send() {
            if (buffer.length === 0) {
                this._communicationIsInProgress = false;
                if (this._queue.length > 0) setTimeout(this._display.bind(this), this._sendInterval);
                return;
            }
            this._sendString(buffer.substring(0, this._characteristicLimit)).then(() => {
                buffer = buffer.substring(this._characteristicLimit);
                setTimeout(send.bind(this), this._sendInterval);
            });
        }
        send.call(this);
    }
    startDiscovery() {
        const proxyAddr = [0, 0, 0, 0, 0, 0];
        const message = [1, ...proxyAddr]; // CMD_PROXY_START_SCAN
        this._characteristicProxy.writeValueWithoutResponse(Uint8Array.from(message));
    }
    stopDiscovery() {
        const proxyAddr = [0, 0, 0, 0, 0, 0];
        const message = [2, ...proxyAddr]; // CMD_PROXY_STOP_SCAN
        this._characteristicProxy.writeValueWithoutResponse(Uint8Array.from(message));
    }
    listPeers() {
        this._sendProxyListQuery();
    }
}
