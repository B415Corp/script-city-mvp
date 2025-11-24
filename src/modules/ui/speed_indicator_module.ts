import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { SpeedIndicator } from '@/ui/speed_indicator/speed_indicator';
import Phaser from 'phaser';

/**
 * Модуль индикатора скорости
 * Теги: arch:module, arch:ui, gameplay:time-control
 */
export class SpeedIndicatorModule implements IModule {
  id = 'speed_indicator';
  dependencies?: string[];

  private core?: GameCore;
  private speedIndicator?: SpeedIndicator;
  private scene?: Phaser.Scene;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    console.warn('⚡ SpeedIndicatorModule initialized');
  }

  attachToScene(scene: Phaser.Scene): void {
    if (!this.core) {
      throw new Error('SpeedIndicatorModule not initialized');
    }

    this.scene = scene;

    // Создаем индикатор в центре экрана
    const { width, height } = scene.scale;
    this.speedIndicator = new SpeedIndicator(scene, this.core, width / 2, height / 2);
    this.speedIndicator.create();

    // Подписка на события сцены для обновления
    scene.events.on('update', this.handleSceneUpdate, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

    console.warn('⚡ SpeedIndicatorModule attached to scene', scene.scene.key);
  }

  private handleSceneUpdate(_: number, delta: number): void {
    if (this.speedIndicator) {
      this.speedIndicator.update(delta);
    }
  }

  private handleSceneShutdown(): void {
    if (this.speedIndicator) {
      this.speedIndicator.destroy();
      this.speedIndicator = undefined;
    }

    if (this.scene) {
      this.scene.events.off('update', this.handleSceneUpdate, this);
      this.scene = undefined;
    }

    console.warn('⚡ SpeedIndicatorModule detached from scene');
  }

  destroy(): void {
    this.handleSceneShutdown();
    console.warn('⚡ SpeedIndicatorModule destroyed');
  }
}
