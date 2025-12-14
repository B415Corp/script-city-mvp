import { EventBus } from '@/core/event_bus/event_bus';
import { DebugTab } from './tab';

export class EventsTab extends DebugTab {
  protected readonly name: string = 'events';

  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
  }
}
