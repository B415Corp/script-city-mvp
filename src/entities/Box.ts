import Phaser from 'phaser';

// Класс для квадрата с текстом и логикой движения
export class MovingBox {
  container: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  scene: Phaser.Scene;
  width: number;
  height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;

    // Создаем графику квадрата
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x4a90e2, 1);
    graphics.fillRect(-width / 2, -height / 2, width, height);

    // Создаем текст
    const dvdText = scene.add
      .text(0, 0, text, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Контейнер для удобства управления
    this.container = scene.add.container(x, y, [graphics, dvdText]);

    // Начальная скорость
    this.velocity = new Phaser.Math.Vector2(300, 220);
  }

  update(delta: number): void {
    const dt = delta / 1000;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    // Обновление позиции
    this.container.x += this.velocity.x * dt;
    this.container.y += this.velocity.y * dt;

    // Отскок от краев
    if (this.container.x - this.width / 2 < 0) {
      this.container.x = this.width / 2;
      this.velocity.x *= -1;
    } else if (this.container.x + this.width / 2 > screenWidth) {
      this.container.x = screenWidth - this.width / 2;
      this.velocity.x *= -1;
    }
    if (this.container.y - this.height / 2 < 0) {
      this.container.y = this.height / 2;
      this.velocity.y *= -1;
    } else if (this.container.y + this.height / 2 > screenHeight) {
      this.container.y = screenHeight - this.height / 2;
      this.velocity.y *= -1;
    }
  }
}
