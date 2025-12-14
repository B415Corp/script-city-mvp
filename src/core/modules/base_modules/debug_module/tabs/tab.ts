import { EventBus } from '@/core/event_bus/event_bus';

export abstract class DebugTab {
  protected readonly name: string = 'debug_tab';

  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }
}
