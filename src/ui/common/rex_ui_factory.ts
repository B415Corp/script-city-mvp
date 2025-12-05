import Phaser from 'phaser';

type RexLabel = Phaser.GameObjects.Container & {
  getElement?: (name: string) => Phaser.GameObjects.GameObject | null;
};

interface ButtonOptions {
  width: number;
  height: number;
  text: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: number;
  hoverColor?: number;
  activeColor?: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export interface RexButton {
  label: RexLabel;
  background: Phaser.GameObjects.Shape;
  text: Phaser.GameObjects.Text;
  baseColor: number;
  hoverColor: number;
  activeColor: number;
}

export function createRexButton(scene: Phaser.Scene, options: ButtonOptions): RexButton {
  const backgroundColor = options.backgroundColor ?? 0x2a2a2a;
  const hoverColor = options.hoverColor ?? 0x3a3a3a;
  const activeColor = options.activeColor ?? 0x4a90e2;

  const background = scene.rexUI.add.roundRectangle(
    0,
    0,
    options.width,
    options.height,
    6,
    backgroundColor,
    1,
  );

  const text = scene.add.text(0, 0, options.text, {
    fontSize: options.fontSize ?? '16px',
    color: options.textColor ?? '#ffffff',
    fontFamily: 'Arial',
  });

  const label = scene.rexUI.add.label({
    width: options.width,
    height: options.height,
    background,
    text,
    align: 'center',
    space: { left: 8, right: 8, top: 6, bottom: 6 },
  }) as RexLabel;

  label.setSize(options.width, options.height);
  label.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(0, 0, options.width, options.height),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });

  label.on('pointerover', () => {
    background.setFillStyle(hoverColor);
    options.onPointerOver?.();
  });
  label.on('pointerout', () => {
    background.setFillStyle(backgroundColor);
    options.onPointerOut?.();
  });

  if (options.onClick) {
    label.on('pointerdown', options.onClick);
  }

  return { label, background, text, baseColor: backgroundColor, hoverColor, activeColor };
}

export function setButtonActive(button: RexButton, active: boolean): void {
  button.background.setFillStyle(active ? button.activeColor : button.baseColor);
}

export function showBadgeNotification(
  scene: Phaser.Scene,
  message: string,
  color: number,
  durationMs = 1500,
): void {
  const { width, height } = scene.scale;
  const badgeLabel = scene.rexUI.add.badgeLabel({
    x: width / 2,
    y: height / 2,
    background: scene.rexUI.add.roundRectangle(0, 0, 240, 70, 10, color, 0.9),
    main: scene.add
      .text(0, 0, message, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5),
  });

  badgeLabel.setDepth(1000);
  badgeLabel.setAlpha(0);
  badgeLabel.layout();

  scene.tweens.add({
    targets: badgeLabel,
    alpha: { from: 0, to: 1 },
    duration: 200,
    onComplete: () => {
      scene.time.delayedCall(durationMs, () => {
        scene.tweens.add({
          targets: badgeLabel,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            badgeLabel.destroy();
          },
        });
      });
    },
  });
}
