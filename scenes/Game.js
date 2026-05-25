// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.timeLeft = 30;
    this.collectablePoints = {
      square: 5,
      triangle: 10,
      rhombus: 15,
      circle: -5,
    };
    this.collectableLanes = [120, 240, 360, 480, 600];
    this.collectableLaneIndex = 0;
  }

  preload() {
    this.load.image("sky", "./public/assets/sky.png");
    this.load.image("ground", "./public/assets/platform.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();
    this.floorPlatform = this.platforms
      .create(400, 568, "ground")
      .setScale(2)
      .refreshBody();
    this.platforms
      .create(180, 420, "ground")
      .setScale(0.9)
      .refreshBody();
    this.platforms
      .create(620, 340, "ground")
      .setScale(0.8)
      .refreshBody();
    this.platforms
      .create(80, 260, "ground")
      .setScale(0.85)
      .refreshBody();
    this.platforms
      .create(700, 200, "ground")
      .setScale(0.7)
      .refreshBody();
    this.platforms
      .create(320, 135, "ground")
      .setScale(0.75)
      .refreshBody();

    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.createCollectableTextures();

    this.collectables = this.physics.add.group();

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: "32px",
      fill: "#000",
    });

    this.gameOverText = this.add.text(400, 300, "GAME OVER", {
      fontSize: "64px",
      fill: "#000",
    });
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setVisible(false);

    this.timeText = this.add.text(700, 16, `Tiempo: ${this.timeLeft}`, {
      fontSize: "32px",
      fill: "#000",
    });
    this.timeText.setOrigin(0.5, 0.5);

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameOver) {
          return;
        }

        this.timeLeft -= 1;
        this.timeText.setText(`Tiempo: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
          this.endGame("Perdiste");
        }
      },
      loop: true,
    });

    this.spawnTimer = this.time.addEvent({
      delay: 500,
      callback: this.spawnCollectable,
      callbackScope: this,
      loop: true,
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(
      this.collectables,
      this.platforms,
      this.handleCollectablePlatformBounce,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.collectables,
      this.collectCollectable,
      null,
      this
    );

    this.spawnCollectable();
  }

  update() {
    if (this.gameOver) {
      this.gameOverText.setVisible(true);
      this.player.setVelocity(0, 0);
      this.player.anims.play("turn");
      return;
    }

    this.collectables.children.iterate((child) => {
      if (!child) {
        return;
      }

      if (child.y > 700) {
        child.destroy();
      }
    });

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }
  }

  createCollectableTextures() {
    if (this.textures.exists("square")) {
      return;
    }

    const createTexture = (key, drawFn) => {
      const graphics = this.make.graphics({ add: false });
      drawFn(graphics);
      graphics.generateTexture(key, 48, 48);
      graphics.destroy();
    };

    createTexture("square", (graphics) => {
      graphics.fillStyle(0x00c853, 1);
      graphics.fillRect(6, 6, 36, 36);
    });

    createTexture("triangle", (graphics) => {
      graphics.fillStyle(0xffab00, 1);
      graphics.fillTriangle(24, 4, 6, 40, 42, 40);
    });

    createTexture("rhombus", (graphics) => {
      graphics.fillStyle(0x2962ff, 1);
      graphics.fillPoints(
        [
          { x: 24, y: 4 },
          { x: 44, y: 24 },
          { x: 24, y: 44 },
          { x: 4, y: 24 },
        ],
        true
      );
    });

    createTexture("circle", (graphics) => {
      graphics.fillStyle(0xff1744, 1);
      graphics.fillCircle(24, 24, 20);
    });
  }

  spawnCollectable() {
    if (this.gameOver) {
      return;
    }

    const types = ["square", "triangle", "rhombus", "circle"];
    const type = Phaser.Utils.Array.GetRandom(types);

    const laneIndex = this.collectableLaneIndex;
    const x = this.collectableLanes[laneIndex];
    const collectable = this.collectables.create(x, -40, type);

    this.collectableLaneIndex = (laneIndex + 1) % this.collectableLanes.length;

    collectable.setScale(0.9);
    collectable.setVelocityY(120);
    collectable.setVelocityX(laneIndex % 2 === 0 ? 20 : -20);
    collectable.setBounce(0.25);
    collectable.body.allowGravity = true;
    collectable.setData("type", type);
    collectable.setData(
      "remainingPoints",
      type === "circle" ? 2 : this.collectablePoints[type]
    );
  }

  collectCollectable(player, collectable) {
    const type = collectable.getData("type");

    collectable.destroy();
    this.score += this.collectablePoints[type];

    if (this.score < 0) {
      this.score = 0;
    }

    this.scoreText.setText(`Score: ${this.score}`);

    if (this.score > 100) {
      this.endGame("Ganaste");
    }
  }

  handleCollectablePlatformBounce(collectable) {
    const type = collectable.getData("type");

    if (type === "circle") {
      const remainingPoints = collectable.getData("remainingPoints") - 1;

      if (remainingPoints <= 0) {
        collectable.destroy();
        return;
      }

      collectable.setData("remainingPoints", remainingPoints);
      collectable.setVelocityY(-80);
      return;
    }

    const remainingPoints = collectable.getData("remainingPoints") - 5;

    if (remainingPoints <= 0) {
      collectable.destroy();
      return;
    }

    collectable.setData("remainingPoints", remainingPoints);
    collectable.setVelocityY(-80);
  }

  endGame(state) {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.anims.play("turn");

    if (this.timer) {
      this.timer.remove(false);
    }

    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
    }

    this.scene.start("finish", {
      score: this.score,
      timeLeft: this.timeLeft,
      state,
    });
  }
}
