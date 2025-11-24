import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';
import { UIComponent } from '@/core/ui/ui_component';
import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';

/**
 * Модуль для отрисовки изометрической сетки с управлением камерой.
 *
 * **Теги**: `arch:module`, `map:isometric`, `arch:renderer`
 *
 * Возможности:
 * - Отрисовка изометрической сетки 100x100
 * - Подсветка клеток при наведении мыши
 * - Zoom камеры (колесико мыши)
 * - Перемещение карты (перетаскивание средней кнопкой мыши или ПКМ)
 *
 * Публикуемые события (используйте Events enum):
 * - `Events.TileHovered` - когда курсор наводится на тайл: `{ tileX: number, tileY: number }`
 * - `Events.TileUnhovered` - когда курсор уходит с тайла: `{ tileX: number, tileY: number }`
 * - `Events.TileClicked` - когда происходит клик по тайлу: `{ tileX: number, tileY: number, button: 'left' | 'right' | 'middle' }`
 */
export class GridModule implements IModule {
  id = 'grid';
  dependencies?: string[];

  private scene?: Phaser.Scene;
  private isometricMath?: IsometricMath;
  private gridGraphics?: Phaser.GameObjects.Graphics;
  private highlightGraphics?: Phaser.GameObjects.Graphics;
  private container?: Phaser.GameObjects.Container;
  private eventBus?: EventBus;

  // Параметры сетки
  private readonly gridWidth: number = 100;
  private readonly gridHeight: number = 100;
  private readonly tileWidth: number = 64;
  private readonly tileHeight: number = 32;

  // Текущая подсвеченная клетка
  private highlightedTile: { x: number; y: number } | null = null;

  // Управление камерой
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  async initialize(core: GameCore): Promise<void> {
    this.eventBus = core.getEventBus();
    this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);
    console.warn('🗺️ GridModule initialized');
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;

    if (!this.isometricMath) {
      throw new Error('GridModule not initialized');
    }

    // Создаём контейнер для всей карты
    this.container = scene.add.container(0, 0);
    // Устанавливаем низкий depth, чтобы карта была под UI
    this.container.setDepth(0);

    // Создаём графические объекты
    this.gridGraphics = scene.add.graphics();
    this.highlightGraphics = scene.add.graphics();

    // Добавляем в контейнер
    this.container.add(this.gridGraphics);
    this.container.add(this.highlightGraphics);

    // Центрируем карту
    this.centerMap();

    // Отрисовка сетки
    this.drawGrid();

    // Настройка управления камерой
    this.setupCameraControls();

    // Обработка движения мыши для подсветки
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerout', this.clearHighlight, this);

    // Обработка клика по тайлу
    scene.input.on('pointerdown', this.handlePointerDown, this);

    console.warn('🗺️ GridModule attached to scene', scene.scene.key);
  }

  /**
   * Центрирование карты на экране
   */
  private centerMap(): void {
    if (!this.scene || !this.container || !this.isometricMath) {
      return;
    }

    const camera = this.scene.cameras.main;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;

    this.container.setPosition(centerX, centerY);

    // Координаты тайлов вычисляются относительно контейнера (0,0)
    // поэтому offset должен быть 0
    this.isometricMath.setOffset(0, 0);
  }

  /**
   * Настройка управления камерой (zoom и перетаскивание)
   */
  private setupCameraControls(): void {
    if (!this.scene || !this.container) {
      return;
    }

    // Отключаем контекстное меню правой кнопки мыши
    this.scene.input.mouse?.disableContextMenu();

    // Zoom колесиком мыши (изменяем scale контейнера)
    this.scene.input.on(
      'wheel',
      (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
        if (!this.container || !this.scene) {
          return;
        }

        // Проверяем, не находится ли курсор над UI элементом
        const hasUIElement = this.scene.children.list.some((child) => {
          const gameObj = child as Phaser.GameObjects.GameObject & { depth?: number };
          if (gameObj.depth !== undefined && gameObj.depth >= UIComponent.DEPTH.UI_BASE) {
            if (child instanceof Phaser.GameObjects.Container) {
              const bounds = child.getBounds();
              return bounds.contains(pointer.x, pointer.y);
            }
          }
          return false;
        });

        if (hasUIElement) {
          return; // Не зумим, если курсор над UI
        }

        const oldScale = this.container.scale;
        const zoomSpeed = 0.001;
        const newScale = Phaser.Math.Clamp(
          oldScale - deltaY * zoomSpeed,
          0.3, // Минимальный zoom
          2.0, // Максимальный zoom
        );

        // Вычисляем координаты точки под курсором в пространстве контейнера (до изменения масштаба)
        const worldX = (pointer.x - this.container.x) / oldScale;
        const worldY = (pointer.y - this.container.y) / oldScale;

        // После изменения масштаба, пересчитываем позицию контейнера так,
        // чтобы эта же точка осталась под курсором
        const newX = pointer.x - worldX * newScale;
        const newY = pointer.y - worldY * newScale;

        this.container.setScale(newScale);
        this.container.setPosition(newX, newY);
      },
    );

    // Перетаскивание карты правой кнопкой мыши или средней кнопкой
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonReleased() || pointer.middleButtonReleased()) {
        this.isDragging = false;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.container) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;

        this.container.x += deltaX;
        this.container.y += deltaY;

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    // Управление клавиатурой (стрелки)
    const cursors = this.scene.input.keyboard?.createCursorKeys();
    if (cursors) {
      const moveSpeed = 10;
      this.scene.events.on('update', () => {
        if (!this.container || this.isDragging) {
          return;
        }

        if (cursors.left?.isDown) {
          this.container.x += moveSpeed;
        }
        if (cursors.right?.isDown) {
          this.container.x -= moveSpeed;
        }
        if (cursors.up?.isDown) {
          this.container.y += moveSpeed;
        }
        if (cursors.down?.isDown) {
          this.container.y -= moveSpeed;
        }
      });
    }
  }

  /**
   * Отрисовка изометрической сетки
   */
  private drawGrid(): void {
    if (!this.gridGraphics || !this.isometricMath) {
      return;
    }

    this.gridGraphics.clear();

    // Рисуем фон для каждой клетки (серый)
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const center = this.isometricMath.tileToScreen(x, y);
        this.drawIsometricTileBackground(this.gridGraphics, center.x, center.y);
      }
    }

    // Рисуем линии сетки (черные)
    this.gridGraphics.lineStyle(1, 0x000000, 1.0);
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const center = this.isometricMath.tileToScreen(x, y);
        this.drawIsometricTileOutline(this.gridGraphics, center.x, center.y);
        // Вызываем strokePath после каждого тайла, иначе path перезаписывается
        this.gridGraphics.strokePath();
      }
    }
  }

  /**
   * Отрисовка фона изометрического тайла (ромба)
   */
  private drawIsometricTileBackground(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
  ): void {
    const halfWidth = this.tileWidth / 2;
    const halfHeight = this.tileHeight / 2;

    // Устанавливаем стиль заливки для каждого тайла
    graphics.fillStyle(0x2d4837, 1.0);
    graphics.beginPath();
    graphics.moveTo(centerX, centerY - halfHeight); // Верх
    graphics.lineTo(centerX + halfWidth, centerY); // Право
    graphics.lineTo(centerX, centerY + halfHeight); // Низ
    graphics.lineTo(centerX - halfWidth, centerY); // Лево
    graphics.closePath();
    graphics.fillPath(); // Заливаем каждый ромб отдельно
  }

  /**
   * Отрисовка контура изометрического тайла (ромба)
   */
  private drawIsometricTileOutline(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
  ): void {
    const halfWidth = this.tileWidth / 2;
    const halfHeight = this.tileHeight / 2;

    graphics.beginPath();
    graphics.moveTo(centerX, centerY - halfHeight); // Верх
    graphics.lineTo(centerX + halfWidth, centerY); // Право
    graphics.lineTo(centerX, centerY + halfHeight); // Низ
    graphics.lineTo(centerX - halfWidth, centerY); // Лево
    graphics.closePath();
  }

  /**
   * Обработка движения мыши для подсветки клеток
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Не подсвечиваем при перетаскивании карты
    if (this.isDragging) {
      this.clearHighlight();
      return;
    }

    if (!this.scene || !this.isometricMath || !this.highlightGraphics || !this.container) {
      return;
    }

    // Проверяем, не был ли курсор над UI элементом
    // Проверяем все объекты сцены с depth >= UI_BASE
    const hasUIElement = this.scene.children.list.some((child) => {
      const gameObj = child as Phaser.GameObjects.GameObject & { depth?: number };
      if (gameObj.depth !== undefined && gameObj.depth >= UIComponent.DEPTH.UI_BASE) {
        // Проверяем, попадает ли курсор в bounds контейнера
        if (child instanceof Phaser.GameObjects.Container) {
          const bounds = child.getBounds();
          return bounds.contains(pointer.x, pointer.y);
        }
      }
      return false;
    });

    if (hasUIElement) {
      this.clearHighlight();
      return;
    }

    // Преобразуем экранные координаты с учётом scale и позиции контейнера
    const worldX = (pointer.x - this.container.x) / this.container.scale;
    const worldY = (pointer.y - this.container.y) / this.container.scale;

    // Конвертируем в координаты тайла
    const tilePos = this.isometricMath.screenToTile(worldX, worldY);

    // Проверяем, что координаты в пределах сетки
    if (
      tilePos.tileX >= 0 &&
      tilePos.tileX < this.gridWidth &&
      tilePos.tileY >= 0 &&
      tilePos.tileY < this.gridHeight
    ) {
      // Проверяем, действительно ли точка находится внутри ромба тайла
      if (this.isometricMath.isPointInTile(worldX, worldY, tilePos.tileX, tilePos.tileY)) {
        // Если это новая клетка, обновляем подсветку
        if (
          !this.highlightedTile ||
          this.highlightedTile.x !== tilePos.tileX ||
          this.highlightedTile.y !== tilePos.tileY
        ) {
          const previousTile = this.highlightedTile;
          this.highlightedTile = { x: tilePos.tileX, y: tilePos.tileY };
          this.drawHighlight(tilePos.tileX, tilePos.tileY);

          // Публикуем события о смене подсветки
          if (previousTile) {
            this.eventBus?.emit(Events.TileUnhovered, {
              tileX: previousTile.x,
              tileY: previousTile.y,
            });
          }
          this.eventBus?.emit(Events.TileHovered, { tileX: tilePos.tileX, tileY: tilePos.tileY });
        }
      } else {
        // Точка не внутри ромба - проверяем соседние тайлы
        const foundTile = this.findTileAtPoint(worldX, worldY, tilePos.tileX, tilePos.tileY);
        if (foundTile) {
          if (
            !this.highlightedTile ||
            this.highlightedTile.x !== foundTile.x ||
            this.highlightedTile.y !== foundTile.y
          ) {
            const previousTile = this.highlightedTile;
            this.highlightedTile = foundTile;
            this.drawHighlight(foundTile.x, foundTile.y);

            // Публикуем события о смене подсветки
            if (previousTile) {
              this.eventBus?.emit(Events.TileUnhovered, {
                tileX: previousTile.x,
                tileY: previousTile.y,
              });
            }
            this.eventBus?.emit(Events.TileHovered, { tileX: foundTile.x, tileY: foundTile.y });
          }
        } else {
          this.clearHighlight();
        }
      }
    } else {
      this.clearHighlight();
    }
  }

  /**
   * Отрисовка подсветки клетки
   */
  private drawHighlight(tileX: number, tileY: number): void {
    if (!this.highlightGraphics || !this.isometricMath) {
      return;
    }

    this.highlightGraphics.clear();

    // Получаем экранные координаты центра тайла
    const center = this.isometricMath.tileToScreen(tileX, tileY);

    const halfWidth = this.tileWidth / 2;
    const halfHeight = this.tileHeight / 2;

    // Рисуем заливку ромба
    this.highlightGraphics.fillStyle(0xffffff, 0.1);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(center.x, center.y - halfHeight);
    this.highlightGraphics.lineTo(center.x + halfWidth, center.y);
    this.highlightGraphics.lineTo(center.x, center.y + halfHeight);
    this.highlightGraphics.lineTo(center.x - halfWidth, center.y);
    this.highlightGraphics.closePath();
    this.highlightGraphics.fillPath();

    // Рисуем обводку
    this.highlightGraphics.lineStyle(2, 0xffffff, 0.1);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(center.x, center.y - halfHeight);
    this.highlightGraphics.lineTo(center.x + halfWidth, center.y);
    this.highlightGraphics.lineTo(center.x, center.y + halfHeight);
    this.highlightGraphics.lineTo(center.x - halfWidth, center.y);
    this.highlightGraphics.closePath();
    this.highlightGraphics.strokePath();
  }

  /**
   * Поиск тайла, в котором находится точка, проверяя соседние тайлы
   */
  private findTileAtPoint(
    worldX: number,
    worldY: number,
    centerTileX: number,
    centerTileY: number,
  ): { x: number; y: number } | null {
    if (!this.isometricMath) {
      return null;
    }

    // Проверяем центральный тайл и его соседей (всего 9 тайлов)
    const offsets = [
      { dx: 0, dy: 0 }, // Центральный
      { dx: -1, dy: 0 }, // Лево
      { dx: 1, dy: 0 }, // Право
      { dx: 0, dy: -1 }, // Верх
      { dx: 0, dy: 1 }, // Низ
      { dx: -1, dy: -1 }, // Верх-лево
      { dx: 1, dy: -1 }, // Верх-право
      { dx: -1, dy: 1 }, // Низ-лево
      { dx: 1, dy: 1 }, // Низ-право
    ];

    for (const offset of offsets) {
      const tileX = centerTileX + offset.dx;
      const tileY = centerTileY + offset.dy;

      // Проверяем границы сетки
      if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
        if (this.isometricMath.isPointInTile(worldX, worldY, tileX, tileY)) {
          return { x: tileX, y: tileY };
        }
      }
    }

    return null;
  }

  /**
   * Обработка клика по тайлу
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Игнорируем клики при перетаскивании карты
    if (this.isDragging || pointer.rightButtonDown() || pointer.middleButtonDown()) {
      return;
    }

    if (!this.scene || !this.isometricMath || !this.container) {
      return;
    }

    // Проверяем, не был ли клик по UI элементу
    const hasUIElement = this.scene.children.list.some((child) => {
      const gameObj = child as Phaser.GameObjects.GameObject & { depth?: number };
      if (gameObj.depth !== undefined && gameObj.depth >= UIComponent.DEPTH.UI_BASE) {
        if (child instanceof Phaser.GameObjects.Container) {
          const bounds = child.getBounds();
          return bounds.contains(pointer.x, pointer.y);
        }
      }
      return false;
    });

    if (hasUIElement) {
      return;
    }

    // Преобразуем экранные координаты с учётом scale и позиции контейнера
    const worldX = (pointer.x - this.container.x) / this.container.scale;
    const worldY = (pointer.y - this.container.y) / this.container.scale;

    // Конвертируем в координаты тайла
    const tilePos = this.isometricMath.screenToTile(worldX, worldY);

    // Проверяем, что координаты в пределах сетки
    if (
      tilePos.tileX >= 0 &&
      tilePos.tileX < this.gridWidth &&
      tilePos.tileY >= 0 &&
      tilePos.tileY < this.gridHeight
    ) {
      // Проверяем, действительно ли точка находится внутри ромба тайла
      if (this.isometricMath.isPointInTile(worldX, worldY, tilePos.tileX, tilePos.tileY)) {
        this.eventBus?.emit(Events.TileClicked, {
          tileX: tilePos.tileX,
          tileY: tilePos.tileY,
          button: pointer.leftButtonDown()
            ? 'left'
            : pointer.rightButtonDown()
              ? 'right'
              : 'middle',
        });
      } else {
        // Проверяем соседние тайлы
        const foundTile = this.findTileAtPoint(worldX, worldY, tilePos.tileX, tilePos.tileY);
        if (foundTile) {
          this.eventBus?.emit(Events.TileClicked, {
            tileX: foundTile.x,
            tileY: foundTile.y,
            button: pointer.leftButtonDown()
              ? 'left'
              : pointer.rightButtonDown()
                ? 'right'
                : 'middle',
          });
        }
      }
    }
  }

  /**
   * Очистка подсветки
   */
  private clearHighlight(): void {
    if (this.highlightedTile) {
      const previousTile = this.highlightedTile;
      this.highlightedTile = null;
      if (this.highlightGraphics) {
        this.highlightGraphics.clear();
      }
      // Публикуем событие о снятии подсветки
      this.eventBus?.emit(Events.TileUnhovered, { tileX: previousTile.x, tileY: previousTile.y });
    } else if (this.highlightGraphics) {
      this.highlightGraphics.clear();
    }
  }

  destroy(): void {
    if (this.scene) {
      this.scene.input.off('pointermove', this.handlePointerMove, this);
      this.scene.input.off('pointerout', this.clearHighlight, this);
      this.scene.input.off('pointerdown', this.handlePointerDown, this);
      this.scene.events.off('update');
    }

    if (this.highlightGraphics) {
      this.highlightGraphics.destroy();
      this.highlightGraphics = undefined;
    }

    if (this.gridGraphics) {
      this.gridGraphics.destroy();
      this.gridGraphics = undefined;
    }

    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }

    this.scene = undefined;
    console.warn('🗺️ GridModule destroyed');
  }
}
