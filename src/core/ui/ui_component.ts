import Phaser from 'phaser';
import { GameCore } from '../game_core/game_core';

/**
 * Базовый класс для всех UI компонентов.
 *
 * **Теги**: `arch:ui`, `arch:core`, `tech:phaser`
 *
 * Автоматически настраивает:
 * - Фиксированную позицию (не двигается с камерой)
 * - Правильный порядок слоёв (UI поверх карты)
 * - Доступ к контейнеру и сцене
 *
 * @example
 * ```typescript
 * class MyUIComponent extends UIComponent {
 *   create(): void {
 *     super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);
 *
 *     const text = this.scene.add.text(0, 0, 'Hello');
 *     this.container.add(text);
 *   }
 * }
 * ```
 */
export abstract class UIComponent {
  protected scene: Phaser.Scene;
  protected core: GameCore;
  protected container!: Phaser.GameObjects.Container;

  /**
   * Константы для стандартных depth слоёв
   */
  static readonly DEPTH = {
    /** Слой карты (самый низкий) */
    MAP: 0,
    /** Базовый слой UI */
    UI_BASE: 1000,
    /** Слой панелей и окон */
    UI_PANELS: 1100,
    /** Слой модальных окон */
    UI_MODAL: 2000,
    /** Слой уведомлений (самый высокий) */
    UI_NOTIFICATIONS: 3000,
  } as const;

  constructor(scene: Phaser.Scene, core: GameCore) {
    this.scene = scene;
    this.core = core;
  }

  /**
   * Создание контейнера UI компонента.
   * Должен вызываться в начале метода create() наследника.
   *
   * Автоматически настраивает перехват событий мыши для предотвращения
   * взаимодействия с объектами под UI (например, картой).
   *
   * @param x - позиция X контейнера
   * @param y - позиция Y контейнера
   * @param depth - порядок слоя (по умолчанию UI_BASE = 1000)
   * @param hitAreaWidth - ширина области перехвата событий (опционально, по умолчанию перехватывает только в области дочерних элементов)
   * @param hitAreaHeight - высота области перехвата событий (опционально)
   */
  protected createContainer(
    x: number = 0,
    y: number = 0,
    depth: number = UIComponent.DEPTH.UI_BASE,
    hitAreaWidth?: number,
    hitAreaHeight?: number,
  ): void {
    this.container = this.scene.add.container(x, y);

    // Фиксируем UI - не двигается с камерой
    this.container.setScrollFactor(0);

    // Устанавливаем depth, чтобы UI был поверх карты
    this.container.setDepth(depth);

    // Автоматически делаем контейнер интерактивным для перехвата событий мыши
    if (hitAreaWidth !== undefined && hitAreaHeight !== undefined) {
      // Если указаны размеры hit area, используем прямоугольную область
      this.container.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, hitAreaWidth, hitAreaHeight),
        Phaser.Geom.Rectangle.Contains,
      );
    } else {
      // Без hit area - перехватывает события только в области дочерних элементов
      // Это работает автоматически, когда дочерние элементы добавляются в контейнер
      this.container.setInteractive();
    }

    // Останавливаем распространение событий, чтобы они не доходили до объектов под UI
    this.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });
    this.container.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });
    this.container.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });
  }

  /**
   * Изменение depth слоя компонента.
   * Полезно для динамического изменения порядка отрисовки.
   *
   * @param depth - новый порядок слоя
   */
  setDepth(depth: number): void {
    if (this.container) {
      this.container.setDepth(depth);
    }
  }

  /**
   * Получение текущего depth слоя.
   */
  getDepth(): number {
    return this.container?.depth ?? 0;
  }

  /**
   * Абстрактный метод создания компонента.
   * Должен быть реализован в наследниках.
   */
  abstract create(): void;

  /**
   * Очистка компонента.
   * Переопределите для дополнительной очистки ресурсов.
   */
  destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = undefined as unknown as Phaser.GameObjects.Container;
    }
  }
}
