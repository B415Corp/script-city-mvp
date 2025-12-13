import { EventBus } from '@/core/event_bus/event_bus';
import BaseModule from '../base_module';

export class KekModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('KekModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.addText('KekModule: ahuel ?');

    // this.eventBus.on(Events.TickStarted, (res) => {
    //   console.log('res', res);
    // });
  }

  private addText(text: string): void {
    this.scene.add.text(20, 20, text);
  }
}

export default KekModule;
