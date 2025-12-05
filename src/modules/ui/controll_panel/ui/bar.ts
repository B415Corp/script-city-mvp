export class ControllPanelBar {
  private container?: Phaser.GameObjects.Container;
  private readonly barHeight = 80;

  constructor(private scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): Phaser.GameObjects.Container {
    const { width, height } = this.scene.scale;

    const container = this.scene.make.container({
      x: width / 2,
      y: height - this.barHeight / 2,
      add: false,
    });
    container.setSize(width, this.barHeight);

    const background = this.scene.add.rectangle(0, 0, width, this.barHeight, 0x1a1a1a, 0.95);

    container.add(background);
    container.setDepth(100);

    this.container = container;
    return container;
  }

  addControl(
    control: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform,
    offsetX = 0,
    offsetY = 0,
  ): void {
    if (!this.container) {
      throw new Error('ControllPanelBar: call create() before adding controls');
    }

    control.setPosition(offsetX, offsetY);
    this.container.add(control);
  }

  getWidth(): number {
    if (this.container) {
      return this.container.width;
    }
    return this.scene.scale.width;
  }

  getHeight(): number {
    return this.barHeight;
  }
}
