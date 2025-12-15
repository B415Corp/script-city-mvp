import { EventBus } from '@/core/event_bus/event_bus';

export abstract class DebugComponent {
  protected contentContainer!: Phaser.GameObjects.Container;
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }

  public onInit(): void {
    console.log('DebugComponent: init', this);
  }

  public onDestroy(): void {}

  public onUpdate(): void {}

  public createContent(contentContainer: Phaser.GameObjects.Container): void {}
}
