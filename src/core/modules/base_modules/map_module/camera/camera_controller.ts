import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';

export class CameraController {
  private isDragging = false; // флаг перетаскивания камеры
  private dragStartX = 0; // начальная координата X перетаскивания
  private dragStartY = 0; // начальная координата Y перетаскивания

  constructor(
    private scene: Phaser.Scene,
    private container: Phaser.GameObjects.Container,
    private eventBus: EventBus,
  ) {
    this.setupControls();
  }

  // Настройка контролов
  private setupControls(): void {
    this.scene.input.mouse?.disableContextMenu();
    this.setupZoom();
    this.setupDrag();
    this.setupKeyboard();
  }

  // Настройка масштабирования
  private setupZoom(): void {
    this.scene.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        _: Phaser.GameObjects.GameObject[],
        __: number,
        deltaY: number,
      ) => {
        const oldScale = this.container.scale;
        const zoomSpeed = 0.001;
        const newScale = Phaser.Math.Clamp(oldScale - deltaY * zoomSpeed, 0.1, 2.0);

        const worldX = (pointer.x - this.container.x) / oldScale;
        const worldY = (pointer.y - this.container.y) / oldScale;

        const newX = pointer.x - worldX * newScale;
        const newY = pointer.y - worldY * newScale;

        this.container.setScale(newScale);
        this.container.setPosition(newX, newY);

        this.eventBus.emit(Events.CameraZoomed, { scale: newScale, x: newX, y: newY });
      },
    );
  }

  // Настройка перетаскивания
  private setupDrag(): void {
    this.scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || p.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
      }
    });

    this.scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonReleased() || p.middleButtonReleased()) {
        this.isDragging = false;
      }
    });

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = p.x - this.dragStartX;
        const dy = p.y - this.dragStartY;
        this.container.x += dx;
        this.container.y += dy;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
      }
    });
  }

  // Настройка клавиатуры
  private setupKeyboard(): void {
    const arrows = this.scene.input.keyboard?.createCursorKeys();
    if (!arrows) return;

    const speed = 10;
    this.scene.events.on('update', () => {
      if (this.isDragging) return;

      if (arrows.left?.isDown) this.container.x += speed;
      if (arrows.right?.isDown) this.container.x -= speed;
      if (arrows.up?.isDown) this.container.y += speed;
      if (arrows.down?.isDown) this.container.y -= speed;
    });
  }

  // Увеличение масштаба камеры
  public zoomIn(): void {
    this.zoom(0.1);
  }

  // Уменьшение масштаба камеры
  public zoomOut(): void {
    this.zoom(-0.1);
  }

  // Масштабирование камеры
  private zoom(delta: number): void {
    const oldScale = this.container.scale;
    const newScale = Phaser.Math.Clamp(oldScale + delta, 0.1, 2.0);

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const worldX = (centerX - this.container.x) / oldScale;
    const worldY = (centerY - this.container.y) / oldScale;

    const newX = centerX - worldX * newScale;
    const newY = centerY - worldY * newScale;

    this.container.setScale(newScale);
    this.container.setPosition(newX, newY);

    this.eventBus.emit(Events.CameraZoomed, { scale: newScale, x: newX, y: newY });
  }

  // Перемещение камеры
  public moveCamera(direction: 'up' | 'down' | 'left' | 'right'): void {
    const speed = 50;

    switch (direction) {
      case 'up':
        this.container.y += speed;
        break;
      case 'down':
        this.container.y -= speed;
        break;
      case 'left':
        this.container.x += speed;
        break;
      case 'right':
        this.container.x -= speed;
        break;
    }
  }

  // Центрирование карты
  public centerMap(): void {
    const camera = this.scene.cameras.main;
    const cx = camera.width / 2;
    const cy = camera.height / 2;

    this.container.setPosition(cx, cy);
    this.eventBus.emit(Events.MapCentered, { x: cx, y: cy });
  }

  // Проверка, перетаскивается ли камера
  public isDraggingCamera(): boolean {
    return this.isDragging;
  }
}
