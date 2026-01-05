import { BaseModule } from '../../extends';
import { Events } from '@/core/event_bus/events';
import { EventBus } from '@/core/event_bus/event_bus';
import { CameraController } from './camera/camera_controller';
import { InputHandler } from './input/input_handler';
import { TileRenderer } from './rendering/tile_renderer';
import { TileHighlighter } from './selection/tile_highlighter';
import { TileSelector } from './selection/tile_selector';

export class MapModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private container?: Phaser.GameObjects.Container;
  private renderer?: TileRenderer;
  private cameraController?: CameraController;
  private highlighter?: TileHighlighter;
  private selector?: TileSelector;
  private inputHandler?: InputHandler;

  // Параметры сетки
  private readonly gridWidth: number = 100;
  private readonly gridHeight: number = 100;
  private readonly tileWidth: number = 128;
  private readonly tileHeight: number = 64;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('MapModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
    this.attachToScene(scene);
  }

  public getTileInfo(tileX: number, tileY: number) {
    return this.renderer?.getTileInfo(tileX, tileY) ?? null;
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(10);

    // Инициализация модулей
    this.renderer = new TileRenderer(
      scene,
      this.container,
      this.tileWidth,
      this.tileHeight,
      this.gridWidth,
      this.gridHeight,
    );

    this.cameraController = new CameraController(scene, this.container, this.eventBus);
    this.cameraController.centerMap();

    // Подписываемся на событие готовности сцены
    this.eventBus.on(Events.SceneReady, () => this.onSceneReady());
  }

  private onSceneReady(): void {
    if (!this.container || !this.renderer) return;

    // Рисуем тайлы
    this.renderer.renderGrid();

    const isometricMath = this.renderer.getIsometricMath();

    // Инициализация интерактивных модулей
    this.highlighter = new TileHighlighter(
      this.scene,
      this.container,
      isometricMath,
      this.eventBus,
      this.tileWidth,
      this.tileHeight,
    );

    this.selector = new TileSelector(
      this.scene,
      this.container,
      isometricMath,
      this.eventBus,
      this.tileWidth,
      this.tileHeight,
      this.gridWidth,
      this.gridHeight,
    );

    this.inputHandler = new InputHandler(
      this.scene,
      this.container,
      isometricMath,
      this.highlighter,
      this.selector,
      this.eventBus,
      this.gridWidth,
      this.gridHeight,
      () => this.cameraController?.isDraggingCamera() ?? false,
      (x, y) => this.getTileInfo(x, y),
    );
  }

  // Публичное API для UI
  public zoomIn(): void {
    this.cameraController?.zoomIn();
  }

  public zoomOut(): void {
    this.cameraController?.zoomOut();
  }

  public moveCamera(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.cameraController?.moveCamera(direction);
  }
}

export default MapModule;
