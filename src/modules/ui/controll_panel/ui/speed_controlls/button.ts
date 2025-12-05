export class SpeedControllsButton {
  constructor(private scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(size = 56): Phaser.GameObjects.Container {
    const background = this.scene.add.rectangle(0, 0, size, size, 0x000000);
    background.setOrigin(0.5);

    const text = this.scene.add.text(0, 0, '1x', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);

    const container = this.scene.add.container(0, 0, [background, text]);
    container.setSize(size, size);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
      Phaser.Geom.Rectangle.Contains,
    );
    if (container.input) {
      container.input.useHandCursor = true;
    }

    return container;
  }
}
