import { GameCore } from '@/core/game_core/game_core';
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
    // Инициализация игрового ядра
    this.core = new GameCore();
    await this.core.initialize({
      tickRate: 20,
      maxCatchUpTicks: 5,
      enableDebug: true,
    });

    // Запуск ядра
    await this.core.start();

    // Регистрация обработчиков после инициализации core
    this.input.keyboard?.on('keydown-ESC', () => {
      this.core.stop();
      this.scene.start('MenuScene');
    });
  }

  update(_: number, delta: number): void {
    // Делегируем шаг симуляции ядру (через TickManager)
    // Симуляция обновляется до рендеринга
    if (this.core) {
      this.core.getTickManager().updateFromPhaser(delta);
    }
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
