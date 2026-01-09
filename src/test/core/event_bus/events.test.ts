import { describe, it, expect } from 'vitest';
import { Events } from '../../../core/event_bus/events';

describe('Events enum', () => {
  it('should have all required event types', () => {
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

  it('should have unique values', () => {
    const values = Object.values(Events);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('should be usable as string literals', () => {
    const eventName: string = Events.GameStarted;
    expect(eventName).toBe('GameStarted');
    expect(typeof eventName).toBe('string');
  });

  it('should be usable in arrays and sets', () => {
    const eventArray = [Events.GameStarted, Events.LogicTick, Events.CallSystem];
    expect(eventArray).toContain(Events.GameStarted);
    expect(eventArray).toContain(Events.LogicTick);
    expect(eventArray).toContain(Events.CallSystem);

    const eventSet = new Set([Events.GameStarted, Events.LogicTick]);
    expect(eventSet.has(Events.GameStarted)).toBe(true);
    expect(eventSet.has(Events.LogicTick)).toBe(true);
    expect(eventSet.has(Events.GamePaused)).toBe(false);
  });

  it('should work with object keys', () => {
    const eventHandlers = {
      [Events.GameStarted]: () => 'game started',
      [Events.LogicTick]: () => 'logic tick',
      [Events.CallSystem]: () => 'call system',
    };

    expect(eventHandlers[Events.GameStarted]()).toBe('game started');
    expect(eventHandlers[Events.LogicTick]()).toBe('logic tick');
    expect(eventHandlers[Events.CallSystem]()).toBe('call system');
  });

  it('should be iterable', () => {
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

  describe('event categories', () => {
    it('should have game state events', () => {
      const gameStateEvents = [Events.GameStarted, Events.GamePaused, Events.GameStopped];

      gameStateEvents.forEach((event) => {
        expect(typeof event).toBe('string');
        expect(event.startsWith('Game')).toBe(true);
      });
    });

    it('should have tick-related events', () => {
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

    it('should have map-related events', () => {
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

    it('should have tool-related events', () => {
      const toolEvents = [Events.SelectTool, Events.ToolActivated, Events.ResetToolToDefault];

      toolEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('should have module-related events', () => {
      const moduleEvents = [Events.ModuleEnabled, Events.ModuleDisabled, Events.ModuleError];

      moduleEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });

    it('should have ECS-related events', () => {
      const ecsEvents = [Events.CallSystem];

      ecsEvents.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });
  });
});
