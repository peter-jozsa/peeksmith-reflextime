const connectBtn = document.getElementById("connectBtn");
const resultEle = document.getElementById("result");
const easyBtn = document.getElementById("easy");
const hard = document.getElementById("hard");
const setText = (el, text) => {
  el.innerText = text;
};
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
const checkedButton = () => {
  return Array.from(document.getElementsByName("advanced")).find(
    (a) => a.checked
  ).value;
};

const display = new PeekSmithDevice();

const waitForButtonPress = () => new Promise((resolve) => {
  display.onMessage((message) => {
    const { state } = getButton(message);

    if (state === BUTTON_STATES.PRESS) {
      resolve()
    }
  })
})

const waitForStart = async () => {
  await waitForButtonPress()
  startGame()
}

const startMenu = () => {
  display.displayText('Press to start')
  waitForStart()
}

const startGame = async () => {
  const gameType = checkedButton();
  const game = new ReflexTimeGame(display, {
    rounds: 5,
    type: gameType,
  });

  const result = await game.start()
  if (result) {
    const minReactionTimeMs = Math.min(...result)
    const maxReactionTimeMs = Math.max(...result)
    const avgReactionTimeMs = result.reduce((sum, reactionTime) => sum + reactionTime, 0) / result.length

    display.displayText(`MIN: ${minReactionTimeMs}ms\nMAX: ${maxReactionTimeMs}ms\nAVG: ${avgReactionTimeMs}ms`)
  } else {
    display.displayText('GAME OVER')
    await waitForButtonPress()
    startMenu()
  }

  await waitForButtonPress()
  startMenu()
}

connectBtn.addEventListener("click", () => {
  display.connect();
});

display.onConnect(() => {
  setText(connectBtn, "Connected");
  connectBtn.disabled = true;
  sleep(500).then(() => {
    startMenu();
  })
});

display.onDisconnect(() => {
  setText(connectBtn, "Connect");
});
