const TYPE = {
  EASY: "easy",
  HARD: "hard",
  EXTREME: "extreme",
};

const INTERVAL = {
  [TYPE.EASY]: 3000,
  [TYPE.HARD]: 1000,
  [TYPE.EXTREME]: 200,
};
class ReflexTimeGame {
  constructor(display, { rounds = 5, type = TYPE.EASY } = {}) {
    this.display = display;
    this.maxRounds = rounds;
    this.gameType = type;

    this.reactionTimesMs = [];
    this._onPressedButton = null;

    this.initDisplay();
  }

  initDisplay() {
    this.display.onMessage((message) => {
      const { side, state } = getButton(message);

      if (state === BUTTON_STATES.PRESS && this._onPressedButton) {
        this._onPressedButton(side);
      }
    });
  }

  randomizeExpectedButton() {
    return Math.random() <= 0.5 ? BUTTONS.LEFT_BUTTON : BUTTONS.RIGHT_BUTTON;
  }

  displayExpectation(expectedButton) {
    if (expectedButton === BUTTONS.LEFT_BUTTON) {
      this.display.displayText("LEFT");
    } else {
      this.display.displayText("RIGHT");
    }
    display.send("/VL211\n~....\n");
  }

  async waitForButtonPress() {
    // TODO
    return new Promise((resolve, reject) => {
      this._onPressedButton = (pressedButton) => {
        resolve(pressedButton);
        this._onPressedButton = null;
      };
    });
  }

  async measureReactionTime() {
    const expectedButton = this.randomizeExpectedButton();

    this.displayExpectation(expectedButton);
    const startTime = Date.now();
    const pressedButton = await this.waitForButtonPress(expectedButton);
    const endTime = Date.now();

    const tookMs = endTime - startTime;
    const matched = pressedButton === expectedButton;

    return { tookMs, matched };
  }

  async countdown(from = 3) {
    for (let current = from; current>0; current--) {
      this.display.displayText(`${current}`)
      await sleep(1000)
    }
  }

  async start() {
    await this.countdown()
    for (let i=0; i<this.maxRounds; i++) {
      this.display.displayText('')
      await sleep(2000);
      const { tookMs, matched } = await this.measureReactionTime()
      
      if (matched) {
        const roundsLeft = this.maxRounds - i - 1;
        let message = `CORRECT\n${tookMs}ms\n`
        if (roundsLeft > 0) {
          message += `\n${roundsLeft} rounds left`
        }
        this.display.displayText(message)
        await sleep(INTERVAL[this.gameType]);
        this.reactionTimesMs.push(tookMs)
      } else {
        return null;
      }
    }

    return this.reactionTimesMs;
  }
}
