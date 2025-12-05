export class ControllPanelBar {
  constructor(private scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.scene.add.rectangle(0, 0, 100, 100, 0x000000);
  }
}
