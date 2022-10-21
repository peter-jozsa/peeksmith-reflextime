const connectBtn = document.getElementById("connectBtn");
const display = new PeekSmithDevice();

connectBtn.addEventListener("click", () => {
  display.connect();
});

display.onConnect(() => {
  connectBtn.innerHTML = "Connected";
  connectBtn.disabled = true;
});
