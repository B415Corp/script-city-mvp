import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { BottomBar } from '@/ui/bottom_bar/bottom_bar';
import Phaser from 'phaser';

/**
 * Модуль нижней панели управления
 * Теги: arch:module, arch:ui, gameplay:time-control
 */
export class BottomBarModule implements IModule {
  id = 'bottom_bar';
  dependencies = ['grid'];

  private core?: GameCore;
  private bottomBar?: BottomBar;
  private scene?: Phaser.Scene;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    console.warn('📊 BottomBarModule initialized');
  }

  attachToScene(scene: Phaser.Scene): void {
    if (!this.core) {
      throw new Error('BottomBarModule not initialized');
    }

    this.scene = scene;
    this.bottomBar = new BottomBar(scene, this.core);
    this.bottomBar.create();

    // Подписка на события сцены для обработки resize
    scene.scale.on('resize', this.handleResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

    console.warn('📊 BottomBarModule attached to scene', scene.scene.key);
  }

  private handleResize(): void {
    if (this.bottomBar && this.bottomBar.resize) {
      this.bottomBar.resize();
    }
  }

  private handleSceneShutdown(): void {
    if (this.bottomBar) {
      this.bottomBar.destroy();
      this.bottomBar = undefined;
    }

    if (this.scene) {
      this.scene.scale.off('resize', this.handleResize, this);
      this.scene = undefined;
    }

    console.warn('📊 BottomBarModule detached from scene');
  }

  destroy(): void {
    this.handleSceneShutdown();
    console.warn('📊 BottomBarModule destroyed');
  }
}
