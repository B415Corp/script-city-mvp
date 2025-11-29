/**
 * Компонент радио-кнопки.
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
 * Конфигурация радио-кнопки
 */
export interface UIRadioConfig extends UIComponentConfig {
  label?: string;
  value: string | number;
  group?: string;
  checked?: boolean;
  size?: number;
}

/**
 * Компонент радио-кнопки
 */
export class UIRadio extends UIBaseComponent {
  private radioSize: number;
  private radioBackground!: Phaser.GameObjects.Graphics;
  private radioDot!: Phaser.GameObjects.Graphics;
  private labelText?: Phaser.GameObjects.Text;
  private isChecked: boolean;
  private radioValue: string | number;
  private radioGroup?: string;

  // Статический реестр групп радио-кнопок
  private static radioGroups: Map<string, UIRadio[]> = new Map();

  constructor(scene: Phaser.Scene, core: GameCore, config: UIRadioConfig) {
    super(scene, core, config);
    this.radioSize = config.size ?? 20;
    this.isChecked = config.checked ?? false;
    this.radioValue = config.value;
    this.radioGroup = config.group;
  }

  /**
   * Создание радио-кнопки
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // Создаем фон радио-кнопки (круг)
    this.radioBackground = this.scene.add.graphics();
    this.updateRadioBackground();

    // Создаем точку внутри (когда выбрана)
    this.radioDot = this.scene.add.graphics();
    this.updateRadioDot();

    const radioContainer = this.scene.add.container(0, 0);
    radioContainer.add([this.radioBackground, this.radioDot]);

    let totalWidth = this.radioSize;
    let totalHeight = this.radioSize;

    // Создаем label, если указан
    if ((this.config as UIRadioConfig).label) {
      this.labelText = this.scene.add.text(
        0,
        0,
        (this.config as UIRadioConfig).label!,
        createTextStyle('normal'),
      );
      this.labelText.setOrigin(0, 0.5);

      const gap = 8;
      this.labelText.x = this.radioSize / 2 + gap;
      totalWidth += gap + this.labelText.width;
      totalHeight = Math.max(totalHeight, this.labelText.height);

      radioContainer.add(this.labelText);
    }

    // Центрируем контейнер радио-кнопки
    radioContainer.x = -totalWidth / 2 + this.radioSize / 2;

    this.contentContainer.add(radioContainer);

    // Устанавливаем размеры
    this.computedSize = {
      width: totalWidth,
      height: totalHeight,
      contentWidth: totalWidth,
      contentHeight: totalHeight,
    };

    // Регистрируем в группе
    if (this.radioGroup) {
      this.registerInGroup();
    }

    // Настраиваем интерактивность
    this.setupRadioInteractivity();

    // Применяем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Обновление фона радио-кнопки
   */
  private updateRadioBackground(): void {
    this.radioBackground.clear();

    const color = this.isChecked
      ? UITheme.colors.accent.primary
      : UITheme.colors.background.secondary;
    const borderColor = this.isChecked
      ? UITheme.colors.accent.primary
      : UITheme.colors.border.primary;

    this.radioBackground.fillStyle(color, 1);
    this.radioBackground.fillCircle(0, 0, this.radioSize / 2);

    this.radioBackground.lineStyle(2, borderColor, 1);
    this.radioBackground.strokeCircle(0, 0, this.radioSize / 2);
  }

  /**
   * Обновление точки внутри радио-кнопки
   */
  private updateRadioDot(): void {
    this.radioDot.clear();

    if (this.isChecked) {
      this.radioDot.fillStyle(UITheme.colors.text.primary, 1);
      this.radioDot.fillCircle(0, 0, this.radioSize / 4);
    }
  }

  /**
   * Регистрация в группе радио-кнопок
   */
  private registerInGroup(): void {
    if (!this.radioGroup) return;

    if (!UIRadio.radioGroups.has(this.radioGroup)) {
      UIRadio.radioGroups.set(this.radioGroup, []);
    }

    UIRadio.radioGroups.get(this.radioGroup)!.push(this);
  }

  /**
   * Снятие регистрации из группы
   */
  private unregisterFromGroup(): void {
    if (!this.radioGroup) return;

    const group = UIRadio.radioGroups.get(this.radioGroup);
    if (group) {
      const index = group.indexOf(this);
      if (index !== -1) {
        group.splice(index, 1);
      }
    }
  }

  /**
   * Снятие выбора со всех радио-кнопок в группе
   */
  private uncheckGroup(): void {
    if (!this.radioGroup) return;

    const group = UIRadio.radioGroups.get(this.radioGroup);
    if (group) {
      group.forEach((radio) => {
        if (radio !== this && radio.isChecked) {
          radio.setChecked(false, false);
        }
      });
    }
  }

  /**
   * Настройка интерактивности радио-кнопки
   */
  private setupRadioInteractivity(): void {
    const hitArea = new Phaser.Geom.Rectangle(
      -this.computedSize.width / 2,
      -this.computedSize.height / 2,
      this.computedSize.width,
      this.computedSize.height,
    );

    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, {
      useHandCursor: true,
    });

    this.container.on('pointerdown', () => {
      if (!this.isDisabled) {
        this.setChecked(true);
      }
    });
  }

  /**
   * Установка состояния радио-кнопки
   */
  setChecked(checked: boolean, notifyGroup: boolean = true): void {
    if (this.isChecked === checked) return;

    this.isChecked = checked;

    // Если выбираем эту кнопку, снимаем выбор с других в группе
    if (checked && notifyGroup) {
      this.uncheckGroup();
    }

    // Обновляем визуал
    this.updateRadioBackground();
    this.updateRadioDot();

    // Вызываем onChange callback
    if (checked) {
      this.events.onChange?.(this.radioValue);
    }
  }

  /**
   * Получение состояния радио-кнопки
   */
  getChecked(): boolean {
    return this.isChecked;
  }

  /**
   * Получение значения радио-кнопки
   */
  getValue(): string | number {
    return this.radioValue;
  }

  /**
   * Изменение текста label
   */
  setLabel(label: string): void {
    if (this.labelText) {
      this.labelText.setText(label);
    }
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    this.unregisterFromGroup();
    super.destroy();
  }
}
