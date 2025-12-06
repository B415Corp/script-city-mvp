import { GameCore } from '@/core/game_core/game_core';
import { SceneController, SceneInitData } from '@/app/scene_controller/scene_controller';
import { SceneKey } from '@/app/scene_controller/types';

import Phaser from 'phaser';

/**
 * Основная игровая сцена с симуляцией
 * Теги: arch:core, tech:phaser, arch:simulation
 */
export class GameScene extends Phaser.Scene {
  private core!: GameCore;
  private sceneController?: SceneController;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: SceneInitData): void {
    this.core = data.core;
    this.sceneController = data.sceneController;
  }
  preload(): void {
    this.load.image('GRASS_BASE_0', 'src/assets/texture/tiles/grass/GRASS_BASE_0.png');
    this.load.image('SAND_BASE_0', 'src/assets/texture/tiles/grass/SAND_BASE_0.png');
    this.load.image('SNOW_BASE_0', 'src/assets/texture/tiles/grass/SNOW_BASE_0.png');
    this.load.image('FOREST_BASE_0', 'src/assets/texture/tiles/grass/FOREST_BASE_0.png');
    this.load.image('MOUNTAIN_BASE_0', 'src/assets/texture/tiles/grass/MOUNTAIN_BASE_0.png');
  }
  async create(): Promise<void> {
    if (!this.core) {
      throw new Error('GameScene: core is not provided via SceneController');
    }

    // Устанавливаем тёмно-серый фон сцены для контраста с сеткой
    this.cameras.main.setBackgroundColor('#1a202c');

    // Запускаем UI-сцену параллельно, если контроллер доступен
    if (this.sceneController) {
      this.sceneController.launchScene(SceneKey.UI, {
        core: this.core,
        sceneController: this.sceneController,
      });
    }

    // Прикрепление модулей к сцене (UI, хоткеи и т.п.)
    const moduleManager = this.core.getModuleManager();
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
