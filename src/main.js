const BUTTON = {
  isb1: "LEFT",
  isb2: "RIGHT",
};

const BUTTON_STATES = {
  PRESS: "press",
  RELEASE: "release",
};

const BUTTON_SEPARATE_CHAR = ",";

const getButton = (incomingBtnState) => {
  const [button, state] = incomingBtnState.split(BUTTON_SEPARATE_CHAR);
  return { side: BUTTON[button], state };
};

const connectBtn = document.getElementById("connectBtn");
const setText = (el, text) => {
  el.innerText = text;
};
const display = new PeekSmithDevice();

connectBtn.addEventListener("click", () => {
  display.connect();
});

display.onConnect(() => {
  setText(connectBtn, "Connected");
  connectBtn.disabled = true;
});

display.onDisconnect(() => {
  setText(connectBtn, "Connect");
});

display.onMessage((message) => {
  const { side, state } = getButton(message);
  if (state === BUTTON_STATES.PRESS) {
    console.log(side);
  }
});
