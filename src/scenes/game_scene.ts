import { GameCore } from '@/core/game_core/game_core';
import { DebugModule } from '@/modules/debug/debug_module';
import { GridModule } from '@/modules/grid/grid_module';
import { BottomBarModule } from '@/modules/ui/bottom_bar_module';

import Phaser from 'phaser';

/**
 * Основная игровая сцена с симуляцией
 * Теги: arch:core, tech:phaser, arch:simulation
 */
export class GameScene extends Phaser.Scene {
  private core!: GameCore;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create(): Promise<void> {
    // Устанавливаем тёмно-серый фон сцены для контраста с сеткой
    this.cameras.main.setBackgroundColor('#1a202c');

    this.input.keyboard?.on('keydown-ESC', () => {
      this.core.stop();
      this.scene.start('MenuScene');
    });

    // Инициализация игрового ядра
    this.core = new GameCore();
    await this.core.initialize({
      tickRate: 20,
      maxCatchUpTicks: 5,
      enableDebug: true,
    });

    const moduleManager = this.core.getModuleManager();

    // ⬇️ РЕГИСТРАЦИЯ МОДУЛЕЙ
    moduleManager.registerModule(new DebugModule());
    moduleManager.registerModule(new BottomBarModule());
    moduleManager.registerModule(new GridModule());

    // 🏋️ Запуск ядра (модули инициализируются автоматически)
    await this.core.start();

    // Прикрепление модулей к сцене (UI, хоткеи и т.п.)
    moduleManager.attachModulesToScene(this);
  }

  update(_: number, delta: number): void {
    // Делегируем шаг симуляции ядру (через TickManager)
    this.core.getTickManager().updateFromPhaser(delta);
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
