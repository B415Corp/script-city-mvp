/**
 * Компонент всплывающей подсказки (tooltip).
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIAnimator } from '../core/ui_animator';
import { createTextStyle } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Позиция tooltip относительно элемента
 */
export type UITooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Конфигурация tooltip
 */
export interface UITooltipConfig {
  text: string;
  position?: UITooltipPosition;
  delay?: number;
  maxWidth?: number;
}

/**
 * Компонент всплывающей подсказки
 */
export class UITooltip extends UIComponent {
  private tooltipConfig: UITooltipConfig;
  private tooltipBackground!: Phaser.GameObjects.Graphics;
  private tooltipText!: Phaser.GameObjects.Text;
  private animator: UIAnimator;
  private showTimer?: Phaser.Time.TimerEvent;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene, core: GameCore, config: UITooltipConfig) {
    super(scene, core);
    this.tooltipConfig = {
      position: 'top',
      delay: 500,
      maxWidth: 200,
      ...config,
    };
    this.animator = new UIAnimator(scene);
  }

  /**
   * Создание tooltip
   */
  create(): void {
    // Создаем контейнер с высоким depth
    super.createContainer(0, 0, UIComponent.DEPTH.UI_NOTIFICATIONS);

    // Создаем текст
    const textStyle = createTextStyle('small');
    textStyle.wordWrap = {
      width: this.tooltipConfig.maxWidth!,
      useAdvancedWrap: true,
    };

    this.tooltipText = this.scene.add.text(0, 0, this.tooltipConfig.text, textStyle);
    this.tooltipText.setOrigin(0.5);
    this.tooltipText.setPadding(8, 6, 8, 6);

    // Создаем фон
    const padding = 8;
    const width = this.tooltipText.width + padding * 2;
    const height = this.tooltipText.height + padding * 2;

    this.tooltipBackground = this.scene.add.graphics();
    this.tooltipBackground.fillStyle(UITheme.colors.background.modal, 0.95);
    this.tooltipBackground.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      UITheme.sizes.borderRadius.sm,
    );

    this.tooltipBackground.lineStyle(1, UITheme.colors.border.secondary, 0.8);
    this.tooltipBackground.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      UITheme.sizes.borderRadius.sm,
    );

    this.container.add([this.tooltipBackground, this.tooltipText]);

    // Изначально скрываем tooltip
    this.container.setVisible(false);
    this.container.setAlpha(0);

    // Вызываем onMount после создания
    this.onMount();
  }

  /**
   * Показать tooltip около элемента
   */
  showNear(target: Phaser.GameObjects.GameObject): void {
    if (this.isVisible) return;

    // Отменяем предыдущий таймер, если есть
    if (this.showTimer) {
      this.showTimer.destroy();
    }

    // Показываем с задержкой
    this.showTimer = this.scene.time.delayedCall(this.tooltipConfig.delay!, () => {
      this.isVisible = true;
      this.container.setVisible(true);

      // Позиционируем tooltip относительно элемента
      this.positionNearTarget(target);

      // Анимация появления
      this.animator.animateIn(this.container, {
        type: 'fade',
        duration: UITheme.animations.duration.fast,
      });
    });
  }

  /**
   * Позиционирование tooltip относительно элемента
   */
  private positionNearTarget(target: Phaser.GameObjects.GameObject): void {
    // Проверяем наличие свойств позиции
    if (!('x' in target && 'y' in target)) {
      return;
    }

    const offset = 10;
    const tooltipWidth = this.tooltipText.width + 16;
    const tooltipHeight = this.tooltipText.height + 12;

    const transformTarget = target as Phaser.GameObjects.GameObject & {
      x: number;
      y: number;
    };
    let x = transformTarget.x;
    let y = transformTarget.y;

    // Получаем размеры элемента, если возможно
    let targetWidth = 0;
    let targetHeight = 0;

    if (target instanceof Phaser.GameObjects.Container) {
      const bounds = target.getBounds();
      targetWidth = bounds.width;
      targetHeight = bounds.height;
    } else if ('width' in target && 'height' in target) {
      const sizedTarget = target as Phaser.GameObjects.GameObject & {
        width: number;
        height: number;
      };
      targetWidth = sizedTarget.width;
      targetHeight = sizedTarget.height;
    }

    switch (this.tooltipConfig.position) {
      case 'top':
        y -= targetHeight / 2 + tooltipHeight / 2 + offset;
        break;
      case 'bottom':
        y += targetHeight / 2 + tooltipHeight / 2 + offset;
        break;
      case 'left':
        x -= targetWidth / 2 + tooltipWidth / 2 + offset;
        break;
      case 'right':
        x += targetWidth / 2 + tooltipWidth / 2 + offset;
        break;
    }

    // Убедимся, что tooltip не выходит за пределы экрана
    const { width: screenWidth, height: screenHeight } = this.scene.scale;

    x = Phaser.Math.Clamp(x, tooltipWidth / 2, screenWidth - tooltipWidth / 2);
    y = Phaser.Math.Clamp(y, tooltipHeight / 2, screenHeight - tooltipHeight / 2);

    this.container.setPosition(x, y);
  }

  /**
   * Скрыть tooltip
   */
  hide(): void {
    if (!this.isVisible) return;

    // Отменяем таймер показа, если еще не показан
    if (this.showTimer) {
      this.showTimer.destroy();
      this.showTimer = undefined;
    }

    this.isVisible = false;

    // Анимация исчезновения
    this.animator.animateOut(this.container, {
      type: 'fade',
      duration: UITheme.animations.duration.fast,
    });

    this.scene.time.delayedCall(UITheme.animations.duration.fast, () => {
      this.container.setVisible(false);
    });
  }

  /**
   * Изменение текста tooltip
   */
  setText(text: string): void {
    this.tooltipText.setText(text);

    // Пересоздаем фон с новыми размерами
    const padding = 8;
    const width = this.tooltipText.width + padding * 2;
    const height = this.tooltipText.height + padding * 2;

    this.tooltipBackground.clear();
    this.tooltipBackground.fillStyle(UITheme.colors.background.modal, 0.95);
    this.tooltipBackground.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      UITheme.sizes.borderRadius.sm,
    );

    this.tooltipBackground.lineStyle(1, UITheme.colors.border.secondary, 0.8);
    this.tooltipBackground.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      UITheme.sizes.borderRadius.sm,
    );
  }

  /**
   * Проверка видимости tooltip
   */
  isShown(): boolean {
    return this.isVisible;
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    if (this.showTimer) {
      this.showTimer.destroy();
    }
    super.destroy();
  }
}

/**
 * Утилита для добавления tooltip к элементу
 */
export function addTooltipToElement(
  scene: Phaser.Scene,
  core: GameCore,
  element: Phaser.GameObjects.GameObject,
  config: UITooltipConfig,
): UITooltip {
  const tooltip = new UITooltip(scene, core, config);
  tooltip.create();

  // Добавляем обработчики событий
  if (
    element instanceof Phaser.GameObjects.Container ||
    element instanceof Phaser.GameObjects.Shape ||
    element instanceof Phaser.GameObjects.Text
  ) {
    element.setInteractive({ useHandCursor: true });

    element.on('pointerover', () => {
      tooltip.showNear(element);
    });

    element.on('pointerout', () => {
      tooltip.hide();
    });
  }

  return tooltip;
}
