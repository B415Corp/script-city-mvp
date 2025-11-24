import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { DebugWindow } from './debug_window/debug_window';

/**
 * Модуль отладки для отображения информации о симуляции.
 *
 * **Теги**: `arch:module`, `debug:info`, `debug:performance`
 *
 * Важный момент: модуль сам вешается на сцену Phaser и управляет своим UI
 * через события сцены (`update`, `shutdown`), чтобы `GameScene` не знал
 * о внутренних деталях и не дергал методы модуля напрямую.
 */
export class DebugModule implements IModule {
  id = 'debug';
  dependencies?: string[];

  private core?: GameCore;
  private debugWindow?: DebugWindow;
  private scene?: Phaser.Scene;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
  }

  /**
   * Точка интеграции с Phaser.Scene.
   *
   * GameScene после старта ядра просто даёт всем модулям шанс
   * "прикрутиться" к сцене, а дальше модуль сам подписывается
   * на события `update`/`shutdown` и живёт своей жизнью.
   */
  attachToScene(scene: Phaser.Scene): void {
    if (!this.core) {
      throw new Error('DebugModule not initialized');
    }

    this.scene = scene;
    this.debugWindow = new DebugWindow(scene, this.core);
    this.debugWindow.create();

    // Обновление каждый кадр
    scene.events.on('update', this.handleSceneUpdate, this);

    // Очистка при выключении сцены
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);
  }

  /**
   * Обновление окна отладки (подписка на Phaser.Scene.update).
   * Обновление происходит на основе реального времени, независимо от скорости игры.
   */
  private handleSceneUpdate(): void {
    if (this.debugWindow) {
      this.debugWindow.update();
    }
  }

  /**
   * Очистка подписок и UI при завершении сцены.
   */
  private handleSceneShutdown(): void {
    if (this.debugWindow) {
      this.debugWindow.destroy();
      this.debugWindow = undefined;
    }

    if (this.scene) {
      this.scene.events.off('update', this.handleSceneUpdate, this);
      this.scene = undefined;
    }
  }

  /**
   * Переключение видимости окна отладки.
   * Оставляем публичным, чтобы в будущем можно было дергать его из команд/UI.
   */
  toggle(): void {
    if (this.debugWindow) {
      this.debugWindow.toggle();
    }
  }

  /**
   * Очистка при остановке ядра.
   * В MVP практически не вызывается (ядро живёт вместе со сценой),
   * но реализовано для полноты контракта IModule.
   */
  destroy(): void {
    // Если по каким-то причинам ядро уничтожается раньше сцены —
    // подчистим за собой.
    this.handleSceneShutdown();
  }
}
