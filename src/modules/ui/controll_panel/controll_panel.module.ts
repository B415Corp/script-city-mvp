import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { debugLog } from '@/infrastructure/utils/logger';
import { ControllPanelBar } from './ui/bar';
import { SpeedControllsButton } from './ui/speed_controlls/button';

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

    const bar = new ControllPanelBar(scene);
    const createdBar = bar.create();
    scene.add.existing(createdBar);

    const speedControllsButton = new SpeedControllsButton(scene);
    const speedButton = speedControllsButton.create(Math.min(bar.getHeight() - 16, 56));
    const leftPadding = 24;
    const buttonX = -bar.getWidth() / 2 + speedButton.displayWidth / 2 + leftPadding;
    bar.addControl(speedButton, buttonX, 0);
  }

  destroy(): void {}
}
