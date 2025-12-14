// Базовый класс для дополнительных модулей, расширений и модов.
// Такие модули расширяют возможности игры: UI-панели, инструменты, пользовательский контент.
// Могут быть загружены/выгружены динамически без нарушения работы ядра игры.

import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';

// Регистрируются в customModuleRegistry ModuleManager'а.
export abstract class CustomModule {
  // название модуля
  protected id!: string;

  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  protected isEnabled: boolean = true;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
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

  // Переопределяется в наследниках
  protected onEnable(): void {
    // Логика включения
    this.eventBus.emit(Events.ModuleEnabled, { id: this.id });
  }

  // Переопределяется в наследниках
  protected onDisable(): void {
    // Логика выключения
    this.eventBus.emit(Events.ModuleDisabled, { id: this.id });
  }
}
