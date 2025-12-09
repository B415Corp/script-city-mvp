import Phaser from 'phaser';
import { debugLog } from '@/infrastructure/utils/logger';
import { SceneKey, SceneRegistration } from './types';
import type { GameCore } from '@/core/game_core/game_core';

/**
 * Контроллер сцен управляет регистрацией и переключением.
 * Теги: arch:app, tech:phaser
 */
export type SceneInitData = {
  core: GameCore;
  sceneController: SceneController;
};

export class SceneController {
  private activeScene?: SceneKey;

  constructor(private readonly game: Phaser.Game) {}

  registerScenes(registry: SceneRegistration[]): void {
    registry.forEach(({ key, scene }) => {
      if (key in this.game.scene.keys) {
        debugLog('Сцена уже зарегистрирована, пропускаем', { key });
        return;
      }

      this.game.scene.add(key, scene, false);
      debugLog('Сцена добавлена в менеджер', { key });
    });
  }

  startScene(key: SceneKey, data: SceneInitData): void {
    this.game.scene.start(key, data);
    this.activeScene = key;
    debugLog('Сцена запущена', { key });
  }

  launchScene(key: SceneKey, data: SceneInitData): void {
    this.game.scene.run(key, data);
    debugLog('Сцена запущена параллельно (run)', { key });
  }

  switchToScene(key: SceneKey, data: SceneInitData): void {
    if (this.activeScene && this.activeScene !== key) {
      this.game.scene.stop(this.activeScene);
    }
    this.startScene(key, data);
  }

  stopScene(key: SceneKey): void {
    if (key in this.game.scene.keys) {
      this.game.scene.stop(key);
      debugLog('Сцена остановлена', { key });
    }
    if (this.activeScene === key) {
      this.activeScene = undefined;
    }
  }

  resize(width: number, height: number): void {
    this.game.scale.resize(width, height);
  }

  getActiveSceneKey(): SceneKey | undefined {
    return this.activeScene;
  }

  getActiveScene(): Phaser.Scene | undefined {
    return this.activeScene ? this.game.scene.getScene(this.activeScene) : undefined;
  }
}
