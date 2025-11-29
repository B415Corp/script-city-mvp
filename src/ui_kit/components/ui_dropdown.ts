/**
 * Компонент выпадающего списка.
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
 * Опция dropdown
 */
export interface UIDropdownOption {
  label: string;
  value: string | number;
}

/**
 * Конфигурация dropdown
 */
export interface UIDropdownConfig extends UIComponentConfig {
  options: UIDropdownOption[];
  selectedValue?: string | number;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  maxVisibleOptions?: number;
  direction?: 'up' | 'down';
}

/**
 * Компонент выпадающего списка
 */
export class UIDropdown extends UIBaseComponent {
  private dropdownConfig: UIDropdownConfig;
  private selectedOption?: UIDropdownOption;
  private isOpen: boolean = false;

  private selectedText!: Phaser.GameObjects.Text;
  private arrowIcon!: Phaser.GameObjects.Text;
  private optionsContainer!: Phaser.GameObjects.Container;
  private optionsBackground!: Phaser.GameObjects.Rectangle;
  private optionItems: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, core: GameCore, config: UIDropdownConfig) {
    const size = config.size ?? 'medium';
    const baseStyle = createInputStyle(size);
    const mergedStyle = config.style ? mergeStyles(baseStyle, config.style) : baseStyle;

    super(scene, core, { ...config, style: mergedStyle });
    this.dropdownConfig = config;

    // Устанавливаем начальное значение
    if (config.selectedValue !== undefined) {
      this.selectedOption = config.options.find((opt) => opt.value === config.selectedValue);
    }
  }

  /**
   * Создание dropdown
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;
    this.createBase(x, y);

    // Создаем текст выбранной опции
    const textSize = this.dropdownConfig.size === 'small' ? 'small' : 'normal';
    const displayText =
      this.selectedOption?.label ?? this.dropdownConfig.placeholder ?? 'Select...';

    this.selectedText = this.scene.add.text(0, 0, displayText, createTextStyle(textSize));
    this.selectedText.setOrigin(0, 0.5);

    // Создаем стрелку
    this.arrowIcon = this.scene.add.text(0, 0, '▼', {
      fontSize: '12px',
      color: `#${UITheme.colors.text.secondary.toString(16).padStart(6, '0')}`,
    });
    this.arrowIcon.setOrigin(1, 0.5);

    // Позиционируем элементы
    const padding = 8;
    const startX = -(this.style.width! / 2) + padding;
    const endX = this.style.width! / 2 - padding;

    this.selectedText.x = startX;
    this.arrowIcon.x = endX;

    this.contentContainer.add([this.selectedText, this.arrowIcon]);

    // Создаем контейнер для опций (изначально скрыт)
    this.createOptionsContainer();

    // Настраиваем интерактивность
    this.setupDropdownInteractivity();

    // Вычисляем размеры
    this.computedSize = {
      width: this.style.width ?? 0,
      height: this.style.height ?? 0,
      contentWidth: this.selectedText.width,
      contentHeight: this.selectedText.height,
    };
  }

  /**
   * Создание контейнера с опциями
   */
  private createOptionsContainer(): void {
    const optionHeight = 32;
    const maxVisible = this.dropdownConfig.maxVisibleOptions ?? 5;
    const visibleOptions = Math.min(this.dropdownConfig.options.length, maxVisible);
    const containerHeight = visibleOptions * optionHeight;

    // Создаем контейнер (позиция будет установлена при открытии)
    this.optionsContainer = this.scene.add.container(0, 0);
    this.optionsContainer.setVisible(false);

    // Создаем фон для опций
    this.optionsBackground = this.scene.add.rectangle(
      0,
      0,
      this.style.width!,
      containerHeight,
      UITheme.colors.background.secondary,
      1,
    );
    this.optionsBackground.setStrokeStyle(2, UITheme.colors.border.primary);

    this.optionsContainer.add(this.optionsBackground);

    // Создаем опции
    this.dropdownConfig.options.forEach((option, index) => {
      const optionY = -containerHeight / 2 + optionHeight / 2 + index * optionHeight;
      const optionItem = this.createOptionItem(option, optionY, optionHeight);
      this.optionItems.push(optionItem);
      this.optionsContainer.add(optionItem);
    });

    this.container.add(this.optionsContainer);
  }

  /**
   * Создание элемента опции
   */
  private createOptionItem(
    option: UIDropdownOption,
    y: number,
    height: number,
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    // Фон опции
    const bg = this.scene.add.rectangle(
      0,
      0,
      this.style.width!,
      height,
      UITheme.colors.background.secondary,
      0,
    );

    // Текст опции
    const textSize = this.dropdownConfig.size === 'small' ? 'small' : 'normal';
    const text = this.scene.add.text(0, 0, option.label, createTextStyle(textSize));
    text.setOrigin(0, 0.5);
    text.x = -(this.style.width! / 2) + 8;

    container.add([bg, text]);

    // Интерактивность
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(UITheme.colors.background.tertiary, 1);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(UITheme.colors.background.secondary, 0);
    });

    bg.on('pointerdown', () => {
      this.selectOption(option);
      this.close();
    });

    return container;
  }

  /**
   * Настройка интерактивности dropdown
   */
  private setupDropdownInteractivity(): void {
    this.container.on('pointerdown', () => {
      if (!this.isDisabled) {
        this.toggle();
      }
    });

    // Закрытие при клике вне dropdown
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isOpen) {
        const bounds = this.container.getBounds();
        const optionsBounds = this.optionsContainer.getBounds();

        if (
          !bounds.contains(pointer.x, pointer.y) &&
          !optionsBounds.contains(pointer.x, pointer.y)
        ) {
          this.close();
        }
      }
    });
  }

  /**
   * Открытие dropdown
   */
  open(): void {
    if (this.isOpen || this.isDisabled) return;

    this.isOpen = true;
    this.updateOptionsContainerPosition();
    this.optionsContainer.setVisible(true);

    // Анимация появления
    this.animator.animateIn(this.optionsContainer, {
      type: 'fade',
      duration: UITheme.animations.duration.fast,
    });
  }

  /**
   * Обновление позиции контейнера опций в зависимости от направления
   */
  private updateOptionsContainerPosition(): void {
    const optionHeight = 32;
    const maxVisible = this.dropdownConfig.maxVisibleOptions ?? 5;
    const visibleOptions = Math.min(this.dropdownConfig.options.length, maxVisible);
    const containerHeight = visibleOptions * optionHeight;
    const direction = this.dropdownConfig.direction ?? 'down';

    if (direction === 'up') {
      // Открываем вверх
      this.optionsContainer.y = -(this.style.height! / 2) - containerHeight / 2 - 4;
      // При открытии стрелка меняется на противоположную
      this.arrowIcon.setText('▼');
    } else {
      // Открываем вниз (по умолчанию)
      this.optionsContainer.y = this.style.height! / 2 + containerHeight / 2 + 4;
      // При открытии стрелка меняется на противоположную
      this.arrowIcon.setText('▲');
    }
  }

  /**
   * Закрытие dropdown
   */
  close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    const direction = this.dropdownConfig.direction ?? 'down';
    // При закрытии стрелка показывает направление открытия
    this.arrowIcon.setText(direction === 'up' ? '▲' : '▼');

    // Анимация исчезновения
    this.animator.animateOut(this.optionsContainer, {
      type: 'fade',
      duration: UITheme.animations.duration.fast,
    });

    this.scene.time.delayedCall(UITheme.animations.duration.fast, () => {
      this.optionsContainer.setVisible(false);
    });
  }

  /**
   * Переключение состояния dropdown
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Выбор опции
   */
  selectOption(option: UIDropdownOption): void {
    this.selectedOption = option;
    this.selectedText.setText(option.label);

    // Применяем обычный цвет текста (не placeholder)
    this.selectedText.setColor(`#${UITheme.colors.text.primary.toString(16).padStart(6, '0')}`);

    // Вызываем onChange callback
    this.events.onChange?.(option.value);
  }

  /**
   * Установка выбранного значения
   */
  setValue(value: string | number): void {
    const option = this.dropdownConfig.options.find((opt) => opt.value === value);
    if (option) {
      this.selectOption(option);
    }
  }

  /**
   * Получение выбранного значения
   */
  getValue(): string | number | undefined {
    return this.selectedOption?.value;
  }

  /**
   * Получение выбранной опции
   */
  getSelectedOption(): UIDropdownOption | undefined {
    return this.selectedOption;
  }
}
