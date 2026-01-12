import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { Logger } from '@/core/utils/logger';

export abstract class DebugComponent {
  protected contentContainer!: HTMLElement;
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  protected ecsManager?: ECSManager;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager?: ECSManager) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.ecsManager = ecsManager;
  }

  // инициализация компонента
  public onInit(): void {
    Logger.create('DebugComponent').info('DebugComponent initialized');
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
  public createContent(contentContainer: HTMLElement): void {}
}
