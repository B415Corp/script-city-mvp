import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Events } from '../event_bus/events';

// Мокаем тяжёлые зависимости, чтобы проверить жизненный цикл GameCore изолированно.
vi.mock('../save_manager/save_manager', () => {
  return {
    SaveManager: class {
      initialize = vi.fn();
      destroy = vi.fn();
    },
  };
});

vi.mock('../map_manager/map_manager', () => {
  return {
    MapManager: class {
      initialize = vi.fn();
      attachToScene = vi.fn();
    },
  };
});

vi.mock('../simulation_loop/simulation_loop', () => {
  return {
    SimulationLoop: class {
      destroy = vi.fn();
    },
  };
});

import { GameCore } from '../game_core/game_core';

// Тестируем initialize/start/stop/destroy и базовую регистрацию команд.
describe('GameCore', () => {
  let core: GameCore;

  beforeEach(() => {
    // Создаём новый экземпляр перед каждым тестом
    core = new GameCore();
  });

  it('initializes managers and registers base command handlers', async () => {
    // 1) Инициализируем ядро с полным конфигом.
    await core.initialize({
      tickRate: 5,
      maxCatchUpTicks: 2,
      enableDebug: false,
      playerName: 'test',
    });
    // 2) Проверяем, что EventBus создан.
    expect(core.getEventBus()).toBeDefined();
    // 3) Проверяем, что CommandProcessor инициализирован (регистрация базовых хэндлеров прошла).
    expect(core.getCommandProcessor()).toBeDefined();
    // 4) На старте нет модулей.
    expect(core.getModuleManager().getAllModules()).toEqual([]);
  });

  it('starts and stops emitting lifecycle events', async () => {
    // 1) Инициализируем ядро.
    await core.initialize({
      tickRate: 5,
      maxCatchUpTicks: 2,
      enableDebug: false,
      playerName: 'test',
    });
    // 2) Подписываемся на GameStarted / GameStopped.
    const started: Events[] = [];
    const stopped: Events[] = [];
    core.getEventBus().on(Events.GameStarted, () => started.push(Events.GameStarted));
    core.getEventBus().on(Events.GameStopped, () => stopped.push(Events.GameStopped));
    // 3) Запускаем ядро.
    await core.start();
    // 4) Останавливаем ядро.
    core.stop();
    // 5) Проверяем, что оба события были отправлены.
    expect(started).toEqual([Events.GameStarted]);
    expect(stopped).toEqual([Events.GameStopped]);
  });

  it('destroy clears state and stops managers', async () => {
    // 1) Инициализируем ядро.
    await core.initialize({
      tickRate: 5,
      maxCatchUpTicks: 2,
      enableDebug: false,
      playerName: 'test',
    });
    // 2) Ставим шпионы на очистку подсистем.
    const ecsClear = vi.spyOn(core.getECSManager(), 'clear');
    const eventClear = vi.spyOn(core.getEventBus(), 'clear');
    const moduleClear = vi.spyOn(core.getModuleManager(), 'clear');
    // 3) Уничтожаем ядро.
    core.destroy();
    // 4) Проверяем, что очистки были вызваны.
    expect(ecsClear).toHaveBeenCalled();
    expect(eventClear).toHaveBeenCalled();
    expect(moduleClear).toHaveBeenCalled();
  });
});
