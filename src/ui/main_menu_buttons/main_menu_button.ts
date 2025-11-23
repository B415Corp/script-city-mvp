import Phaser from 'phaser';

/**
 * Стили кнопки главного меню
 */
export interface MainMenuButtonStyle {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  padding?: { x: number; y: number };
}

/**
 * Параметры создания кнопки главного меню
 */
export interface MainMenuButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  onClick: () => void;
  style?: MainMenuButtonStyle;
}

/**
 * Создает переиспользуемую кнопку главного меню
 * Теги: arch:ui, tech:phaser
 */
export function createMainMenuButton(config: MainMenuButtonConfig): Phaser.GameObjects.Text {
  const { scene, x, y, text, onClick, style = {} } = config;

  const defaultStyle: Required<MainMenuButtonStyle> = {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Arial',
    backgroundColor: '#34495e',
    hoverBackgroundColor: '#2c3e50',
    padding: { x: 20, y: 10 },
  };

  const finalStyle = {
    fontSize: style.fontSize ?? defaultStyle.fontSize,
    color: style.color ?? defaultStyle.color,
    fontFamily: style.fontFamily ?? defaultStyle.fontFamily,
    backgroundColor: style.backgroundColor ?? defaultStyle.backgroundColor,
    padding: style.padding ?? defaultStyle.padding,
  };

  const hoverBackgroundColor = style.hoverBackgroundColor ?? defaultStyle.hoverBackgroundColor;

  const button = scene.add
    .text(x, y, text, finalStyle)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      button.setStyle({ backgroundColor: hoverBackgroundColor });
    })
    .on('pointerout', () => {
      button.setStyle({ backgroundColor: finalStyle.backgroundColor });
    })
    .on('pointerdown', onClick);

  return button;
}
