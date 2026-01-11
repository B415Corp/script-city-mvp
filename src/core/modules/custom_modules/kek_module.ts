import { EventBus } from '@/core/event_bus/event_bus';
import { CustomModule } from '../extends';
import { Logger } from '@/core/utils/logger';

export class KekModule extends CustomModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    const logger = Logger.create('KekModule');
    logger.info('KekModule initialized');
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
