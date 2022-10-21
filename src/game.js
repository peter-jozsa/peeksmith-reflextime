const BUTTONS = {
  LEFT_BUTTON: 'LEFT_BUTTON',
  RIGHT_BUTTON: 'RIGHT_BUTTON'
}

class ReflexTimeGame {

  constructor(display, { rounds = 5 } = {}) {
    this.display = display
    this.maxRounds = rounds
    this.reactionTimesMs = []
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
  }

  async measureReactionTime() {
    const expectedButton = this.randomizeExpectedButton()
    
    this.displayExpectation(expectedButton)
    const startTime = Date.now()
    const pressedButton = await this.waitForButtonPress(expectedButton)
    const endTime = Date.now()

    if (pressedButton === expectedButton) {
      return endTime - startTime
    }

    return null
  }

  async start() {
    for (let i=0; i<this.maxRounds; i++) {
      const { tookMs } = await this.measureReactionTime()

      this.reactionTimesMs.push(tookMs)

      console.log(tookMs)
    }

    return this.reactionTimesMs
  }
}