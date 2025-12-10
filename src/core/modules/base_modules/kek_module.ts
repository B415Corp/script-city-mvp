import BaseModule from '../base_module';

export class KekModule extends BaseModule {
  protected scene!: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super(scene);
    console.log('KekModule init');
    this.scene = scene;

    this.addText('KekModule: ahuel ?');
  }

  private addText(text: string): void {
    this.scene.add.text(20, 20, text);
  }
}

export default KekModule;
