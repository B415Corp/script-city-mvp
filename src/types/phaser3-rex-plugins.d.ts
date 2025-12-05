/**
 * Типы для phaser3-rex-plugins (UI)
 * Теги: tech:phaser, tech:typescript
 * Основано на доке badgeLabel: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-badgelabel
 */

import Phaser from 'phaser';

declare module 'phaser3-rex-plugins/templates/ui/uiComponents.js' {
  export type BadgeLabelElementKey =
    | 'background'
    | 'main'
    | 'leftTop'
    | 'centerTop'
    | 'rightTop'
    | 'leftCenter'
    | 'center'
    | 'rightCenter'
    | 'leftBottom'
    | 'centerBottom'
    | 'rightBottom';

  export interface BadgeLabelSpaceConfig {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  }

  export interface BadgeLabelConfig {
    x?: number;
    y?: number;
    anchor?: unknown;
    width?: number;
    height?: number;
    origin?: number;
    originX?: number;
    originY?: number;
    background?: Phaser.GameObjects.GameObject;
    main?: Phaser.GameObjects.GameObject;
    leftTop?: Phaser.GameObjects.GameObject;
    centerTop?: Phaser.GameObjects.GameObject;
    rightTop?: Phaser.GameObjects.GameObject;
    leftCenter?: Phaser.GameObjects.GameObject;
    center?: Phaser.GameObjects.GameObject;
    rightCenter?: Phaser.GameObjects.GameObject;
    leftBottom?: Phaser.GameObjects.GameObject;
    centerBottom?: Phaser.GameObjects.GameObject;
    rightBottom?: Phaser.GameObjects.GameObject;
    space?: BadgeLabelSpaceConfig;
    name?: string;
    draggable?: boolean;
    sizerEvents?: boolean;
    enableLayer?: boolean;
  }

  export class BadgeLabel extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, config?: BadgeLabelConfig);
    layout(): this;
    getElement(
      key: BadgeLabelElementKey | `#${string}`,
      recursive?: boolean,
    ): Phaser.GameObjects.GameObject | null;
    getByName(name: string, recursive?: boolean): Phaser.GameObjects.GameObject | null;
  }
}

declare module 'phaser3-rex-plugins/templates/ui/ui-plugin.js' {
  import { BadgeLabel, BadgeLabelConfig } from 'phaser3-rex-plugins/templates/ui/uiComponents.js';

  export type LabelLike = Phaser.GameObjects.Container & {
    getElement?: (name: string) => Phaser.GameObjects.GameObject | null;
    setInteractive?: (config?: Phaser.Types.Input.InputConfiguration) => LabelLike;
  };

  export type RoundRectangleLike = Phaser.GameObjects.Shape & {
    setFillStyle: (color?: number, alpha?: number) => RoundRectangleLike;
  };

  export type LabelConfig = {
    width?: number;
    height?: number;
    background?: Phaser.GameObjects.GameObject;
    text?: Phaser.GameObjects.GameObject;
    align?: 'left' | 'center' | 'right';
    space?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    };
  };

  export default class UIPlugin extends Phaser.Plugins.ScenePlugin {
    add: {
      badgeLabel: (config?: BadgeLabelConfig) => BadgeLabel;
      label: (config?: LabelConfig) => LabelLike;
      roundRectangle: (
        x: number,
        y: number,
        width: number,
        height: number,
        radius?: number,
        fillColor?: number,
        fillAlpha?: number,
      ) => RoundRectangleLike;
    };
  }
}

declare module 'phaser' {
  interface Scene {
    rexUI: {
      add: {
        badgeLabel: (
          config?: import('phaser3-rex-plugins/templates/ui/uiComponents.js').BadgeLabelConfig,
        ) => import('phaser3-rex-plugins/templates/ui/uiComponents.js').BadgeLabel;
        label: (
          config?: import('phaser3-rex-plugins/templates/ui/ui-plugin.js').LabelConfig,
        ) => import('phaser3-rex-plugins/templates/ui/ui-plugin.js').LabelLike;
        roundRectangle: (
          x: number,
          y: number,
          width: number,
          height: number,
          radius?: number,
          fillColor?: number,
          fillAlpha?: number,
        ) => import('phaser3-rex-plugins/templates/ui/ui-plugin.js').RoundRectangleLike;
      };
    };
  }
}
