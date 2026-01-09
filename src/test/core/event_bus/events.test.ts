import { describe, it, expect } from 'vitest';
import { Events } from '../../../core/event_bus/events';

describe('Перечисление событий (Events enum)', () => {
  it('должен содержать все необходимые типы событий', () => {
    // Game state events
    expect(Events.GameStarted).toBe('GameStarted');
    expect(Events.GamePaused).toBe('GamePaused');
    expect(Events.GameStopped).toBe('GameStopped');

    // Tick events
    expect(Events.TickStarted).toBe('TickStarted');
    expect(Events.TickEnded).toBe('TickEnded');
    expect(Events.MapCentered).toBe('MapCentered');
    expect(Events.SceneReady).toBe('SceneReady');
    expect(Events.LogicTick).toBe('LogicTick');
    expect(Events.GamePauseToggle).toBe('GamePauseToggle');
    expect(Events.SetGameSpeed).toBe('SetGameSpeed');
    expect(Events.GameTimeUpdated).toBe('GameTimeUpdated');

    // Map events
    expect(Events.TileUnhovered).toBe('TileUnhovered');
    expect(Events.TileHovered).toBe('TileHovered');
    expect(Events.CameraZoomed).toBe('CameraZoomed');
    expect(Events.TileClicked).toBe('TileClickedDown');
    expect(Events.TileClickedUp).toBe('TileClickedUp');
    expect(Events.TilesSelected).toBe('TilesSelected');

    // Tool events
    expect(Events.SelectTool).toBe('SelectTool');
    expect(Events.ToolActivated).toBe('ToolActivated');
    expect(Events.ResetToolToDefault).toBe('ResetToolToDefault');

    // Module events
    expect(Events.ModuleEnabled).toBe('ModuleEnabled');
    expect(Events.ModuleDisabled).toBe('ModuleDisabled');
    expect(Events.ModuleError).toBe('ModuleError');

    // ECS events
    expect(Events.CallSystem).toBe('CallSystem');
  });

  it('должен иметь уникальные значения', () => {
    const values = Object.values(Events);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('должен быть пригоден для использования в качестве строковых литералов', () => {
    const eventName: string = Events.GameStarted;
    expect(eventName).toBe('GameStarted');
    expect(typeof eventName).toBe('string');
  });

  it('должен быть пригоден для использования в массивах и множествах', () => {
    const eventArray = [Events.GameStarted, Events.LogicTick, Events.CallSystem];
    expect(eventArray).toContain(Events.GameStarted);
    expect(eventArray).toContain(Events.LogicTick);
    expect(eventArray).toContain(Events.CallSystem);

    const eventSet = new Set([Events.GameStarted, Events.LogicTick]);
    expect(eventSet.has(Events.GameStarted)).toBe(true);
    expect(eventSet.has(Events.LogicTick)).toBe(true);
    expect(eventSet.has(Events.GamePaused)).toBe(false);
  });

  it('должен работать с ключами объектов', () => {
    const eventHandlers = {
      [Events.GameStarted]: () => 'game started',
      [Events.LogicTick]: () => 'logic tick',
      [Events.CallSystem]: () => 'call system',
    };

    expect(eventHandlers[Events.GameStarted]()).toBe('game started');
    expect(eventHandlers[Events.LogicTick]()).toBe('logic tick');
    expect(eventHandlers[Events.CallSystem]()).toBe('call system');
  });

  it('должен быть итерируемым', () => {
    const eventKeys = Object.keys(Events);
    const eventValues = Object.values(Events);

    expect(eventKeys.length).toBeGreaterThan(0);
    expect(eventValues.length).toBeGreaterThan(0);
    expect(eventKeys.length).toBe(eventValues.length);

    // Check that all values are strings
    eventValues.forEach((value) => {
      expect(typeof value).toBe('string');
    });
  });

  describe('категории событий', () => {
    it('должен содержать события состояния игры', () => {
      const gameStateEvents = [Events.GameStarted, Events.GamePaused, Events.GameStopped];

      gameStateEvents.forEach((event) => {
        expect(typeof event).toBe('string');
        expect(event.startsWith('Game')).toBe(true);
      });
    });

    it('должен содержать события связанные с тиками', () => {
      const tickEvents = [
        Events.TickStarted,
        Events.TickEnded,
        Events.LogicTick,
        Events.GameTimeUpdated,
      ];

      tickEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('должен содержать события связанные с картой', () => {
      const mapEvents = [
        Events.TileUnhovered,
        Events.TileHovered,
        Events.CameraZoomed,
        Events.TileClicked,
        Events.TileClickedUp,
        Events.TilesSelected,
      ];

      mapEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('должен содержать события связанные с инструментами', () => {
      const toolEvents = [Events.SelectTool, Events.ToolActivated, Events.ResetToolToDefault];

      toolEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('должен содержать события связанные с модулями', () => {
      const moduleEvents = [Events.ModuleEnabled, Events.ModuleDisabled, Events.ModuleError];

      moduleEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('должен содержать события связанные с ECS', () => {
      const ecsEvents = [Events.CallSystem];

      ecsEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });
  });
});
