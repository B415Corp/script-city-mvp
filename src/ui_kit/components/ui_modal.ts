/**
 * Компонент модального окна.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIAnimator } from '../core/ui_animator';
import { UIAnimationConfig } from '../core/types';
import { createModalStyle, createOverlayStyle } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Конфигурация модального окна
 */
export interface UIModalConfig {
  width?: number;
  height?: number;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  animation?: UIAnimationConfig;
}

/**
 * Компонент модального окна
 */
export class UIModal extends UIComponent {
  private modalConfig: UIModalConfig;
  private overlay!: Phaser.GameObjects.Rectangle;
  private modalContainer!: Phaser.GameObjects.Container;
  private modalBackground!: Phaser.GameObjects.Graphics;
  private contentContainer!: Phaser.GameObjects.Container;
  private animator: UIAnimator;
  private isVisible: boolean = false;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, core: GameCore, config: UIModalConfig = {}) {
    super(scene, core);
    this.modalConfig = {
      closeOnOverlayClick: true,
      closeOnEsc: true,
      ...config,
    };
    this.animator = new UIAnimator(scene);
  }

  /**
   * Создание модального окна
   */
  create(): void {
    const { width: screenWidth, height: screenHeight } = this.scene.scale;

    // Создаем главный контейнер
    super.createContainer(0, 0, UIComponent.DEPTH.UI_MODAL, screenWidth, screenHeight);

    // Создаем overlay (затемнение фона)
    const overlayStyle = createOverlayStyle();
    this.overlay = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth,
      screenHeight,
      overlayStyle.background!.color!,
      overlayStyle.background!.alpha!,
    );

    this.container.add(this.overlay);

    // Настраиваем закрытие по клику на overlay
    if (this.modalConfig.closeOnOverlayClick) {
      this.overlay.setInteractive({ useHandCursor: false });
      this.overlay.on('pointerdown', () => {
        this.close();
      });
    }

    // Создаем контейнер модального окна
    this.modalContainer = this.scene.add.container(screenWidth / 2, screenHeight / 2);

    // Создаем фон модального окна
    const modalStyle = createModalStyle();
    const modalWidth = this.modalConfig.width ?? 400;
    const modalHeight = this.modalConfig.height ?? 300;

    this.modalBackground = this.scene.add.graphics();
    this.modalBackground.fillStyle(modalStyle.background!.color!, modalStyle.background!.alpha!);
    this.modalBackground.fillRoundedRect(
      -modalWidth / 2,
      -modalHeight / 2,
      modalWidth,
      modalHeight,
      modalStyle.border!.radius!,
    );

    if (modalStyle.border!.width! > 0) {
      this.modalBackground.lineStyle(
        modalStyle.border!.width!,
        modalStyle.border!.color!,
        modalStyle.border!.alpha!,
      );
      this.modalBackground.strokeRoundedRect(
        -modalWidth / 2,
        -modalHeight / 2,
        modalWidth,
        modalHeight,
        modalStyle.border!.radius!,
      );
    }

    this.modalContainer.add(this.modalBackground);

    // Создаем контейнер для контента
    this.contentContainer = this.scene.add.container(0, 0);
    this.modalContainer.add(this.contentContainer);

    this.container.add(this.modalContainer);

    // Изначально скрываем модальное окно
    this.container.setVisible(false);

    // Настраиваем закрытие по ESC
    if (this.modalConfig.closeOnEsc) {
      this.scene.input.keyboard?.on('keydown-ESC', this.handleEscKey, this);
    }

    // Вызываем onMount после создания
    this.onMount();
  }

  /**
   * Обработка нажатия ESC
   */
  private handleEscKey(): void {
    if (this.isVisible) {
      this.close();
    }
  }

  /**
   * Добавление контента в модальное окно
   */
  addContent(content: Phaser.GameObjects.GameObject): void {
    this.contentContainer.add(content);
  }

  /**
   * Очистка контента
   */
  clearContent(): void {
    this.contentContainer.removeAll(true);
  }

  /**
   * Открытие модального окна
   */
  open(onClose?: () => void): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.onCloseCallback = onClose;
    this.container.setVisible(true);

    // Анимация появления overlay
    this.animator.animateIn(this.overlay, {
      type: 'fade',
      duration: UITheme.animations.duration.normal,
    });

    // Анимация появления модального окна
    const animation = this.modalConfig.animation ?? {
      type: 'scale',
      duration: UITheme.animations.duration.normal,
      ease: UITheme.animations.easing.easeOut,
    };

    this.animator.animateIn(this.modalContainer, animation);
  }

  /**
   * Закрытие модального окна
   */
  close(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Анимация исчезновения
    this.animator.animateOut(this.overlay, {
      type: 'fade',
      duration: UITheme.animations.duration.normal,
    });

    const animation = this.modalConfig.animation ?? {
      type: 'scale',
      duration: UITheme.animations.duration.normal,
      ease: UITheme.animations.easing.easeIn,
    };

    this.animator.animateOut(this.modalContainer, animation);

    // Скрываем контейнер после анимации
    this.scene.time.delayedCall(UITheme.animations.duration.normal, () => {
      this.container.setVisible(false);
    });

    // Вызываем callback
    this.onCloseCallback?.();
  }

  /**
   * Проверка, открыто ли модальное окно
   */
  isOpen(): boolean {
    return this.isVisible;
  }

  /**
   * Изменение размера модального окна
   */
  resize(): void {
    const { width: screenWidth, height: screenHeight } = this.scene.scale;

    // Обновляем размеры overlay
    this.overlay.setSize(screenWidth, screenHeight);
    this.overlay.setPosition(screenWidth / 2, screenHeight / 2);

    // Обновляем позицию модального окна (по центру)
    this.modalContainer.setPosition(screenWidth / 2, screenHeight / 2);
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    if (this.modalConfig.closeOnEsc) {
      this.scene.input.keyboard?.off('keydown-ESC', this.handleEscKey, this);
    }
    super.destroy();
  }
}
