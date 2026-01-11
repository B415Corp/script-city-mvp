import { ECSManager } from '@/core/ecs/ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';

// Базовый класс для критических системных модулей без которых игра не сможет работать.
// Такие модули обеспечивают основную функциональность: рендеринг, ядро, инфраструктуру.
// Регистрируются в baseModuleRegistry ModuleManager'а.
export abstract class BaseModule {
  // название модуля
  protected id!: string;

  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  protected ecsManager!: ECSManager;

  private isEnabled: boolean = true;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.ecsManager = ecsManager;
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  // Включить модуль
  public enable(): void {
    if (!this.isEnabled) {
      this.isEnabled = true;
      this.onEnable();
    }
  }

  // Выключить модуль
  public disable(): void {
    if (this.isEnabled) {
      this.isEnabled = false;
      this.onDisable();
    }
  }

  private onEnable(): void {
    // Логика включения
    this.eventBus.emit(Events.ModuleEnabled, { id: this.id });
  }

  private onDisable(): void {
    // Логика выключения
    this.eventBus.emit(Events.ModuleDisabled, { id: this.id });
  }
}
