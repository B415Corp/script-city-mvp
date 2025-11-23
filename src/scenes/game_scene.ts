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
    await this.core.start();
  }

  update(_: number, delta: number): void {
    this.movingBox.update(delta);

    // Делегируем шаг симуляции ядру (через TickManager)
    // TODO: this.core.getTickManager().updateFromPhaser(delta);
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
