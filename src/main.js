const connectBtn = document.getElementById("connectBtn");
const resultEle = document.getElementById("result");
const startBtn = document.getElementById("startBtn");
const easyBtn = document.getElementById("easy");
const hard = document.getElementById("hard");

const setText = (el, text) => {
  el.innerText = text;
};
const display = new PeekSmithDevice();

connectBtn.addEventListener("click", () => {
  display.connect();
});

const checkedButton = () => {
  return Array.from(document.getElementsByName("advanced")).find(
    (a) => a.checked
  ).value;
};
startBtn.addEventListener("click", () => {
  const gameType = checkedButton();
  const game = new ReflexTimeGame(display, {
    rounds: 5,
    type: gameType,
  });

  game.start().then((result) => {
    if (result) {
      const minReactionTimeMs = Math.min(...result);
      const maxReactionTimeMs = Math.max(...result);
      const avgReactionTimeMs =
        result.reduce((sum, reactionTime) => sum + reactionTime, 0) /
        result.length;

      const text = `MIN: ${minReactionTimeMs}ms\nMAX: ${maxReactionTimeMs}ms\nAVG: ${avgReactionTimeMs}ms`;
      display.displayText(text);
      setText(resultEle, text);
    } else {
      display.displayText("GAME OVER");
    }
  });
});

display.onConnect(() => {
  setText(connectBtn, "Connected");
  connectBtn.disabled = true;
  startBtn.disabled = false;
});

display.onDisconnect(() => {
  setText(connectBtn, "Connect");
});
