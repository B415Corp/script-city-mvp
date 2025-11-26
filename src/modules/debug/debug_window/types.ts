import Phaser from 'phaser';

/**
 * Типы для debug окна
 * Теги: debug:types, arch:ui
 */

export type TabName = 'common' | 'ecs' | 'modules' | 'events';

export interface TabButton {
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  name: TabName;
}

export interface DebugInfo {
  tick: number;
  speed: number;
  subscriptions: Record<string, number>;
}
