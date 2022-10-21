const connectBtn = document.getElementById("connectBtn");
const startBtn = document.getElementById("startBtn");
const setText = (el, text) => {
  el.innerText = text;
};
const display = new PeekSmithDevice();

connectBtn.addEventListener("click", () => {
  display.connect();
});

startBtn.addEventListener("click", () => {
  const game = new ReflexTimeGame(display, { rounds: 5 })

  game.start().then((result) => {
    if (result) {
      const minReactionTimeMs = Math.min(...result)
      const maxReactionTimeMs = Math.max(...result)
      const avgReactionTimeMs = result.reduce((sum, reactionTime) => sum + reactionTime, 0) / result.length

      display.displayText(`MIN: ${minReactionTimeMs}ms\nMAX: ${maxReactionTimeMs}ms\nAVG: ${avgReactionTimeMs}ms`)
    } else {
      display.displayText('GAME OVER')
    }
  })

});

display.onConnect(() => {
  setText(connectBtn, "Connected");
  connectBtn.disabled = true;
  startBtn.disabled = false;
});

display.onDisconnect(() => {
  setText(connectBtn, "Connect");
});
