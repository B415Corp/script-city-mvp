import Phaser from 'phaser';

type DivPadding =
  | number
  | Partial<{
      top: number;
      right: number;
      bottom: number;
      left: number;
    }>;

type NormalizedPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type DivConfig = {
  width?: number;
  height?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  borderRadius?: number;
  padding?: DivPadding;
  autoSize?: boolean;
  interactive?: boolean;
};

const DEFAULT_SIZE = 100;
const DEFAULT_PADDING: NormalizedPadding = { top: 0, right: 0, bottom: 0, left: 0 };

const normalizePadding = (padding?: DivPadding): NormalizedPadding => {
  if (padding === undefined) {
    return DEFAULT_PADDING;
  }

  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }

  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
};

/**
 * Базовый контейнер UI-kit: фон + вложенные элементы.
 *
 * Теги: `arch:ui`, `tech:phaser`
 */
export class Div extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private content: Phaser.GameObjects.Container;
  private padding: NormalizedPadding;
  private backgroundColor: number;
  private backgroundAlpha: number;
  private borderRadius: number;
  private autoSize: boolean;
  private minWidth: number;
  private minHeight: number;
  private interactiveEnabled: boolean;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0, config: DivConfig = {}) {
    super(scene, x, y);

    this.backgroundColor = config.backgroundColor ?? 0x000000;
    this.backgroundAlpha = config.backgroundAlpha ?? 0.5;
    this.borderRadius = config.borderRadius ?? 0;
    this.padding = normalizePadding(config.padding);
    this.autoSize = config.autoSize ?? false;
    this.minWidth = config.width ?? DEFAULT_SIZE;
    this.minHeight = config.height ?? DEFAULT_SIZE;
    this.interactiveEnabled = config.interactive ?? false;

    this.background = scene.add.graphics();
    this.background.setScrollFactor(0);

    this.content = scene.add.container(this.padding.left, this.padding.top);
    this.content.setScrollFactor(0);

    this.add([this.background, this.content]);
    this.scene.add.existing(this);
    this.setScrollFactor(0);

    this.setSize(this.minWidth, this.minHeight);
    this.redrawBackground();

    this.applyInteractiveArea();
  }

  addChild(child: Phaser.GameObjects.GameObject): this {
    this.content.add(child);
    this.updateAutoSize();
    return this;
  }

  addChildren(children: Phaser.GameObjects.GameObject[]): this {
    this.content.add(children);
    this.updateAutoSize();
    return this;
  }

  clearChildren(): this {
    this.content.removeAll(true);
    this.updateAutoSize();
    return this;
  }

  setPadding(padding: DivPadding): this {
    this.padding = normalizePadding(padding);
    this.content.setPosition(this.padding.left, this.padding.top);
    this.updateAutoSize();
    return this;
  }

  setBackgroundColor(color: number): this {
    this.backgroundColor = color;
    this.redrawBackground();
    return this;
  }

  setBackgroundAlpha(alpha: number): this {
    this.backgroundAlpha = alpha;
    this.redrawBackground();
    return this;
  }

  setBorderRadius(radius: number): this {
    this.borderRadius = Math.max(0, radius);
    this.redrawBackground();
    return this;
  }

  setAutoSize(enabled: boolean): this {
    this.autoSize = enabled;
    this.updateAutoSize();
    return this;
  }

  setInteractiveArea(enabled: boolean = true): this {
    this.interactiveEnabled = enabled;

    if (!enabled) {
      this.disableInteractive();
      return this;
    }

    this.applyInteractiveArea();
    return this;
  }

  override setSize(width: number, height: number): this {
    this.minWidth = width;
    this.minHeight = height;
    super.setSize(width, height);
    this.redrawBackground();
    this.applyInteractiveArea();
    return this;
  }

  private updateAutoSize(): void {
    if (!this.autoSize) {
      return;
    }

    const bounds = this.content.getBounds();

    const nextWidth = Math.max(
      this.minWidth,
      bounds.width + this.padding.left + this.padding.right,
    );
    const nextHeight = Math.max(
      this.minHeight,
      bounds.height + this.padding.top + this.padding.bottom,
    );

    if (nextWidth !== this.width || nextHeight !== this.height) {
      super.setSize(nextWidth, nextHeight);
      this.redrawBackground();
      this.applyInteractiveArea();
    }
  }

  private applyInteractiveArea(): void {
    if (!this.interactiveEnabled) {
      return;
    }

    if (!this.scene?.input) {
      return;
    }

    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.width, this.height),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  private redrawBackground(): void {
    this.background.clear();
    this.background.fillStyle(this.backgroundColor, this.backgroundAlpha);

    if (this.borderRadius > 0) {
      this.background.fillRoundedRect(0, 0, this.width, this.height, this.borderRadius);
    } else {
      this.background.fillRect(0, 0, this.width, this.height);
    }
  }
}
