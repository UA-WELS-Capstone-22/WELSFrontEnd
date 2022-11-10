const { Board, Led } = require("johnny-five");
// import Board from johnny-five
// import Led from johnny-five
const board = new Board();

board.on("ready", () => {
  const led = new Led(13);

  // "blink" the led in 500ms on-off phase periods
  led.blink(500);
});