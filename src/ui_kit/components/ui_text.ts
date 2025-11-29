/**
 * Компонент текста.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIBaseComponent } from '../core/ui_base_component';
import { UIComponentConfig } from '../core/types';
import { createTextStyle } from '../core/ui_style';

/**
 * Конфигурация текста
 */
export interface UITextConfig extends UIComponentConfig {
  text: string;
  fontSize?: 'tiny' | 'small' | 'normal' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  color?: string;
  align?: 'left' | 'center' | 'right';
  wordWrap?: boolean;
  wordWrapWidth?: number;
}

/**
 * Компонент текста с поддержкой стилизации
 */
export class UIText extends UIBaseComponent {
  private textObject!: Phaser.GameObjects.Text;
  private textConfig: UITextConfig;

  constructor(scene: Phaser.Scene, core: GameCore, config: UITextConfig) {
    super(scene, core, config);
    this.textConfig = config;
  }

  /**
   * Создание текста
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    // Не создаем базовый фон для текста (он прозрачный)
    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    // Создаем контейнер для содержимого
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // Создаем текстовый объект
    const textStyle = createTextStyle(this.textConfig.fontSize ?? 'normal');

    // Применяем дополнительные стили
    if (this.textConfig.color) {
      textStyle.color = this.textConfig.color;
    }

    if (this.textConfig.align) {
      textStyle.align = this.textConfig.align;
    }

    if (this.textConfig.wordWrap) {
      textStyle.wordWrap = {
        width: this.textConfig.wordWrapWidth ?? 300,
        useAdvancedWrap: true,
      };
    }

    this.textObject = this.scene.add.text(0, 0, this.textConfig.text, textStyle);
    this.textObject.setOrigin(0.5);

    this.contentContainer.add(this.textObject);

    // Вычисляем размеры
    this.computedSize = {
      width: this.textObject.width,
      height: this.textObject.height,
      contentWidth: this.textObject.width,
      contentHeight: this.textObject.height,
    };

    // Применяем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Изменение текста
   */
  setText(text: string): void {
    this.textObject.setText(text);

    // Обновляем размеры
    this.computedSize = {
      width: this.textObject.width,
      height: this.textObject.height,
      contentWidth: this.textObject.width,
      contentHeight: this.textObject.height,
    };
  }

  /**
   * Изменение цвета текста
   */
  setColor(color: string): void {
    this.textObject.setColor(color);
  }

  /**
   * Изменение размера шрифта
   */
  setFontSize(fontSize: string): void {
    this.textObject.setFontSize(fontSize);

    // Обновляем размеры
    this.computedSize = {
      width: this.textObject.width,
      height: this.textObject.height,
      contentWidth: this.textObject.width,
      contentHeight: this.textObject.height,
    };
  }

  /**
   * Получение текста
   */
  getText(): string {
    return this.textObject.text;
  }

  /**
   * Получение текстового объекта Phaser
   */
  getTextObject(): Phaser.GameObjects.Text {
    return this.textObject;
  }
}
