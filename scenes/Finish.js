export default class Finish extends Phaser.Scene {
  constructor() {
    super("finish");
  }

  init(data) {
    this.score = data.score || 0;
    this.timeLeft = data.timeLeft || 0;
    this.state = data.state || "";
    this.resultText = this.state === "Ganaste" ? "¡GANASTE!" : "Perdiste";
  }

  preload() {}

  create() {
    this.add.image(400, 300, "sky");

    this.add
      .text(400, 180, this.resultText, { fontSize: "64px", fill: "#000" })
      .setOrigin(0.5);

    this.add
      .text(400, 260, `Puntuación final: ${this.score}`, {
        fontSize: "32px",
        fill: "#000",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 320, `Tiempo restante: ${this.timeLeft}`, {
        fontSize: "28px",
        fill: "#000",
      })
      .setOrigin(0.5);

    this.add
      .text(400, 380, "Presiona R para volver a jugar", {
        fontSize: "24px",
        fill: "#000",
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => {
      this.scene.start("game");
    });
  }
}
