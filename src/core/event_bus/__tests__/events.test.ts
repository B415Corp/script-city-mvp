import { describe, it, expect } from 'vitest';
import { Events } from '../events';

describe('Events enum', () => {
  describe('Наличие всех необходимых событий', () => {
    it('должен содержать события состояния игры', () => {
      expect(Events.GameStarted).toBe('GameStarted');
      expect(Events.GamePaused).toBe('GamePaused');
      expect(Events.GameStopped).toBe('GameStopped');
      expect(Events.GamePauseToggle).toBe('GamePauseToggle');
    });

    it('должен содержать события тиков', () => {
      expect(Events.TickStarted).toBe('TickStarted');
      expect(Events.TickEnded).toBe('TickEnded');
      expect(Events.LogicTick).toBe('LogicTick');
      expect(Events.SetGameSpeed).toBe('SetGameSpeed');
      expect(Events.GameTimeUpdated).toBe('GameTimeUpdated');
    });

    it('должен содержать события карты', () => {
      expect(Events.MapCentered).toBe('MapCentered');
      expect(Events.SceneReady).toBe('SceneReady');
    });

    it('должен содержать события взаимодействия с картой', () => {
      expect(Events.TileHovered).toBe('TileHovered');
      expect(Events.TileUnhovered).toBe('TileUnhovered');
      expect(Events.CameraZoomed).toBe('CameraZoomed');
      expect(Events.TileClicked).toBe('TileClickedDown');
      expect(Events.TileClickedUp).toBe('TileClickedUp');
      expect(Events.TilesSelected).toBe('TilesSelected');
    });

    it('должен содержать события инструментов', () => {
      expect(Events.SelectTool).toBe('SelectTool');
      expect(Events.ToolActivated).toBe('ToolActivated');
      expect(Events.ResetToolToDefault).toBe('ResetToolToDefault');
    });

    it('должен содержать события модулей', () => {
      expect(Events.ModuleEnabled).toBe('ModuleEnabled');
      expect(Events.ModuleDisabled).toBe('ModuleDisabled');
      expect(Events.ModuleError).toBe('ModuleError');
    });

    it('должен содержать события ECS систем', () => {
      expect(Events.CallSystem).toBe('CallSystem');
      expect(Events.SystemError).toBe('SystemError');
    });

    it('должен содержать legacy события времени для тестов', () => {
      expect(Events.TimeTick).toBe('time:tick');
      expect(Events.TimeDay).toBe('time:day');
    });

    it('должен содержать события граждан', () => {
      expect(Events.CitizenHired).toBe('citizen:hired');
    });
  });

  describe('Уникальность значений', () => {
    it('все значения enum должны быть уникальными', () => {
      const values = Object.values(Events);
      const uniqueValues = new Set(values);

      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('Типизация', () => {
    it('должен быть enum с string значениями', () => {
      // Проверяем что все значения являются строками
      Object.values(Events).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('должен позволять использовать значения как строки', () => {
      const eventName: string = Events.GameStarted;
      expect(eventName).toBe('GameStarted');
    });

    it('должен позволять использовать ключи как тип Events', () => {
      const event: Events = Events.LogicTick;
      expect(event).toBe('LogicTick');
    });
  });

  describe('Группировка событий по доменам', () => {
    it('события состояния игры должны иметь префикс Game', () => {
      const gameEvents = [
        Events.GameStarted,
        Events.GamePaused,
        Events.GameStopped,
        Events.GamePauseToggle,
      ];

      gameEvents.forEach((event) => {
        expect(event.startsWith('Game')).toBe(true);
      });
    });

    it('события тиков должны иметь понятные имена', () => {
      const tickEvents = [
        Events.TickStarted,
        Events.TickEnded,
        Events.LogicTick,
        Events.SetGameSpeed,
        Events.GameTimeUpdated,
      ];

      tickEvents.forEach((event) => {
        expect(event.length).toBeGreaterThan(0);
        // Проверяем что нет странных символов
        expect(event).not.toMatch(/[^a-zA-Z:]/);
      });
    });

    it('события карты должны иметь понятные имена', () => {
      const mapEvents = [
        Events.MapCentered,
        Events.SceneReady,
        Events.TileHovered,
        Events.TileUnhovered,
        Events.CameraZoomed,
        Events.TileClicked,
        Events.TileClickedUp,
        Events.TilesSelected,
      ];

      mapEvents.forEach((event) => {
        expect(event.length).toBeGreaterThan(0);
      });
    });

    it('события инструментов должны иметь понятные имена', () => {
      const toolEvents = [Events.SelectTool, Events.ToolActivated, Events.ResetToolToDefault];

      toolEvents.forEach((event) => {
        expect(event.includes('Tool')).toBe(true);
      });
    });

    it('события модулей должны иметь префикс Module', () => {
      const moduleEvents = [Events.ModuleEnabled, Events.ModuleDisabled, Events.ModuleError];

      moduleEvents.forEach((event) => {
        expect(event.startsWith('Module')).toBe(true);
      });
    });

    it('события систем должны иметь понятные имена', () => {
      const systemEvents = [Events.CallSystem, Events.SystemError];

      systemEvents.forEach((event) => {
        expect(event.includes('System')).toBe(true);
      });
    });
  });

  describe('Legacy совместимость', () => {
    it('legacy события времени должны использовать двоеточие', () => {
      expect(Events.TimeTick).toContain(':');
      expect(Events.TimeDay).toContain(':');
      expect(Events.TimeTick).toBe('time:tick');
      expect(Events.TimeDay).toBe('time:day');
    });

    it('события граждан должны использовать двоеточие', () => {
      expect(Events.CitizenHired).toContain(':');
      expect(Events.CitizenHired).toBe('citizen:hired');
    });
  });

  describe('Полный список событий', () => {
    it('должен содержать ровно 28 событий', () => {
      const eventCount = Object.keys(Events).length;
      expect(eventCount).toBe(28);
    });

    it('должен содержать все ожидаемые события', () => {
      const expectedEvents = [
        'GameStarted',
        'GamePaused',
        'GameStopped',
        'TickStarted',
        'TickEnded',
        'MapCentered',
        'SceneReady',
        'LogicTick',
        'GamePauseToggle',
        'SetGameSpeed',
        'GameTimeUpdated',
        'TileUnhovered',
        'TileHovered',
        'CameraZoomed',
        'TileClickedDown',
        'TileClickedUp',
        'TilesSelected',
        'SelectTool',
        'ToolActivated',
        'ResetToolToDefault',
        'ModuleEnabled',
        'ModuleDisabled',
        'ModuleError',
        'CallSystem',
        'SystemError',
        'time:tick',
        'time:day',
        'citizen:hired',
      ];

      const actualEvents = Object.values(Events);
      expect(actualEvents).toHaveLength(expectedEvents.length);

      expectedEvents.forEach((expectedEvent) => {
        expect(actualEvents).toContain(expectedEvent);
      });
    });
  });
});
