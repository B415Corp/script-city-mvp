import { MovingBox } from '@/entities/Box';
import { GameCore } from '@/core/game_core/game_core';
import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private core!: GameCore;
  movingBox!: MovingBox;

  constructor() {
    super({ key: 'MainScene' });
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
    this.core.start();
  }

  update(_: number, delta: number): void {
    this.movingBox.update(delta);

    // Делегируем шаг симуляции ядру (через TickManager)
    // TODO: this.core.getTickManager().updateFromPhaser(delta);
  }
}
