import Phaser from 'phaser';
import { SceneController, SceneInitData } from '@/app/scene_controller/scene_controller';
import { SceneKey } from '@/app/scene_controller/types';

/**
 * Сцена главного меню
 * Теги: arch:ui, tech:phaser
 */
export class MenuScene extends Phaser.Scene {
  private sceneController?: SceneController;
  private initData?: SceneInitData;

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data: SceneInitData): void {
    this.sceneController = data.sceneController;
    this.initData = data;
  }

  create(): void {
    const startText = this.add
      .text(100, 100, 'Start Game', { color: '#ffffff', fontSize: '24px' })
      .setInteractive({ useHandCursor: true });

    startText.on('pointerdown', () => {
      if (this.sceneController && this.initData) {
        this.sceneController.switchToScene(SceneKey.Game, this.initData);
      }
    });
  }
}
