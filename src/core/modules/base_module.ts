import { EventBus } from '../event_bus/event_bus';

class BaseModule {
  protected scene!: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
}

export default BaseModule;
