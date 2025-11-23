import { MovingBox } from '@/entities/Box';
import { GameCore } from '@/core/game_core/game_core';
import Phaser from 'phaser';

/**
 * Основная игровая сцена с симуляцией
 * Теги: arch:core, tech:phaser, arch:simulation
 */
export class GameScene extends Phaser.Scene {
  private core!: GameCore;
  movingBox!: MovingBox;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    this.movingBox = new MovingBox(this, width / 2, height / 2, 200, 150, 'ахуел?');

    // Инициализация игрового ядра
    this.core = new GameCore();
    await this.core.initialize({
      tickRate: 20,
      maxCatchUpTicks: 5,
      enableDebug: true,
    });
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

    // Обновление визуальных объектов (рендеринг)
    this.movingBox.update(delta);
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
