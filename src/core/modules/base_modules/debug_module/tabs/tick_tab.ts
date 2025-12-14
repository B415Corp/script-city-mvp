import { EventBus } from '@/core/event_bus/event_bus';
import { DebugTab } from './tab';

export class TickTab extends DebugTab {
  protected readonly name: string = 'tick';

  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
  }
}
