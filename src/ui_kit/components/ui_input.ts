/**
 * Компонент текстового поля ввода.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIBaseComponent } from '../core/ui_base_component';
import { UIComponentConfig } from '../core/types';
import { createInputStyle, createTextStyle, mergeStyles } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Конфигурация input поля
 */
export interface UIInputConfig extends UIComponentConfig {
  placeholder?: string;
  value?: string;
  size?: 'small' | 'medium' | 'large';
  type?: 'text' | 'number' | 'password';
  maxLength?: number;
}

/**
 * Компонент текстового поля ввода
 */
export class UIInput extends UIBaseComponent {
  private inputText!: Phaser.GameObjects.Text;
  private placeholderText!: Phaser.GameObjects.Text;
  private cursorLine!: Phaser.GameObjects.Rectangle;
  private inputValue: string = '';
  private isFocused: boolean = false;
  private inputConfig: UIInputConfig;
  private cursorBlinkTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, core: GameCore, config: UIInputConfig = {}) {
    const size = config.size ?? 'medium';
    const baseStyle = createInputStyle(size);
    const mergedStyle = config.style ? mergeStyles(baseStyle, config.style) : baseStyle;

    super(scene, core, { ...config, style: mergedStyle });
    this.inputConfig = config;
    this.inputValue = config.value ?? '';
  }

  /**
   * Создание input поля
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;
    this.createBase(x, y);

    // Создаем текст placeholder
    const textSize = this.inputConfig.size === 'small' ? 'small' : 'normal';
    const placeholderStyle = createTextStyle(textSize);
    placeholderStyle.color = `#${UITheme.colors.text.tertiary.toString(16).padStart(6, '0')}`;

    this.placeholderText = this.scene.add.text(
      0,
      0,
      this.inputConfig.placeholder ?? '',
      placeholderStyle,
    );
    this.placeholderText.setOrigin(0, 0.5);

    // Создаем текст ввода
    this.inputText = this.scene.add.text(0, 0, this.inputValue, createTextStyle(textSize));
    this.inputText.setOrigin(0, 0.5);

    // Создаем курсор
    this.cursorLine = this.scene.add.rectangle(0, 0, 2, this.style.height! - 16, 0xffffff, 1);
    this.cursorLine.setOrigin(0, 0.5);
    this.cursorLine.setVisible(false);

    // Позиционируем элементы
    const padding = 8;
    const startX = -(this.style.width! / 2) + padding;
    this.placeholderText.x = startX;
    this.inputText.x = startX;
    this.updateCursorPosition();

    this.contentContainer.add([this.placeholderText, this.inputText, this.cursorLine]);

    // Обновляем видимость placeholder
    this.updatePlaceholderVisibility();

    // Настраиваем интерактивность
    this.setupInputInteractivity();

    // Вычисляем размеры
    this.computedSize = {
      width: this.style.width ?? 0,
      height: this.style.height ?? 0,
      contentWidth: this.inputText.width,
      contentHeight: this.inputText.height,
    };
  }

  /**
   * Настройка интерактивности input поля
   */
  private setupInputInteractivity(): void {
    this.container.on('pointerdown', () => {
      this.focus();
    });

    // Подписываемся на события клавиатуры
    this.scene.input.keyboard?.on('keydown', this.handleKeyDown, this);
  }

  /**
   * Обработка нажатия клавиш
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isFocused || this.isDisabled) return;

    if (event.key === 'Backspace') {
      if (this.inputValue.length > 0) {
        this.inputValue = this.inputValue.slice(0, -1);
        this.updateInputText();
      }
    } else if (event.key === 'Enter') {
      this.blur();
    } else if (event.key.length === 1) {
      // Проверяем максимальную длину
      if (this.inputConfig.maxLength && this.inputValue.length >= this.inputConfig.maxLength) {
        return;
      }

      // Фильтруем ввод в зависимости от типа
      if (this.inputConfig.type === 'number' && !/[0-9.]/.test(event.key)) {
        return;
      }

      if (this.inputConfig.type === 'password') {
        this.inputValue += event.key;
        this.updateInputText();
      } else {
        this.inputValue += event.key;
        this.updateInputText();
      }
    }
  }

  /**
   * Обновление текста ввода
   */
  private updateInputText(): void {
    if (this.inputConfig.type === 'password') {
      this.inputText.setText('•'.repeat(this.inputValue.length));
    } else {
      this.inputText.setText(this.inputValue);
    }

    this.updatePlaceholderVisibility();
    this.updateCursorPosition();

    // Вызываем onChange callback
    this.events.onChange?.(this.inputValue);
  }

  /**
   * Обновление видимости placeholder
   */
  private updatePlaceholderVisibility(): void {
    this.placeholderText.setVisible(this.inputValue.length === 0 && !this.isFocused);
  }

  /**
   * Обновление позиции курсора
   */
  private updateCursorPosition(): void {
    const padding = 8;
    const startX = -(this.style.width! / 2) + padding;
    this.cursorLine.x = startX + this.inputText.width + 2;
  }

  /**
   * Установка фокуса на input
   */
  focus(): void {
    if (this.isFocused || this.isDisabled) return;

    this.isFocused = true;
    this.cursorLine.setVisible(true);

    // Обновляем стиль границы
    if (this.background instanceof Phaser.GameObjects.Rectangle) {
      this.background.setStrokeStyle(2, UITheme.colors.accent.primary);
    }

    // Запускаем мигание курсора
    this.startCursorBlink();

    // Вызываем onFocus callback
    this.events.onFocus?.();
  }

  /**
   * Снятие фокуса с input
   */
  blur(): void {
    if (!this.isFocused) return;

    this.isFocused = false;
    this.cursorLine.setVisible(false);

    // Восстанавливаем стиль границы
    if (this.background instanceof Phaser.GameObjects.Rectangle) {
      this.background.setStrokeStyle(
        this.style.border?.width ?? 1,
        this.style.border?.color ?? UITheme.colors.border.primary,
      );
    }

    // Останавливаем мигание курсора
    this.stopCursorBlink();

    this.updatePlaceholderVisibility();

    // Вызываем onBlur callback
    this.events.onBlur?.();
  }

  /**
   * Запуск мигания курсора
   */
  private startCursorBlink(): void {
    this.stopCursorBlink();

    this.cursorBlinkTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (this.cursorLine) {
          this.cursorLine.setVisible(!this.cursorLine.visible);
        }
      },
      loop: true,
    });
  }

  /**
   * Остановка мигания курсора
   */
  private stopCursorBlink(): void {
    if (this.cursorBlinkTimer) {
      this.cursorBlinkTimer.destroy();
      this.cursorBlinkTimer = undefined;
    }
  }

  /**
   * Установка значения input
   */
  setValue(value: string): void {
    this.inputValue = value;
    this.updateInputText();
  }

  /**
   * Получение значения input
   */
  getValue(): string {
    return this.inputValue;
  }

  /**
   * Очистка input
   */
  clear(): void {
    this.setValue('');
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    this.scene.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.stopCursorBlink();
    super.destroy();
  }
}
