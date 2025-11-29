/**
 * Компонент слайдера.
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
 * Конфигурация слайдера
 */
export interface UISliderConfig extends UIComponentConfig {
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  width?: number;
  showValue?: boolean;
  label?: string;
}

/**
 * Компонент слайдера
 */
export class UISlider extends UIBaseComponent {
  private sliderConfig: UISliderConfig;
  private sliderTrack!: Phaser.GameObjects.Rectangle;
  private sliderFill!: Phaser.GameObjects.Rectangle;
  private sliderHandle!: Phaser.GameObjects.Graphics;
  private valueText?: Phaser.GameObjects.Text;
  private labelText?: Phaser.GameObjects.Text;

  private minValue: number;
  private maxValue: number;
  private currentValue: number;
  private step: number;
  private sliderWidth: number;
  private isDragging: boolean = false;

  constructor(scene: Phaser.Scene, core: GameCore, config: UISliderConfig = {}) {
    super(scene, core, config);
    this.sliderConfig = config;
    this.minValue = config.min ?? 0;
    this.maxValue = config.max ?? 100;
    this.currentValue = config.value ?? this.minValue;
    this.step = config.step ?? 1;
    this.sliderWidth = config.width ?? 200;
  }

  /**
   * Создание слайдера
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    const sliderContainer = this.scene.add.container(0, 0);
    const trackHeight = 4;
    const handleSize = 16;

    // Создаем трек (фон)
    this.sliderTrack = this.scene.add.rectangle(
      0,
      0,
      this.sliderWidth,
      trackHeight,
      UITheme.colors.background.tertiary,
      1,
    );
    this.sliderTrack.setOrigin(0, 0.5);

    // Создаем заполнение (показывает текущее значение)
    const fillWidth = this.getPercentage() * this.sliderWidth;
    this.sliderFill = this.scene.add.rectangle(
      0,
      0,
      fillWidth,
      trackHeight,
      UITheme.colors.accent.primary,
      1,
    );
    this.sliderFill.setOrigin(0, 0.5);

    // Создаем ручку (handle)
    this.sliderHandle = this.scene.add.graphics();
    this.updateSliderHandle(handleSize);

    sliderContainer.add([this.sliderTrack, this.sliderFill, this.sliderHandle]);

    let totalWidth = this.sliderWidth;
    let totalHeight = handleSize;
    let offsetY = 0;

    // Создаем label, если указан
    if (this.sliderConfig.label) {
      this.labelText = this.scene.add.text(
        0,
        0,
        this.sliderConfig.label,
        createTextStyle('normal'),
      );
      this.labelText.setOrigin(0, 0.5);
      sliderContainer.add(this.labelText);

      this.labelText.x = -this.sliderWidth / 2;
      this.labelText.y = -handleSize / 2 - 10;
      totalHeight += this.labelText.height + 10;
      offsetY = (this.labelText.height + 10) / 2;
    }

    // Создаем текст значения, если нужно
    if (this.sliderConfig.showValue !== false) {
      this.valueText = this.scene.add.text(
        0,
        0,
        this.formatValue(this.currentValue),
        createTextStyle('small'),
      );
      this.valueText.setOrigin(0.5);
      sliderContainer.add(this.valueText);

      this.valueText.x = this.sliderWidth / 2 + 30;
      totalWidth += 60;
    }

    // Центрируем track и handle
    this.sliderTrack.x = -this.sliderWidth / 2;
    this.sliderFill.x = -this.sliderWidth / 2;
    this.updateHandlePosition();

    sliderContainer.y = offsetY;
    this.contentContainer.add(sliderContainer);

    // Устанавливаем размеры
    this.computedSize = {
      width: totalWidth,
      height: totalHeight,
      contentWidth: totalWidth,
      contentHeight: totalHeight,
    };

    // Настраиваем интерактивность
    this.setupSliderInteractivity();

    // Применяем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Обновление ручки слайдера
   */
  private updateSliderHandle(size: number): void {
    this.sliderHandle.clear();
    this.sliderHandle.fillStyle(UITheme.colors.text.primary, 1);
    this.sliderHandle.fillCircle(0, 0, size / 2);

    if (this.isDragging) {
      this.sliderHandle.lineStyle(2, UITheme.colors.accent.primary, 1);
      this.sliderHandle.strokeCircle(0, 0, size / 2 + 2);
    }
  }

  /**
   * Обновление позиции ручки
   */
  private updateHandlePosition(): void {
    const percentage = this.getPercentage();
    this.sliderHandle.x = -this.sliderWidth / 2 + percentage * this.sliderWidth;

    // Обновляем ширину заполнения
    this.sliderFill.width = percentage * this.sliderWidth;
  }

  /**
   * Получение процента текущего значения
   */
  private getPercentage(): number {
    return (this.currentValue - this.minValue) / (this.maxValue - this.minValue);
  }

  /**
   * Форматирование значения для отображения
   */
  private formatValue(value: number): string {
    return value.toFixed(this.step < 1 ? 2 : 0);
  }

  /**
   * Настройка интерактивности слайдера
   */
  private setupSliderInteractivity(): void {
    const hitArea = new Phaser.Geom.Rectangle(
      -this.sliderWidth / 2 - 8,
      -8,
      this.sliderWidth + 16,
      16,
    );

    this.contentContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, {
      useHandCursor: true,
    });

    this.contentContainer.on('pointerdown', this.onDragStart, this);
    this.scene.input.on('pointermove', this.onDrag, this);
    this.scene.input.on('pointerup', this.onDragEnd, this);
  }

  /**
   * Начало перетаскивания
   */
  private onDragStart(pointer: Phaser.Input.Pointer): void {
    if (this.isDisabled) return;

    this.isDragging = true;
    this.updateSliderHandle(16);
    this.updateValueFromPointer(pointer);
  }

  /**
   * Перетаскивание
   */
  private onDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.isDisabled) return;

    this.updateValueFromPointer(pointer);
  }

  /**
   * Конец перетаскивания
   */
  private onDragEnd(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.updateSliderHandle(16);
  }

  /**
   * Обновление значения из позиции указателя
   */
  private updateValueFromPointer(pointer: Phaser.Input.Pointer): void {
    // Преобразуем координаты указателя в локальные координаты слайдера
    const localX = pointer.x - this.container.x - this.contentContainer.x + this.sliderWidth / 2;

    // Ограничиваем в пределах слайдера
    const clampedX = Phaser.Math.Clamp(localX, 0, this.sliderWidth);

    // Вычисляем процент
    const percentage = clampedX / this.sliderWidth;

    // Вычисляем новое значение
    const rawValue = this.minValue + percentage * (this.maxValue - this.minValue);

    // Применяем step
    const steppedValue = Math.round(rawValue / this.step) * this.step;

    // Обновляем значение
    this.setValue(steppedValue);
  }

  /**
   * Установка значения слайдера
   */
  setValue(value: number): void {
    const oldValue = this.currentValue;
    this.currentValue = Phaser.Math.Clamp(value, this.minValue, this.maxValue);

    // Обновляем визуал
    this.updateHandlePosition();

    if (this.valueText) {
      this.valueText.setText(this.formatValue(this.currentValue));
    }

    // Вызываем onChange callback только если значение изменилось
    if (oldValue !== this.currentValue) {
      this.events.onChange?.(this.currentValue);
    }
  }

  /**
   * Получение значения слайдера
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    this.scene.input.off('pointermove', this.onDrag, this);
    this.scene.input.off('pointerup', this.onDragEnd, this);
    super.destroy();
  }
}
