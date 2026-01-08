import { BaseUI, ButtonConfig } from './base.ui';

export class ButtonUI extends BaseUI {
  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, { ...config, isActive: true });
  }
}
