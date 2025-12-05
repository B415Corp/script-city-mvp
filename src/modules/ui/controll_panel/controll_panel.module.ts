import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { debugLog } from '@/infrastructure/utils/logger';

export class ControllPanelModule implements IModule {
  id = 'controll_panel';
  dependencies = ['grid'];

  private core?: GameCore;
  private scene?: Phaser.Scene;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    debugLog('ControllPanelModule: инициализирован');
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;
    debugLog('ControllPanelModule: прикреплен к сцене');
  }
  destroy(): void {}
}
