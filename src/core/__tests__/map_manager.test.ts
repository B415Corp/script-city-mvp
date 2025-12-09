import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapManager } from '../map_manager/map_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import type { IMapService } from '../map_manager/map_service';
import type { MapRenderer } from '../map_manager/map_renderer';

// Mock MapRenderer to avoid Phaser usage in tests
vi.mock('../map_manager/map_renderer', () => {
  class MapRendererMock {
    public attachedScene: unknown;
    public updateTile = vi.fn<(x: number, y: number) => void>();

    attachToScene(scene: unknown): void {
      this.attachedScene = scene;
    }
  }
  return { MapRenderer: MapRendererMock };
});

// Используем реальный MapService, но шпионим его методы; MapRenderer замокан.
describe('MapManager', () => {
  const eventBus = new EventBus();
  let mapManager: MapManager;

  const coreStub = {
    getEventBus: () => eventBus,
    getSceneController: () => undefined,
  } as unknown as import('../game_core/game_core').GameCore;

  beforeEach(() => {
    // 1) Создаём MapManager с заглушкой core.
    mapManager = new MapManager(coreStub);
  });

  it('delegates getTileInfo and setTile to MapService', () => {
    // 1) Достаём mapService из инстанса.
    const mapService = (mapManager as unknown as { mapService: IMapService }).mapService;
    // 2) Ставим шпионы на методы сервиса.
    const getTileSpy = vi
      .spyOn(mapService, 'getTileInfo')
      .mockReturnValue({ x: 1, y: 2, type: 3, typeName: 'demo' });
    const setTileSpy = vi.spyOn(mapService, 'setTile').mockReturnValue(true);
    // 3) Вызываем методы фасада.
    const tile = mapManager.getTileInfo(1, 2);
    const setResult = mapManager.setTile(1, 2, 3);
    // 4) Проверяем делегирование и результаты.
    expect(getTileSpy).toHaveBeenCalledWith(1, 2);
    expect(tile).toEqual({ x: 1, y: 2, type: 3, typeName: 'demo' });
    expect(setTileSpy).toHaveBeenCalledWith(1, 2, 3);
    expect(setResult).toBe(true);
  });

  it('updates renderer when tile change event is emitted', () => {
    // После initialize подписка на TileChanged должна вызвать updateTile у рендерера.
    // 1) Инициализируем менеджер (подписка на событие).
    mapManager.initialize();
    // 2) Получаем замоканный mapRenderer и ставим шпион.
    const mapRenderer = (mapManager as unknown as { mapRenderer: MapRenderer }).mapRenderer;
    const updateSpy = vi.spyOn(mapRenderer, 'updateTile');
    // 3) Эмитим событие TileChanged.
    eventBus.emit(Events.TileChanged, { x: 5, y: 6, oldType: 0, newType: 1 });
    // 4) Проверяем, что обновление тайла вызвано.
    expect(updateSpy).toHaveBeenCalledWith(5, 6);
  });
});
