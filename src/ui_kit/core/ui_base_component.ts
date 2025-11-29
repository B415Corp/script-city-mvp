/**
 * Базовый класс для всех UI компонентов UI Kit.
 * Предоставляет общую функциональность для работы со стилями, анимациями и событиями.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { UIComponent } from '@/core/ui/ui_component';
import { GameCore } from '@/core/game_core/game_core';
import {
  UIStyle,
  UIEventHandlers,
  UIComponentConfig,
  UIComputedSize,
  UIComputedPosition,
} from './types';
import { UIAnimator } from './ui_animator';
import { normalizeSpacing, getSpacingWidth, getSpacingHeight } from './ui_style';
import { UITheme } from './ui_theme';

/**
 * Базовый класс для UI компонентов с расширенными возможностями стилизации
 */
export abstract class UIBaseComponent extends UIComponent {
  protected config: UIComponentConfig;
  protected style: UIStyle;
  protected events: UIEventHandlers;
  protected animator: UIAnimator;

  // Графические элементы
  protected background?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics;
  protected contentContainer!: Phaser.GameObjects.Container;

  // Состояние
  protected isHovered: boolean = false;
  protected isPressed: boolean = false;
  protected isDisabled: boolean = false;
  protected isActive: boolean = false;

  // Размеры
  protected computedSize: UIComputedSize = {
    width: 0,
    height: 0,
    contentWidth: 0,
    contentHeight: 0,
  };

  constructor(scene: Phaser.Scene, core: GameCore, config: UIComponentConfig = {}) {
    super(scene, core);
    this.config = config;
    this.style = config.style ?? {};

    // Применяем значения по умолчанию для фона, если указаны размеры
    if (this.style.width || this.style.height) {
      if (!this.style.background) {
        // Если фон не указан, создаем его с значениями по умолчанию
        this.style.background = {
          color: UITheme.colors.background.primary,
          alpha: UITheme.alpha.high,
        };
      } else {
        // Если фон указан, но не указаны color или alpha, применяем значения по умолчанию
        if (this.style.background.color === undefined) {
          this.style.background.color = UITheme.colors.background.primary;
        }
        if (this.style.background.alpha === undefined) {
          this.style.background.alpha = UITheme.alpha.high;
        }
      }
    }

    this.events = config.events ?? {};
    this.animator = new UIAnimator(scene);
  }

  /**
   * Создание базовой структуры компонента
   */
  protected createBase(x: number = 0, y: number = 0): void {
    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    // Сохраняем ссылку на компонент в контейнере для доступа к методам
    (
      this.container as Phaser.GameObjects.Container & { _uiComponent?: UIBaseComponent }
    )._uiComponent = this;

    // Контейнер для содержимого (с учетом padding)
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // Применяем начальный стиль
    this.applyStyle();

    // Настраиваем интерактивность
    if (this.style.interactive !== false) {
      this.setupInteractivity();
    }

    // Запускаем входную анимацию
    if (this.config.animation) {
      this.animator.animateIn(this.container, this.config.animation);
    }

    // Вызываем onMount после создания базовой структуры
    this.onMount();
  }

  /**
   * Применение стилей к компоненту
   */
  protected applyStyle(): void {
    // Применяем позицию
    if (this.style.x !== undefined || this.style.y !== undefined) {
      this.container.setPosition(this.style.x ?? 0, this.style.y ?? 0);
    }

    // Применяем видимость
    if (this.style.visible !== undefined) {
      this.container.setVisible(this.style.visible);
    }

    // Применяем прозрачность
    if (this.style.alpha !== undefined) {
      this.container.setAlpha(this.style.alpha);
    }

    // Создаем или обновляем фон
    this.updateBackground();

    // Обновляем позицию контента (с учетом padding)
    this.updateContentPosition();
  }

  /**
   * Создание/обновление фона компонента
   */
  protected updateBackground(): void {
    // Удаляем старый фон, если есть
    if (this.background) {
      this.background.destroy();
      this.background = undefined;
    }

    if (!this.style.background || !this.style.width || !this.style.height) {
      return;
    }

    const { width, height } = this.style;
    const { color, alpha } = this.style.background;
    const borderRadius = this.style.border?.radius ?? 0;

    if (borderRadius > 0) {
      // Используем Graphics для закругленных углов
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color ?? 0x000000, alpha ?? 1);
      graphics.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);

      // Рисуем границу, если указана
      if (this.style.border?.width && this.style.border.width > 0) {
        graphics.lineStyle(
          this.style.border.width,
          this.style.border.color ?? 0xffffff,
          this.style.border.alpha ?? 1,
        );
        graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
      }

      this.background = graphics;
    } else {
      // Используем Rectangle для обычного прямоугольника
      const rect = this.scene.add.rectangle(0, 0, width, height, color ?? 0x000000, alpha ?? 1);

      // Добавляем границу через strokeRect, если нужно
      if (this.style.border?.width && this.style.border.width > 0) {
        rect.setStrokeStyle(
          this.style.border.width,
          this.style.border.color ?? 0xffffff,
          this.style.border.alpha ?? 1,
        );
      }

      this.background = rect;
    }

    // Добавляем фон в начало контейнера (под содержимым)
    this.container.addAt(this.background, 0);
  }

  /**
   * Обновление позиции контента с учетом padding
   */
  protected updateContentPosition(): void {
    const padding = normalizeSpacing(this.style.padding);
    const offsetX = ((padding.left ?? 0) - (padding.right ?? 0)) / 2;
    const offsetY = ((padding.top ?? 0) - (padding.bottom ?? 0)) / 2;

    this.contentContainer.setPosition(offsetX, offsetY);
  }

  /**
   * Настройка интерактивности
   */
  protected setupInteractivity(): void {
    if (!this.style.width || !this.style.height) {
      return;
    }

    const hitArea = new Phaser.Geom.Rectangle(
      -this.style.width / 2,
      -this.style.height / 2,
      this.style.width,
      this.style.height,
    );

    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.container.input!.cursor = 'pointer';

    // Обработчики событий
    this.container.on('pointerover', this.onPointerOver, this);
    this.container.on('pointerout', this.onPointerOut, this);
    this.container.on('pointerdown', this.onPointerDown, this);
    this.container.on('pointerup', this.onPointerUp, this);
  }

  /**
   * Обработчик наведения курсора
   */
  protected onPointerOver(): void {
    if (this.isDisabled) return;

    this.isHovered = true;

    // Применяем hover стиль
    if (this.style.hover) {
      if (this.style.hover.scale) {
        this.animator.animateHover(this.container, this.style.hover.scale);
      }
      if (this.style.hover.background) {
        this.setBackgroundColor(
          this.style.hover.background.color,
          this.style.hover.background.alpha,
        );
      }
      if (this.style.hover.alpha !== undefined) {
        this.container.setAlpha(this.style.hover.alpha);
      }
    }

    // Вызываем пользовательский обработчик
    this.events.onPointerOver?.();
  }

  /**
   * Обработчик ухода курсора
   */
  protected onPointerOut(): void {
    if (this.isDisabled) return;

    this.isHovered = false;
    this.isPressed = false;

    // Возвращаем обычный стиль (или активный, если isActive === true)
    this.animator.animateHoverOut(this.container);

    if (this.isActive && this.style.active?.background) {
      // Если элемент активен, возвращаем активный стиль
      this.setBackgroundColor(
        this.style.active.background.color,
        this.style.active.background.alpha,
      );
    } else if (this.style.background) {
      // Иначе возвращаем обычный стиль
      this.setBackgroundColor(this.style.background.color, this.style.background.alpha);
    }

    if (this.style.alpha !== undefined) {
      this.container.setAlpha(this.style.alpha);
    }

    // Вызываем пользовательский обработчик
    this.events.onPointerOut?.();
  }

  /**
   * Обработчик нажатия
   */
  protected onPointerDown(): void {
    if (this.isDisabled) return;

    this.isPressed = true;

    // Применяем active стиль
    if (this.style.active) {
      if (this.style.active.scale) {
        this.animator.animateActive(this.container, this.style.active.scale);
      }
      if (this.style.active.background) {
        this.setBackgroundColor(
          this.style.active.background.color,
          this.style.active.background.alpha,
        );
      }
    }

    // Вызываем пользовательские обработчики
    this.events.onPointerDown?.();
  }

  /**
   * Обработчик отпускания кнопки
   */
  protected onPointerUp(): void {
    if (this.isDisabled) return;

    const wasPressed = this.isPressed;
    this.isPressed = false;

    // Возвращаем hover стиль (если курсор все еще над элементом) или активный стиль
    this.animator.animateActiveOut(this.container);

    if (this.isActive && this.style.active?.background) {
      // Если элемент активен, возвращаем активный стиль
      this.setBackgroundColor(
        this.style.active.background.color,
        this.style.active.background.alpha,
      );
    } else if (this.isHovered && this.style.hover?.background) {
      // Если курсор над элементом, возвращаем hover стиль
      this.setBackgroundColor(this.style.hover.background.color, this.style.hover.background.alpha);
    }

    // Вызываем пользовательские обработчики
    this.events.onPointerUp?.();

    // Вызываем onClick только если это был полный клик
    if (wasPressed && this.isHovered) {
      this.events.onClick?.();
    }
  }

  /**
   * Установка disabled состояния
   */
  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;

    if (disabled && this.style.disabled) {
      if (this.style.disabled.alpha !== undefined) {
        this.container.setAlpha(this.style.disabled.alpha);
      }
      if (this.style.disabled.background) {
        this.setBackgroundColor(
          this.style.disabled.background.color,
          this.style.disabled.background.alpha,
        );
      }
      this.container.disableInteractive();
    } else {
      if (this.style.alpha !== undefined) {
        this.container.setAlpha(this.style.alpha);
      }
      if (this.style.background) {
        this.setBackgroundColor(this.style.background.color, this.style.background.alpha);
      }
      this.container.setInteractive();
    }
  }

  /**
   * Установка активного состояния (например, для кнопок-переключателей)
   * Отличается от isPressed тем, что это постоянное состояние, а не временное при клике
   */
  setActiveState(active: boolean): void {
    this.isActive = active;

    if (active && this.style.active) {
      // Применяем стиль активного состояния
      if (this.style.active.background) {
        this.setBackgroundColor(
          this.style.active.background.color,
          this.style.active.background.alpha,
        );
      }
      if (this.style.active.alpha !== undefined) {
        this.container.setAlpha(this.style.active.alpha);
      }
    } else {
      // Возвращаем обычный стиль
      if (this.style.background) {
        this.setBackgroundColor(this.style.background.color, this.style.background.alpha);
      }
      if (this.style.alpha !== undefined) {
        this.container.setAlpha(this.style.alpha);
      }
    }
  }

  /**
   * Вспомогательный метод для изменения цвета фона (работает с Rectangle и Graphics)
   */
  protected setBackgroundColor(color?: number, alpha?: number): void {
    if (!this.background) return;

    if (this.background instanceof Phaser.GameObjects.Rectangle) {
      // Для Rectangle используем setFillStyle
      this.background.setFillStyle(
        color ?? this.background.fillColor,
        alpha ?? this.background.fillAlpha,
      );
    } else if (this.background instanceof Phaser.GameObjects.Graphics) {
      // Для Graphics нужно перерисовать
      this.redrawGraphicsBackground(color, alpha);
    }
  }

  /**
   * Перерисовка Graphics фона с новым цветом
   */
  protected redrawGraphicsBackground(color?: number, alpha?: number): void {
    if (!(this.background instanceof Phaser.GameObjects.Graphics)) return;
    if (!this.style.width || !this.style.height) return;

    const { width, height } = this.style;
    const borderRadius = this.style.border?.radius ?? 0;
    const fillColor = color ?? this.style.background?.color ?? 0x000000;
    const fillAlpha = alpha ?? this.style.background?.alpha ?? 1;

    // Очищаем Graphics
    this.background.clear();

    // Перерисовываем фон с новым цветом
    this.background.fillStyle(fillColor, fillAlpha);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);

    // Перерисовываем границу, если она есть
    if (this.style.border?.width && this.style.border.width > 0) {
      this.background.lineStyle(
        this.style.border.width,
        this.style.border.color ?? 0xffffff,
        this.style.border.alpha ?? 1,
      );
      this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
    }
  }

  /**
   * Получение размеров компонента
   */
  getSize(): UIComputedSize {
    return { ...this.computedSize };
  }

  /**
   * Получение позиции компонента
   */
  getPosition(): UIComputedPosition {
    return {
      x: this.container.x,
      y: this.container.y,
    };
  }

  /**
   * Получение контейнера компонента
   */
  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Установка позиции компонента
   */
  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
    this.style.x = x;
    this.style.y = y;
  }

  /**
   * Обновление стиля компонента
   */
  updateStyle(newStyle: Partial<UIStyle>): void {
    this.style = { ...this.style, ...newStyle };
    this.applyStyle();
  }

  /**
   * Публичный метод, вызываемый после создания компонента.
   * Может принимать опциональный колбэк для выполнения после монтирования.
   * Также можно переопределить в дочерних классах для инициализации после монтирования.
   *
   * @param callback - опциональная функция, которая будет вызвана после монтирования
   */
  onMount(callback?: () => void): void {
    if (callback) {
      callback();
    }
  }

  /**
   * Защищенный метод для финализации создания компонента.
   * Вызывает onMount() после завершения создания.
   * Должен вызываться в конце метода create(), если компонент не использует createBase().
   */
  protected finalizeCreation(): void {
    this.onMount();
  }

  /**
   * Публичный метод, вызываемый перед уничтожением компонента.
   * Может принимать опциональный колбэк для выполнения перед уничтожением.
   * Также можно переопределить в дочерних классах для очистки ресурсов.
   *
   * @param callback - опциональная функция, которая будет вызвана перед уничтожением
   */
  onDestroy(callback?: () => void): void {
    if (callback) {
      callback();
    }
  }

  /**
   * Очистка компонента
   */
  destroy(): void {
    // Вызываем onDestroy перед очисткой ресурсов
    this.onDestroy();

    if (this.background) {
      this.background.destroy();
    }
    if (this.contentContainer) {
      this.contentContainer.destroy();
    }
    super.destroy();
  }
}
