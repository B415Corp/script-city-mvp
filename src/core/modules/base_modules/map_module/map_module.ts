import { BaseModule } from '../../extends';
import { Events } from '@/core/event_bus/events';
import { EventBus } from '@/core/event_bus/event_bus';
import { CameraController } from './camera/camera_controller';
import { InputHandler } from './input/input_handler';
import { TileRenderer } from './rendering/tile_renderer';
import { TileHighlighter } from './selection/tile_highlighter';
import { TileSelector } from './selection/tile_selector';
import { TileInfo } from './types';
import { ToolActivatedPayload } from '../tools_module/types';

export class MapModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private container?: Phaser.GameObjects.Container; // контейнер для рендеринга тайлов
  private renderer?: TileRenderer; // рендер тайлов
  private cameraController?: CameraController; // контроллер камеры
  private highlighter?: TileHighlighter; // выделение тайла
  private selector?: TileSelector; // селектор тайлов
  private inputHandler?: InputHandler; // обработчик ввода

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

  public getTileInfo(tileX: number, tileY: number): TileInfo | null {
    return this.renderer?.getTileInfo(tileX, tileY) ?? null;
  }

  // Прикрепление к сцене
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
    this.eventBus.on<ToolActivatedPayload>(Events.SceneReady, (payload) => {
      if (!payload) return;
      this.onSceneReady(payload);
    });
  }

  // Событие готовности сцены
  private onSceneReady(payload: ToolActivatedPayload): void {
    if (!this.container || !this.renderer) return;

    // Рисуем тайлы
    this.renderer.renderGrid();

    const isometricMath = this.renderer.getIsometricMath(); // получаем изометрическую математику

    // Инициализация интерактивных модулей
    this.highlighter = new TileHighlighter( // инициализация выделения тайла
      this.scene,
      this.container,
      isometricMath,
      this.eventBus,
      this.tileWidth,
      this.tileHeight,
    );

    this.selector = new TileSelector( // инициализация селектора тайлов
      this.scene,
      this.container,
      isometricMath,
      this.eventBus,
      this.tileWidth,
      this.tileHeight,
      this.gridWidth,
      this.gridHeight,
    );

    this.inputHandler = new InputHandler( // инициализация обработчика ввода
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

    // 1) слушаем активацию инструмента
    this.eventBus.on<ToolActivatedPayload>(Events.ToolActivated, this.onToolActivated);

    // 2) при закрытии/рестарте сцены снимаем слушатель (чтобы не дублировался)
    this.scene.sys.events.once('shutdown', () => {
      this.eventBus.off(Events.ToolActivated, this.onToolActivated);
    });

    const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    escKey?.on('down', () => {
      this.selector?.cancel(); // убрать рамку выделения
      this.eventBus.emit(Events.ResetToolToDefault, null); // сказать tools-module вернуть select
    });

    // 3) сбросить tool на select
    this.eventBus.emit(Events.ResetToolToDefault, null);
  }

  // Публичное API для UI
  // Увеличение масштаба камеры
  public zoomIn(): void {
    this.cameraController?.zoomIn();
  }

  // Уменьшение масштаба камеры
  public zoomOut(): void {
    this.cameraController?.zoomOut();
  }

  // Перемещение камеры
  public moveCamera(direction: 'up' | 'down' | 'left' | 'right'): void {
    this.cameraController?.moveCamera(direction);
  }

  private onToolActivated = (payload?: ToolActivatedPayload): void => {
    if (!payload) return;

    this.highlighter?.setStyle(payload.style.hover);
    this.selector?.setStyle(payload.style.selection);

    this.inputHandler?.setMode(payload.mode);

    // курсор
    this.scene.input.setDefaultCursor(payload.cursor); // Phaser API [web:61]

    // опционально: очистить выделение при смене инструмента
    this.selector?.cancel();
  };
}

export default MapModule;
