import { MovingBox } from '@/entities/Box';
import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  movingBox!: MovingBox;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.movingBox = new MovingBox(this, width / 2, height / 2, 200, 150, 'ахуел?');
  }

  update(_: number, delta: number): void {
    this.movingBox.update(delta);
  }
}
