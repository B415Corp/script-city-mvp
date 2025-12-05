import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { debugLog } from '@/infrastructure/utils/logger';
import { Div } from '@/ui_kit/div';

export class ControllPanelModule implements IModule {
  id = 'controll_panel';
  dependencies = [];

  private core?: GameCore;
  private scene?: Phaser.Scene;
  private panel?: Div;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    debugLog('ControllPanelModule: initialized');
  }

  attachToScene(scene: Phaser.Scene): void {
    if (!this.core) {
      throw new Error('ControllPanelModule not initialized');
    }

    this.scene = scene;
    const { height } = scene.sys.canvas;
    this.panel = new Div(scene, 32, height - (120 + 32), {
      width: 240,
      height: 120,
      padding: 12,
      backgroundColor: 0x1a1a1a,
      backgroundAlpha: 0.85,
      borderRadius: 8,
      autoSize: true,
      interactive: true,
    });

    debugLog('ControllPanelModule: attached to scene');
  }

  destroy(): void {
    this.panel?.destroy();
    this.panel = undefined;
    this.scene = undefined;
    this.core = undefined;
  }
}
