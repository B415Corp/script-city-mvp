import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';

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
 */
export class GridModule implements IModule {
  id = 'grid';
  dependencies?: string[];

  private scene?: Phaser.Scene;
  private isometricMath?: IsometricMath;
  private gridGraphics?: Phaser.GameObjects.Graphics;
  private highlightGraphics?: Phaser.GameObjects.Graphics;
  private container?: Phaser.GameObjects.Container;

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

  async initialize(_core: GameCore): Promise<void> {
    void _core;
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

    console.warn('🗺️ GridModule attached to scene', scene.scene.key);
  }

  /**
   * Центрирование карты на экране
   */
  private centerMap(): void {
    if (!this.scene || !this.container) {
      return;
    }

    const camera = this.scene.cameras.main;
    this.container.setPosition(camera.width / 2, camera.height / 2);
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
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number,
      ) => {
        if (!this.container) {
          return;
        }
        const zoomSpeed = 0.001;
        const newScale = Phaser.Math.Clamp(
          this.container.scale - deltaY * zoomSpeed,
          0.3, // Минимальный zoom
          2.0, // Максимальный zoom
        );
        this.container.setScale(newScale);
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
    this.gridGraphics.fillStyle(0x2d3748, 1.0);
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
      }
    }

    this.gridGraphics.strokePath();
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

    graphics.beginPath();
    graphics.moveTo(centerX, centerY - halfHeight); // Верх
    graphics.lineTo(centerX + halfWidth, centerY); // Право
    graphics.lineTo(centerX, centerY + halfHeight); // Низ
    graphics.lineTo(centerX - halfWidth, centerY); // Лево
    graphics.closePath();
    graphics.fillPath();
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
      // Если это новая клетка, обновляем подсветку
      if (
        !this.highlightedTile ||
        this.highlightedTile.x !== tilePos.tileX ||
        this.highlightedTile.y !== tilePos.tileY
      ) {
        this.highlightedTile = { x: tilePos.tileX, y: tilePos.tileY };
        this.drawHighlight(tilePos.tileX, tilePos.tileY);
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
    this.highlightGraphics.fillStyle(0xffffff, 0.3);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(center.x, center.y - halfHeight);
    this.highlightGraphics.lineTo(center.x + halfWidth, center.y);
    this.highlightGraphics.lineTo(center.x, center.y + halfHeight);
    this.highlightGraphics.lineTo(center.x - halfWidth, center.y);
    this.highlightGraphics.closePath();
    this.highlightGraphics.fillPath();

    // Рисуем обводку
    this.highlightGraphics.lineStyle(2, 0xffffff, 0.8);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(center.x, center.y - halfHeight);
    this.highlightGraphics.lineTo(center.x + halfWidth, center.y);
    this.highlightGraphics.lineTo(center.x, center.y + halfHeight);
    this.highlightGraphics.lineTo(center.x - halfWidth, center.y);
    this.highlightGraphics.closePath();
    this.highlightGraphics.strokePath();
  }

  /**
   * Очистка подсветки
   */
  private clearHighlight(): void {
    if (this.highlightGraphics) {
      this.highlightGraphics.clear();
    }
    this.highlightedTile = null;
  }

  destroy(): void {
    if (this.scene) {
      this.scene.input.off('pointermove', this.handlePointerMove, this);
      this.scene.input.off('pointerout', this.clearHighlight, this);
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
