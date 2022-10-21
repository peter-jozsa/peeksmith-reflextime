const BUTTONS = {
  LEFT_BUTTON: 'LEFT_BUTTON',
  RIGHT_BUTTON: 'RIGHT_BUTTON'
}

const BUTTON = {
  isb1: BUTTONS.LEFT_BUTTON,
  isb2: BUTTONS.RIGHT_BUTTON,
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


class ReflexTimeGame {

  constructor(display, { rounds = 5 } = {}) {
    this.display = display
    this.maxRounds = rounds
    this.reactionTimesMs = []
    this._onPressedButton = null;

    this.initDisplay()
  }

  initDisplay() {
    this.display.onMessage((message) => {
      const { side, state } = getButton(message);

      if (state === BUTTON_STATES.PRESS && this._onPressedButton) {
        this._onPressedButton(side)
      }
    });
  }

  randomizeExpectedButton() {
    return Math.random() <= 0.5 ? BUTTONS.LEFT_BUTTON : BUTTONS.RIGHT_BUTTON
  }

  displayExpectation(expectedButton) {
    if (expectedButton === BUTTONS.LEFT_BUTTON) {
      this.display.displayText('LEFT')
    } else {
      this.display.displayText('RIGHT')
    }
  }

  async waitForButtonPress() {
    // TODO
    return new Promise((resolve, reject) => {
      this._onPressedButton = (pressedButton) => {
        resolve(pressedButton)
        this._onPressedButton = null
      }
    })
  }

  async measureReactionTime() {
    const expectedButton = this.randomizeExpectedButton()
    
    this.displayExpectation(expectedButton)
    const startTime = Date.now()
    const pressedButton = await this.waitForButtonPress(expectedButton)
    const endTime = Date.now()

    const tookMs = endTime - startTime
    const matched = pressedButton === expectedButton

    return { tookMs, matched }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async start() {
    for (let i=0; i<this.maxRounds; i++) {
      this.display.displayText('')
      await this.sleep(2000);
      const { tookMs, matched } = await this.measureReactionTime()
      
      if (matched) {
        this.display.displayText('CORRECT')
        await this.sleep(3000);
        this.reactionTimesMs.push(tookMs)
      } else {
        return null;
      }
    }

    return this.reactionTimesMs
  }
}