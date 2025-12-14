import { EventBus } from '@/core/event_bus/event_bus';
import { CustomModule } from '../extends';

export class KekModule extends CustomModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('KekModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.addText('KekModule: ahuel ?');

    // this.eventBus.emit<ToolsEvents>(Events.SelectTool, { type: 'test_tool' });
  }

  private addText(text: string): void {
    this.scene.add.text(20, 20, text);
  }
}

export default KekModule;
