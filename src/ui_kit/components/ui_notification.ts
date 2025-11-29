/**
 * Компонент уведомления (notification).
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
 * Тип уведомления
 */
export type UINotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Позиция уведомления на экране
 */
export type UINotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Конфигурация уведомления
 */
export interface UINotificationConfig {
  message: string;
  type?: UINotificationType;
  position?: UINotificationPosition;
  duration?: number; // Время показа в миллисекундах (0 = не скрывать автоматически)
  closable?: boolean; // Можно ли закрыть вручную
  maxWidth?: number;
}

/**
 * Компонент уведомления
 */
export class UINotification extends UIComponent {
  private notificationConfig: UINotificationConfig;
  private notificationBackground!: Phaser.GameObjects.Graphics;
  private notificationText!: Phaser.GameObjects.Text;
  private closeButton?: Phaser.GameObjects.Text;
  private iconText?: Phaser.GameObjects.Text;
  private animator: UIAnimator;
  private isVisible: boolean = false;
  private hideTimer?: Phaser.Time.TimerEvent;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, core: GameCore, config: UINotificationConfig) {
    super(scene, core);
    this.notificationConfig = {
      type: 'info',
      position: 'top-right',
      duration: 3000,
      closable: true,
      maxWidth: 300,
      ...config,
    };
    this.animator = new UIAnimator(scene);
  }

  /**
   * Создание уведомления
   */
  create(): void {
    const { width: screenWidth, height: screenHeight } = this.scene.scale;
    const position = this.calculatePosition(screenWidth, screenHeight);

    // Создаем контейнер с высоким depth
    super.createContainer(position.x, position.y, UIComponent.DEPTH.UI_NOTIFICATIONS);

    // Получаем цвета для типа уведомления
    const typeColors = this.getTypeColors();

    // Создаем текст
    const textStyle = createTextStyle('normal');
    textStyle.wordWrap = {
      width: this.notificationConfig.maxWidth! - 40, // Учитываем отступы и иконку
      useAdvancedWrap: true,
    };

    this.notificationText = this.scene.add.text(0, 0, this.notificationConfig.message, textStyle);
    this.notificationText.setOrigin(0, 0.5);
    this.notificationText.setPadding(8, 6, 8, 6);
    this.notificationText.setColor(`#${UITheme.colors.text.primary.toString(16).padStart(6, '0')}`);

    // Создаем иконку
    const icon = this.getTypeIcon();
    if (icon) {
      this.iconText = this.scene.add.text(0, 0, icon, {
        fontSize: '20px',
        color: `#${typeColors.icon.toString(16).padStart(6, '0')}`,
        fontFamily: UITheme.fonts.primary,
      });
      this.iconText.setOrigin(0.5);
    }

    // Создаем кнопку закрытия, если нужно
    if (this.notificationConfig.closable) {
      this.closeButton = this.scene.add.text(0, 0, '×', {
        fontSize: '20px',
        color: `#${UITheme.colors.text.secondary.toString(16).padStart(6, '0')}`,
        fontFamily: UITheme.fonts.primary,
      });
      this.closeButton.setOrigin(0.5);
      this.closeButton.setInteractive({ useHandCursor: true });

      this.closeButton.on('pointerover', () => {
        this.closeButton!.setColor(`#${UITheme.colors.text.primary.toString(16).padStart(6, '0')}`);
      });

      this.closeButton.on('pointerout', () => {
        this.closeButton!.setColor(
          `#${UITheme.colors.text.secondary.toString(16).padStart(6, '0')}`,
        );
      });

      this.closeButton.on('pointerdown', () => {
        this.close();
      });
    }

    // Вычисляем размеры
    const padding = 12;
    const iconWidth = this.iconText ? 32 : 0;
    const closeButtonWidth = this.closeButton ? 24 : 0;
    const textWidth = this.notificationText.width;
    const textHeight = this.notificationText.height;

    const totalWidth = Math.min(
      padding * 2 + iconWidth + textWidth + closeButtonWidth + 8,
      this.notificationConfig.maxWidth!,
    );
    const totalHeight = Math.max(textHeight, this.iconText ? 32 : 0) + padding * 2;

    // Позиционируем элементы
    let currentX = -totalWidth / 2 + padding;
    if (this.iconText) {
      this.iconText.x = currentX + iconWidth / 2;
      this.iconText.y = 0;
      currentX += iconWidth + 8;
    }

    this.notificationText.x = currentX;
    this.notificationText.y = 0;

    if (this.closeButton) {
      this.closeButton.x = totalWidth / 2 - padding - closeButtonWidth / 2;
      this.closeButton.y = 0;
    }

    // Создаем фон
    this.notificationBackground = this.scene.add.graphics();
    this.notificationBackground.fillStyle(typeColors.background, UITheme.alpha.high);
    this.notificationBackground.fillRoundedRect(
      -totalWidth / 2,
      -totalHeight / 2,
      totalWidth,
      totalHeight,
      UITheme.sizes.borderRadius.md,
    );

    this.notificationBackground.lineStyle(
      UITheme.sizes.borderWidth.normal,
      typeColors.border,
      UITheme.alpha.medium,
    );
    this.notificationBackground.strokeRoundedRect(
      -totalWidth / 2,
      -totalHeight / 2,
      totalWidth,
      totalHeight,
      UITheme.sizes.borderRadius.md,
    );

    // Добавляем элементы в контейнер
    const elements: Phaser.GameObjects.GameObject[] = [
      this.notificationBackground,
      this.notificationText,
    ];
    if (this.iconText) {
      elements.push(this.iconText);
    }
    if (this.closeButton) {
      elements.push(this.closeButton);
    }
    this.container.add(elements);

    // Изначально скрываем уведомление
    this.container.setVisible(false);
    this.container.setAlpha(0);

    // Вызываем onMount после создания
    this.onMount();
  }

  /**
   * Вычисление позиции уведомления на экране
   */
  private calculatePosition(screenWidth: number, screenHeight: number): { x: number; y: number } {
    const margin = 20;
    const position = this.notificationConfig.position!;

    switch (position) {
      case 'top-left':
        return { x: margin, y: margin };
      case 'top-right':
        return { x: screenWidth - margin, y: margin };
      case 'bottom-left':
        return { x: margin, y: screenHeight - margin };
      case 'bottom-right':
        return { x: screenWidth - margin, y: screenHeight - margin };
      default:
        return { x: screenWidth - margin, y: margin };
    }
  }

  /**
   * Получение цветов для типа уведомления
   */
  private getTypeColors(): {
    background: number;
    border: number;
    icon: number;
  } {
    const type = this.notificationConfig.type!;

    switch (type) {
      case 'success':
        return {
          background: UITheme.colors.state.success,
          border: UITheme.colors.state.successHover,
          icon: UITheme.colors.state.successHover,
        };
      case 'error':
        return {
          background: UITheme.colors.state.error,
          border: UITheme.colors.state.errorHover,
          icon: UITheme.colors.state.errorHover,
        };
      case 'warning':
        return {
          background: UITheme.colors.state.warning,
          border: UITheme.colors.state.warningHover,
          icon: UITheme.colors.state.warningHover,
        };
      case 'info':
      default:
        return {
          background: UITheme.colors.state.info,
          border: UITheme.colors.state.infoHover,
          icon: UITheme.colors.state.infoHover,
        };
    }
  }

  /**
   * Получение иконки для типа уведомления
   */
  private getTypeIcon(): string | null {
    const type = this.notificationConfig.type!;

    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  /**
   * Показать уведомление
   */
  show(onClose?: () => void): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.onCloseCallback = onClose;
    this.container.setVisible(true);

    // Анимация появления
    this.animator.animateIn(this.container, {
      type: 'slide',
      duration: UITheme.animations.duration.normal,
      slideDirection: this.getSlideDirection(),
      ease: UITheme.animations.easing.easeOut,
    });

    // Автоматическое скрытие
    if (this.notificationConfig.duration! > 0) {
      this.hideTimer = this.scene.time.delayedCall(this.notificationConfig.duration!, () => {
        this.close();
      });
    }
  }

  /**
   * Получение направления слайда для анимации
   */
  private getSlideDirection(): 'left' | 'right' | 'top' | 'bottom' {
    const position = this.notificationConfig.position!;

    switch (position) {
      case 'top-left':
      case 'top-right':
        return 'top';
      case 'bottom-left':
      case 'bottom-right':
        return 'bottom';
      default:
        return 'right';
    }
  }

  /**
   * Закрыть уведомление
   */
  close(): void {
    if (!this.isVisible) return;

    // Отменяем таймер автоматического скрытия
    if (this.hideTimer) {
      this.hideTimer.destroy();
      this.hideTimer = undefined;
    }

    this.isVisible = false;

    // Анимация исчезновения
    this.animator.animateOut(this.container, {
      type: 'slide',
      duration: UITheme.animations.duration.fast,
      slideDirection: this.getSlideDirection(),
      ease: UITheme.animations.easing.easeIn,
    });

    // Скрываем контейнер после анимации
    this.scene.time.delayedCall(UITheme.animations.duration.fast, () => {
      this.container.setVisible(false);
    });

    // Вызываем callback
    this.onCloseCallback?.();
  }

  /**
   * Проверка видимости уведомления
   */
  isShown(): boolean {
    return this.isVisible;
  }

  /**
   * Изменение текста уведомления
   */
  setMessage(message: string): void {
    this.notificationConfig.message = message;
    if (this.notificationText) {
      this.notificationText.setText(message);
    }
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    if (this.hideTimer) {
      this.hideTimer.destroy();
    }
    super.destroy();
  }
}

/**
 * Утилита для создания и показа уведомления
 */
export function showNotification(
  scene: Phaser.Scene,
  core: GameCore,
  config: UINotificationConfig,
  onClose?: () => void,
): UINotification {
  const notification = new UINotification(scene, core, config);
  notification.create();
  notification.show(onClose);
  return notification;
}
