import Phaser from 'phaser';
import { SceneInitData } from '@/app/scene_controller/scene_controller';

/**
 * UI-сцена поверх игрового мира (HUD/панели).
 * Теги: arch:ui, tech:phaser
 */
export class UiScene extends Phaser.Scene {
  private initData?: SceneInitData;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: SceneInitData): void {
    this.initData = data;
  }

  create(): void {
    // Базовый UI-слой; настоящие панели подключаются модулями в attachToScene
    this.input.setDefaultCursor('default');
    this.input.topOnly = true;

    this.add
      .text(16, 16, 'UI Layer', {
        color: '#ffffff',
        fontSize: '14px',
      })
      .setDepth(10);

    // Событие для отладки/будущего управления
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.initData = undefined;
    });
  }
}
