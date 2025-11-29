/**
 * Компонент чекбокса.
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
 * Конфигурация чекбокса
 */
export interface UICheckboxConfig extends UIComponentConfig {
  label?: string;
  checked?: boolean;
  size?: number;
}

/**
 * Компонент чекбокса
 */
export class UICheckbox extends UIBaseComponent {
  private checkboxSize: number;
  private checkboxBackground!: Phaser.GameObjects.Rectangle;
  private checkmark!: Phaser.GameObjects.Text;
  private labelText?: Phaser.GameObjects.Text;
  private isChecked: boolean;

  constructor(scene: Phaser.Scene, core: GameCore, config: UICheckboxConfig = {}) {
    super(scene, core, config);
    this.checkboxSize = config.size ?? 24;
    this.isChecked = config.checked ?? false;
  }

  /**
   * Создание чекбокса
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // Создаем фон чекбокса
    this.checkboxBackground = this.scene.add.rectangle(
      0,
      0,
      this.checkboxSize,
      this.checkboxSize,
      UITheme.colors.background.secondary,
      1,
    );
    this.checkboxBackground.setStrokeStyle(2, UITheme.colors.border.primary);
    this.checkboxBackground.setOrigin(0.5);

    // Создаем галочку
    this.checkmark = this.scene.add.text(0, 0, '✓', {
      fontSize: `${this.checkboxSize - 4}px`,
      color: `#${UITheme.colors.text.primary.toString(16).padStart(6, '0')}`,
      fontFamily: UITheme.fonts.primary,
    });
    this.checkmark.setOrigin(0.5);
    this.checkmark.setVisible(this.isChecked);

    const checkboxContainer = this.scene.add.container(0, 0);
    checkboxContainer.add([this.checkboxBackground, this.checkmark]);

    let totalWidth = this.checkboxSize;
    let totalHeight = this.checkboxSize;

    // Создаем label, если указан
    if ((this.config as UICheckboxConfig).label) {
      this.labelText = this.scene.add.text(
        0,
        0,
        (this.config as UICheckboxConfig).label!,
        createTextStyle('normal'),
      );
      this.labelText.setOrigin(0, 0.5);

      const gap = 8;
      this.labelText.x = this.checkboxSize / 2 + gap;
      totalWidth += gap + this.labelText.width;
      totalHeight = Math.max(totalHeight, this.labelText.height);

      checkboxContainer.add(this.labelText);
    }

    // Центрируем контейнер чекбокса
    checkboxContainer.x = -totalWidth / 2 + this.checkboxSize / 2;

    this.contentContainer.add(checkboxContainer);

    // Устанавливаем размеры
    this.computedSize = {
      width: totalWidth,
      height: totalHeight,
      contentWidth: totalWidth,
      contentHeight: totalHeight,
    };

    // Настраиваем интерактивность
    this.setupCheckboxInteractivity();

    // Применяем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Настройка интерактивности чекбокса
   */
  private setupCheckboxInteractivity(): void {
    const hitArea = new Phaser.Geom.Rectangle(
      -this.computedSize.width / 2,
      -this.computedSize.height / 2,
      this.computedSize.width,
      this.computedSize.height,
    );

    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.container.input!.cursor = 'pointer';

    this.container.on('pointerdown', () => {
      if (!this.isDisabled) {
        this.toggle();
      }
    });
  }

  /**
   * Переключение состояния чекбокса
   */
  toggle(): void {
    this.setChecked(!this.isChecked);
  }

  /**
   * Установка состояния чекбокса
   */
  setChecked(checked: boolean): void {
    this.isChecked = checked;
    this.checkmark.setVisible(checked);

    // Обновляем цвет фона
    if (checked) {
      this.checkboxBackground.setFillStyle(UITheme.colors.accent.primary);
      this.checkboxBackground.setStrokeStyle(2, UITheme.colors.accent.primary);
    } else {
      this.checkboxBackground.setFillStyle(UITheme.colors.background.secondary);
      this.checkboxBackground.setStrokeStyle(2, UITheme.colors.border.primary);
    }

    // Вызываем onChange callback
    this.events.onChange?.(checked);
  }

  /**
   * Получение состояния чекбокса
   */
  getChecked(): boolean {
    return this.isChecked;
  }

  /**
   * Изменение текста label
   */
  setLabel(label: string): void {
    if (this.labelText) {
      this.labelText.setText(label);
    }
  }
}
