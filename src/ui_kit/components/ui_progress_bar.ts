/**
 * Компонент индикатора прогресса.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIBaseComponent } from '../core/ui_base_component';
import { UIComponentConfig } from '../core/types';
import { createTextStyle } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Конфигурация progress bar
 */
export interface UIProgressBarConfig extends UIComponentConfig {
  value?: number; // 0-100
  width?: number;
  height?: number;
  variant?: 'normal' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
}

/**
 * Компонент индикатора прогресса
 */
export class UIProgressBar extends UIBaseComponent {
  private progressConfig: UIProgressBarConfig;
  private progressTrack!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private percentageText?: Phaser.GameObjects.Text;
  private currentValue: number;
  private progressWidth: number;
  private progressHeight: number;

  constructor(scene: Phaser.Scene, core: GameCore, config: UIProgressBarConfig = {}) {
    super(scene, core, config);
    this.progressConfig = config;
    this.currentValue = Phaser.Math.Clamp(config.value ?? 0, 0, 100);
    this.progressWidth = config.width ?? 200;
    this.progressHeight = config.height ?? 20;
  }

  /**
   * Создание progress bar
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    const progressContainer = this.scene.add.container(0, 0);

    // Создаем трек (фон)
    this.progressTrack = this.scene.add.rectangle(
      0,
      0,
      this.progressWidth,
      this.progressHeight,
      UITheme.colors.background.tertiary,
      1,
    );
    this.progressTrack.setOrigin(0, 0.5);
    this.progressTrack.setStrokeStyle(1, UITheme.colors.border.primary);

    // Создаем заполнение
    const fillWidth = (this.currentValue / 100) * this.progressWidth;
    const fillColor = this.getVariantColor();

    this.progressFill = this.scene.add.rectangle(
      0,
      0,
      fillWidth,
      this.progressHeight,
      fillColor,
      1,
    );
    this.progressFill.setOrigin(0, 0.5);

    progressContainer.add([this.progressTrack, this.progressFill]);

    // Центрируем track и fill
    this.progressTrack.x = -this.progressWidth / 2;
    this.progressFill.x = -this.progressWidth / 2;

    let totalWidth = this.progressWidth;

    // Создаем текст процента, если нужно
    if (this.progressConfig.showPercentage !== false) {
      this.percentageText = this.scene.add.text(
        0,
        0,
        `${Math.round(this.currentValue)}%`,
        createTextStyle('small'),
      );
      this.percentageText.setOrigin(0, 0.5);
      progressContainer.add(this.percentageText);

      this.percentageText.x = this.progressWidth / 2 + 8;
      totalWidth += 50;
    }

    this.contentContainer.add(progressContainer);

    // Устанавливаем размеры
    this.computedSize = {
      width: totalWidth,
      height: this.progressHeight,
      contentWidth: totalWidth,
      contentHeight: this.progressHeight,
    };

    // Применяем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Получение цвета для варианта
   */
  private getVariantColor(): number {
    switch (this.progressConfig.variant) {
      case 'success':
        return UITheme.colors.state.success;
      case 'warning':
        return UITheme.colors.state.warning;
      case 'error':
        return UITheme.colors.state.error;
      case 'normal':
      default:
        return UITheme.colors.accent.primary;
    }
  }

  /**
   * Установка значения прогресса
   */
  setValue(value: number, animate: boolean = true): void {
    const oldValue = this.currentValue;
    this.currentValue = Phaser.Math.Clamp(value, 0, 100);

    const targetWidth = (this.currentValue / 100) * this.progressWidth;

    if (animate && this.progressConfig.animated !== false) {
      // Анимируем изменение ширины
      this.scene.tweens.add({
        targets: this.progressFill,
        width: targetWidth ?? 0,
        duration: UITheme.animations.duration.normal,
        ease: UITheme.animations.easing.easeOut,
      });

      // Анимируем изменение процента
      if (this.percentageText) {
        this.scene.tweens.addCounter({
          from: oldValue,
          to: this.currentValue,
          duration: UITheme.animations.duration.normal,
          ease: UITheme.animations.easing.easeOut,
          onUpdate: (tween) => {
            const value = tween.getValue() ?? 0;
            if (this.percentageText) {
              this.percentageText.setText(`${Math.round(value)}%`);
            }
          },
        });
      }
    } else {
      // Мгновенное обновление
      this.progressFill.width = targetWidth ?? 0;
      if (this.percentageText) {
        this.percentageText.setText(`${Math.round(this.currentValue)}%`);
      }
    }

    // Вызываем onChange callback
    if (oldValue !== this.currentValue) {
      this.events.onChange?.(this.currentValue);
    }
  }

  /**
   * Получение значения прогресса
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Установка варианта (изменяет цвет)
   */
  setVariant(variant: 'normal' | 'success' | 'warning' | 'error'): void {
    this.progressConfig.variant = variant;
    this.progressFill.setFillStyle(this.getVariantColor());
  }
}
