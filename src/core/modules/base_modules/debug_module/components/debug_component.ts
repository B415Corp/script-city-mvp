import { EventBus } from '@/core/event_bus/event_bus';

export abstract class DebugComponent {
  protected contentContainer!: Phaser.GameObjects.Container;
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }

  // инициализация компонента
  public onInit(): void {
    console.log('DebugComponent: init', this);
  }

  // уничтожение компонента
  public onDestroy(): void {}

  // обновление компонента
  public onUpdate(): void {}

  // активация компонента
  public onActivate(): void {}

  // деактивация компонента
  public onDeactivate(): void {}

  // создание контента
  public createContent(contentContainer: Phaser.GameObjects.Container): void {}
}
