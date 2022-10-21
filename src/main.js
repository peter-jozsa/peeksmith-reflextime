const connectBtn = document.getElementById("connectBtn");
const display = new PeekSmithDevice();

connectBtn.addEventListener("click", () => {
  display.connect();
});
