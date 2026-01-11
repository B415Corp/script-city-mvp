import { BaseUI } from './base.ui';

export interface BadgeConfig {
  xPos: number;
  yPos: number;
  w?: number;
  h: number;
  text: string;
  depth: number;
  isActive?: boolean;
  isActiveTab?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
}

export class BadgeUI extends BaseUI {
  constructor(scene: Phaser.Scene, config: BadgeConfig) {
    super(scene, { ...config, isActive: config.isActive ?? false });
  }

  /** Обновляет текст бейджа */
  public update(field: string): void {
    this.textObj.setText(field);
    this.updateAppearance();
  }
}
