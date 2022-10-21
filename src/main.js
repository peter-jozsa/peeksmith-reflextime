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

