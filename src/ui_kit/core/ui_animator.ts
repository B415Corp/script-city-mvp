/**
 * Система анимаций для UI Kit.
 * Предоставляет утилиты для создания различных анимаций элементов.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { UIAnimationConfig, UIAnimationType, UISlideDirection } from './types';
import { UITheme } from './ui_theme';

/**
 * Класс для управления анимациями UI элементов
 */
export class UIAnimator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Анимация появления элемента
   */
  animateIn(
    target: Phaser.GameObjects.GameObject,
    config: UIAnimationConfig = { type: 'fade' },
  ): Phaser.Tweens.Tween {
    const duration = config.duration ?? UITheme.animations.duration.normal;
    const ease = config.ease ?? UITheme.animations.easing.easeOut;
    const delay = config.delay ?? 0;

    switch (config.type) {
      case 'fade':
        return this.fadeIn(target, duration, ease, delay, config.from, config.to);

      case 'scale':
        return this.scaleIn(target, duration, ease, delay, config.from, config.to);

      case 'slide':
        return this.slideIn(target, duration, ease, delay, config.slideDirection);

      case 'none':
      default:
        // Мгновенное появление
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).setAlpha(1);
        }
        return this.scene.tweens.add({
          targets: target,
          duration: 0,
        });
    }
  }

  /**
   * Анимация исчезновения элемента
   */
  animateOut(
    target: Phaser.GameObjects.GameObject,
    config: UIAnimationConfig = { type: 'fade' },
  ): Phaser.Tweens.Tween {
    const duration = config.duration ?? UITheme.animations.duration.normal;
    const ease = config.ease ?? UITheme.animations.easing.easeIn;
    const delay = config.delay ?? 0;

    switch (config.type) {
      case 'fade':
        return this.fadeOut(target, duration, ease, delay, config.from, config.to);

      case 'scale':
        return this.scaleOut(target, duration, ease, delay, config.from, config.to);

      case 'slide':
        return this.slideOut(target, duration, ease, delay, config.slideDirection);

      case 'none':
      default:
        // Мгновенное исчезновение
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).setAlpha(0);
        }
        return this.scene.tweens.add({
          targets: target,
          duration: 0,
        });
    }
  }

  /**
   * Плавное появление (fade in)
   */
  private fadeIn(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    from: number = 0,
    to: number = 1,
  ): Phaser.Tweens.Tween {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setAlpha(from);
    }

    return this.scene.tweens.add({
      targets: target,
      alpha: to,
      duration,
      ease,
      delay,
    });
  }

  /**
   * Плавное исчезновение (fade out)
   */
  private fadeOut(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    from: number = 1,
    to: number = 0,
  ): Phaser.Tweens.Tween {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setAlpha(from);
    }

    return this.scene.tweens.add({
      targets: target,
      alpha: to,
      duration,
      ease,
      delay,
    });
  }

  /**
   * Появление с масштабированием (scale in)
   */
  private scaleIn(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    from: number = 0,
    to: number = 1,
  ): Phaser.Tweens.Tween {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setScale' in target && typeof (target as any).setScale === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setScale(from);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setAlpha(0);
    }

    return this.scene.tweens.add({
      targets: target,
      scale: to,
      alpha: 1,
      duration,
      ease,
      delay,
    });
  }

  /**
   * Исчезновение с масштабированием (scale out)
   */
  private scaleOut(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    from: number = 1,
    to: number = 0,
  ): Phaser.Tweens.Tween {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setScale' in target && typeof (target as any).setScale === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setScale(from);
    }

    return this.scene.tweens.add({
      targets: target,
      scale: to,
      alpha: 0,
      duration,
      ease,
      delay,
    });
  }

  /**
   * Появление со слайдом (slide in)
   */
  private slideIn(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    direction: UISlideDirection = 'bottom',
  ): Phaser.Tweens.Tween {
    if (!('x' in target && 'y' in target)) {
      return this.scene.tweens.add({ targets: target, duration: 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalX = (target as any).x;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalY = (target as any).y;
    const offset = 100;

    // Устанавливаем начальную позицию
    switch (direction) {
      case 'left':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).x = originalX - offset;
        break;
      case 'right':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).x = originalX + offset;
        break;
      case 'top':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).y = originalY - offset;
        break;
      case 'bottom':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (target as any).y = originalY + offset;
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('setAlpha' in target && typeof (target as any).setAlpha === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (target as any).setAlpha(0);
    }

    return this.scene.tweens.add({
      targets: target,
      x: originalX,
      y: originalY,
      alpha: 1,
      duration,
      ease,
      delay,
    });
  }

  /**
   * Исчезновение со слайдом (slide out)
   */
  private slideOut(
    target: Phaser.GameObjects.GameObject,
    duration: number,
    ease: string,
    delay: number,
    direction: UISlideDirection = 'bottom',
  ): Phaser.Tweens.Tween {
    if (!('x' in target && 'y' in target)) {
      return this.scene.tweens.add({ targets: target, duration: 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalX = (target as any).x;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalY = (target as any).y;
    const offset = 100;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetProps: any = { alpha: 0, duration, ease, delay };

    switch (direction) {
      case 'left':
        targetProps.x = originalX - offset;
        break;
      case 'right':
        targetProps.x = originalX + offset;
        break;
      case 'top':
        targetProps.y = originalY - offset;
        break;
      case 'bottom':
        targetProps.y = originalY + offset;
        break;
    }

    return this.scene.tweens.add({
      targets: target,
      ...targetProps,
    });
  }

  /**
   * Анимация hover эффекта
   */
  animateHover(
    target: Phaser.GameObjects.GameObject,
    scale: number = UITheme.animations.scale.hover,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale,
      duration: UITheme.animations.duration.fast,
      ease: UITheme.animations.easing.easeOut,
    });
  }

  /**
   * Анимация возврата после hover эффекта
   */
  animateHoverOut(target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale: 1,
      duration: UITheme.animations.duration.fast,
      ease: UITheme.animations.easing.easeOut,
    });
  }

  /**
   * Анимация нажатия (active)
   */
  animateActive(
    target: Phaser.GameObjects.GameObject,
    scale: number = UITheme.animations.scale.active,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale,
      duration: UITheme.animations.duration.fast,
      ease: UITheme.animations.easing.easeIn,
    });
  }

  /**
   * Анимация возврата после нажатия
   */
  animateActiveOut(target: Phaser.GameObjects.GameObject): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale: 1,
      duration: UITheme.animations.duration.fast,
      ease: UITheme.animations.easing.easeOut,
    });
  }

  /**
   * Пульсация (для привлечения внимания)
   */
  animatePulse(
    target: Phaser.GameObjects.GameObject,
    scale: number = 1.1,
    repeat: number = -1,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale,
      duration: UITheme.animations.duration.slow,
      ease: UITheme.animations.easing.easeInOut,
      yoyo: true,
      repeat,
    });
  }

  /**
   * Встряхивание (для ошибок)
   */
  animateShake(target: Phaser.GameObjects.GameObject, intensity: number = 5): Phaser.Tweens.Tween {
    if (!('x' in target)) {
      return this.scene.tweens.add({ targets: target, duration: 0 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalX = (target as any).x;

    return this.scene.tweens.add({
      targets: target,
      x: originalX + intensity,
      duration: 50,
      ease: UITheme.animations.easing.linear,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if ('x' in target) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).x = originalX;
        }
      },
    });
  }
}
