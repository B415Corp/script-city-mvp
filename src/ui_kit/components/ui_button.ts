/**
 * Компонент кнопки.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIBaseComponent } from '../core/ui_base_component';
import { UIComponentConfig } from '../core/types';
import { createButtonStyle, createTextStyle, mergeStyles } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Конфигурация кнопки
 */
export interface UIButtonConfig extends UIComponentConfig {
  text?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

/**
 * Компонент кнопки с поддержкой текста и иконок
 */
export class UIButton extends UIBaseComponent {
  private buttonText?: Phaser.GameObjects.Text;
  private iconText?: Phaser.GameObjects.Text;
  private buttonConfig: UIButtonConfig;

  constructor(scene: Phaser.Scene, core: GameCore, config: UIButtonConfig = {}) {
    const size = config.size ?? 'medium';
    const baseStyle = createButtonStyle(size);

    // Применяем вариант кнопки
    if (config.variant) {
      baseStyle.background = {
        ...baseStyle.background,
        ...UIButton.getVariantColors(config.variant).background,
      };
      if (baseStyle.hover) {
        baseStyle.hover.background = {
          ...baseStyle.hover.background,
          ...UIButton.getVariantColors(config.variant).hover,
        };
      }
      if (baseStyle.active) {
        baseStyle.active.background = {
          ...baseStyle.active.background,
          ...UIButton.getVariantColors(config.variant).active,
        };
      }
    }

    const mergedStyle = config.style ? mergeStyles(baseStyle, config.style) : baseStyle;

    super(scene, core, { ...config, style: mergedStyle });
    this.buttonConfig = config;
  }

  /**
   * Получение цветов для разных вариантов кнопок
   */
  private static getVariantColors(variant: string): {
    background: { color: number };
    hover: { background: { color: number } };
    active: { background: { color: number } };
  } {
    switch (variant) {
      case 'success':
        return {
          background: { color: UITheme.colors.state.success },
          hover: { background: { color: UITheme.colors.state.successHover } },
          active: { background: { color: UITheme.colors.state.success } },
        };
      case 'warning':
        return {
          background: { color: UITheme.colors.state.warning },
          hover: { background: { color: UITheme.colors.state.warningHover } },
          active: { background: { color: UITheme.colors.state.warning } },
        };
      case 'error':
        return {
          background: { color: UITheme.colors.state.error },
          hover: { background: { color: UITheme.colors.state.errorHover } },
          active: { background: { color: UITheme.colors.state.error } },
        };
      case 'primary':
      default:
        return {
          background: { color: UITheme.colors.accent.primary },
          hover: { background: { color: UITheme.colors.accent.hover } },
          active: { background: { color: UITheme.colors.accent.secondary } },
        };
    }
  }

  /**
   * Создание кнопки
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;
    this.createBase(x, y);

    // Создаем контейнер для содержимого (иконка + текст)
    const contentContainer = this.scene.add.container(0, 0);

    let totalWidth = 0;

    // Создаем иконку, если указана
    if (this.buttonConfig.icon) {
      const iconSize = this.buttonConfig.size === 'small' ? 'small' : 'medium';
      this.iconText = this.scene.add.text(0, 0, this.buttonConfig.icon, createTextStyle(iconSize));
      this.iconText.setOrigin(0.5);
      contentContainer.add(this.iconText);
      totalWidth += this.iconText.width;
    }

    // Создаем текст, если указан
    if (this.buttonConfig.text) {
      const textSize = this.buttonConfig.size === 'small' ? 'small' : 'normal';
      this.buttonText = this.scene.add.text(
        0,
        0,
        this.buttonConfig.text,
        createTextStyle(textSize),
      );
      this.buttonText.setOrigin(0.5);
      contentContainer.add(this.buttonText);
      totalWidth += this.buttonText.width;
    }

    // Позиционируем иконку и текст
    if (this.iconText && this.buttonText) {
      const gap = 8;
      totalWidth += gap;
      this.iconText.x = -totalWidth / 2 + this.iconText.width / 2;
      this.buttonText.x = totalWidth / 2 - this.buttonText.width / 2;
    }

    this.contentContainer.add(contentContainer);

    // Вычисляем размеры компонента
    this.computedSize = {
      width: this.style.width ?? 0,
      height: this.style.height ?? 0,
      contentWidth: totalWidth,
      contentHeight: this.buttonText?.height ?? this.iconText?.height ?? 0,
    };
  }

  /**
   * Изменение текста кнопки
   */
  setText(text: string): void {
    if (this.buttonText) {
      this.buttonText.setText(text);
    } else {
      const textSize = this.buttonConfig.size === 'small' ? 'small' : 'normal';
      this.buttonText = this.scene.add.text(0, 0, text, createTextStyle(textSize));
      this.buttonText.setOrigin(0.5);
      this.contentContainer.add(this.buttonText);
    }
  }

  /**
   * Изменение иконки кнопки
   */
  setIcon(icon: string): void {
    if (this.iconText) {
      this.iconText.setText(icon);
    } else {
      const iconSize = this.buttonConfig.size === 'small' ? 'small' : 'medium';
      this.iconText = this.scene.add.text(0, 0, icon, createTextStyle(iconSize));
      this.iconText.setOrigin(0.5);
      this.contentContainer.add(this.iconText);
    }
  }

  /**
   * Получение текста кнопки
   */
  getText(): string {
    return this.buttonText?.text ?? '';
  }
}
