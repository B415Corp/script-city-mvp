import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Глобальные моки
const mockPhaserGame = {
  scale: {
    resize: vi.fn(),
  } as any,
  events: {
    once: vi.fn(),
  } as any,
  scene: {
    getScene: vi.fn(),
  } as any,
  destroy: vi.fn(),
} as any;

const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  clear: vi.fn(),
  getListenerCount: vi.fn(),
  emitLegacy: vi.fn(),
  onLegacy: vi.fn(),
  clearEvents: vi.fn(),
} as any;

const mockTickManager = {
  start: vi.fn(),
  stop: vi.fn(),
  update: vi.fn(),
  getCurrentTick: vi.fn(),
  getTickRate: vi.fn(),
  getFixedStepMs: vi.fn(),
  isPaused: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  togglePause: vi.fn(),
  getTickController: vi.fn(),
  getTimeService: vi.fn(),
  destroy: vi.fn(),
} as any;

const mockECSManager = {
  destroy: vi.fn(),
  getWorld: vi.fn(),
} as any;

const mockModuleManager = {
  init: vi.fn(),
  destroy: vi.fn(),
} as any;

const mockEntrySimulation = {
  start: vi.fn(),
} as any;

const mockMainScene = {
  init: vi.fn(),
  setModuleManager: vi.fn(),
} as any;

// Будут определены после импорта через vi.mocked

// Мокаем все зависимости перед импортом Core
vi.mock('phaser', () => {
  const MockPhaserGame = vi.fn(function () {
    return mockPhaserGame;
  });

  return {
    default: {
      AUTO: 0,
      Game: MockPhaserGame,
      Scene: class MockScene {},
      Types: {
        Core: {
          GameConfig: {},
        },
      },
    },
  };
});

vi.mock('../event_bus/event_bus', () => ({
  EventBus: vi.fn(function () {
    return mockEventBus;
  }),
}));

vi.mock('../tick/tick_manager', () => ({
  TickManager: vi.fn(function () {
    return mockTickManager;
  }),
}));

vi.mock('../ecs/ecs_manager', () => ({
  ECSManager: vi.fn(function () {
    return mockECSManager;
  }),
}));

vi.mock('../modules/module_manager', () => ({
  default: vi.fn(function () {
    return mockModuleManager;
  }),
  ModuleManager: vi.fn(function () {
    return mockModuleManager;
  }),
}));

vi.mock('../scenes', () => ({
  MainScene: vi.fn(function () {
    return mockMainScene;
  }),
}));

vi.mock('../simulations/entry_simulation', () => ({
  EntrySimulation: vi.fn(function () {
    return mockEntrySimulation;
  }),
}));

vi.mock('../ecs/registry/component_registry');
vi.mock('../ecs/registry/system_registry');
vi.mock('../ecs/registry/cluster_registry');
vi.mock('../ecs/registry/entity_factory_registry');

import Phaser from 'phaser';
import { Core, CoreBuilder } from '../core';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { ECSManager } from '../ecs/ecs_manager';
import { ModuleManager } from '../modules/module_manager';
import { MainScene } from '../scenes';
import { EntrySimulation } from '../simulations/entry_simulation';
import { ComponentRegistry } from '../ecs/registry/component_registry';
import { SystemRegistry } from '../ecs/registry/system_registry';
import { ClusterRegistry } from '../ecs/registry/cluster_registry';
import { EntityFactoryRegistry } from '../ecs/registry/entity_factory_registry';

// Получаем ссылки на замоканные конструкторы
const MockPhaserGame = vi.mocked(Phaser.Game);
const MockEventBus = vi.mocked(EventBus);
const MockTickManager = vi.mocked(TickManager);
const MockECSManager = vi.mocked(ECSManager);
const MockModuleManager = vi.mocked(ModuleManager);
const MockMainScene = vi.mocked(MainScene);
const MockEntrySimulation = vi.mocked(EntrySimulation);

describe('Core', () => {
  let mockPhaserConfig: Phaser.Types.Core.GameConfig;

  // Моки для window и event listeners
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;

  // Моки для реестров
  let mockComponentRegistry: ComponentRegistry;
  let mockSystemRegistry: SystemRegistry;
  let mockClusterRegistry: ClusterRegistry;
  let mockEntityFactoryRegistry: EntityFactoryRegistry;
  let mockTimeService: { setTime: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки
    mockPhaserConfig = {
      type: 0, // Phaser.AUTO
      width: 800,
      height: 600,
      scene: [],
    };

    // Настраиваем моки
    vi.mocked(mockPhaserGame.scene.getScene).mockReturnValue(mockMainScene);

    // Мокаем TimeService для TickManager
    mockTimeService = {
      setTime: vi.fn(),
    };
    mockTickManager.getTimeService = vi.fn().mockReturnValue(mockTimeService);

    // Мокаем window event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    // Настраиваем моки реестров
    mockComponentRegistry = {
      clear: vi.fn(),
    } as unknown as ComponentRegistry;

    mockSystemRegistry = {
      clear: vi.fn(),
    } as unknown as SystemRegistry;

    mockClusterRegistry = {
      clear: vi.fn(),
    } as unknown as ClusterRegistry;

    mockEntityFactoryRegistry = {
      clear: vi.fn(),
    } as unknown as EntityFactoryRegistry;

    // Мокаем getInstance методы
    (ComponentRegistry.getInstance as any).mockReturnValue(mockComponentRegistry);
    (SystemRegistry.getInstance as any).mockReturnValue(mockSystemRegistry);
    (ClusterRegistry.getInstance as any).mockReturnValue(mockClusterRegistry);
    (EntityFactoryRegistry.getInstance as any).mockReturnValue(mockEntityFactoryRegistry);
  });

  describe('CoreBuilder', () => {
    it('должен создавать Core с кастомными зависимостями', () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withPhaser(mockPhaserGame)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .build();

      expect(core).toBeDefined();
      expect(core._phaser).toBeUndefined(); // Не инициализирован
      expect(core._eventBus).toBeUndefined(); // Не инициализирован
    });

    it('должен инициализировать Phaser с помощью фабрики', async () => {
      const core = new CoreBuilder(mockPhaserConfig).withPhaser(mockPhaserGame).build();

      await core.initializePhaser();

      expect(core._phaser).toBe(mockPhaserGame);
    });

    it('должен инициализировать EventBus с помощью фабрики', async () => {
      const core = new CoreBuilder(mockPhaserConfig).withEventBus(mockEventBus).build();

      await core.initializeEventBus();

      expect(core._eventBus).toBe(mockEventBus);
    });

    it('должен инициализировать TickManager с EventBus', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .build();

      await core.initializeEventBus();
      core.initializeTickManager();

      expect(core._tickManager).toBe(mockTickManager);
      expect(mockTimeService.setTime).toHaveBeenCalledWith(2 * 60);
    });

    it('должен выбрасывать ошибку при инициализации TickManager без EventBus', () => {
      const core = new CoreBuilder(mockPhaserConfig).build();

      expect(() => core.initializeTickManager()).toThrow(
        'EventBus must be initialized before TickManager',
      );
    });

    it('должен инициализировать ECSManager с EventBus и TickManager', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .withECSManager(mockECSManager)
        .build();

      await core.initializeEventBus();
      core.initializeTickManager();
      await core.initializeECSManager();

      expect(core._ecsManager).toBe(mockECSManager);
    });

    it('должен выбрасывать ошибку при инициализации ECSManager без зависимостей', async () => {
      const core = new CoreBuilder(mockPhaserConfig).build();

      await expect(core.initializeECSManager()).rejects.toThrow(
        'EventBus and TickManager must be initialized before ECSManager',
      );
    });
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('constructor', () => {
    it('должен корректно инициализироваться с конфигом Phaser', () => {
      const core = new Core(mockPhaserConfig);

      expect(core).toBeDefined();
      expect(core._phaserConfig).toBe(mockPhaserConfig);
      expect(core._enableSimulation).toBe(false);
    });

    it('должен настраивать resize handler в конструкторе', () => {
      const core = new Core(mockPhaserConfig);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(core._resizeHandler).toBeDefined();
    });
  });

  describe('setupResizeHandler', () => {
    it('должен корректно настраивать обработчик resize', () => {
      const core = new Core(mockPhaserConfig);
      const resizeHandler = core._resizeHandler;

      expect(resizeHandler).toBeDefined();
      expect(typeof resizeHandler).toBe('function');
    });

    it('должен изменять размер Phaser при resize события', () => {
      const core = new Core(mockPhaserConfig);
      core._phaser = mockPhaserGame;

      const resizeHandler = core._resizeHandler;
      expect(resizeHandler).toBeDefined();
      resizeHandler!();

      expect(mockPhaserGame.scale.resize).toHaveBeenCalledWith(
        window.innerWidth,
        window.innerHeight,
      );
    });

    it('не должен падать если Phaser не инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      core._phaser = undefined;

      const resizeHandler = core._resizeHandler;
      expect(resizeHandler).toBeDefined();

      expect(() => resizeHandler!()).not.toThrow();
    });
  });

  describe('destroy', () => {
    let core: Core;

    beforeEach(() => {
      core = new Core(mockPhaserConfig);
      core._phaser = mockPhaserGame;
      core._eventBus = mockEventBus;
      core._tickManager = mockTickManager;
      core._ecsManager = mockECSManager;
      core._moduleManager = mockModuleManager;
    });

    it('должен удалять resize listener', () => {
      core.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(core._resizeHandler).toBeUndefined();
    });

    it('должен уничтожать ModuleManager с error handling', () => {
      const destroySpy = vi.spyOn(mockModuleManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(core._moduleManager).toBeUndefined();
    });

    it('должен обрабатывать ошибки при уничтожении ModuleManager', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockModuleManager, 'destroy').mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Core] Error destroying ModuleManager:',
        expect.any(Error),
      );
      expect(core._moduleManager).toBeUndefined();
    });

    it('должен уничтожать ECSManager с error handling', () => {
      const destroySpy = vi.spyOn(mockECSManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(core._ecsManager).toBeNull();
    });

    it('должен обрабатывать ошибки при уничтожении ECSManager', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockECSManager, 'destroy').mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Core] Error destroying ECSManager:',
        expect.any(Error),
      );
      expect(core._ecsManager).toBeNull();
    });

    it('должен уничтожать TickManager с error handling', () => {
      const destroySpy = vi.spyOn(mockTickManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(core._tickManager).toBeUndefined();
    });

    it('должен обрабатывать ошибки при уничтожении TickManager', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockTickManager, 'destroy').mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Core] Error destroying TickManager:',
        expect.any(Error),
      );
      expect(core._tickManager).toBeUndefined();
    });

    it('должен уничтожать EventBus с error handling', () => {
      const clearSpy = vi.spyOn(mockEventBus, 'clear');

      core.destroy();

      expect(clearSpy).toHaveBeenCalled();
      expect(core._eventBus).toBeUndefined();
    });

    it('должен обрабатывать ошибки при уничтожении EventBus', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockEventBus, 'clear').mockImplementation(() => {
        throw new Error('Clear failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Core] Error destroying EventBus:',
        expect.any(Error),
      );
      expect(core._eventBus).toBeUndefined();
    });

    it('должен уничтожать Phaser последним с error handling', () => {
      const destroySpy = vi.spyOn(mockPhaserGame, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalledWith(true);
      expect(core._phaser).toBeUndefined();
    });

    it('должен обрабатывать ошибки при уничтожении Phaser', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockPhaserGame, 'destroy').mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith('[Core] Error destroying Phaser:', expect.any(Error));
      expect(core._phaser).toBeUndefined();
    });
  });

  describe('init', () => {
    it('должен инициализировать Phaser с дефолтными фабриками', async () => {
      const core = new CoreBuilder(mockPhaserConfig).withPhaser(mockPhaserGame).build();

      await core.initializePhaser();

      expect(core._phaser).toBe(mockPhaserGame);
    });

    it('должен инициализировать EventBus с дефолтными фабриками', async () => {
      const core = new CoreBuilder(mockPhaserConfig).withEventBus(mockEventBus).build();

      await core.initializeEventBus();

      expect(core._eventBus).toBe(mockEventBus);
    });

    it('должен инициализировать TickManager с EventBus', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .build();

      await core.initializeEventBus();
      core.initializeTickManager();

      expect(core._tickManager).toBe(mockTickManager);
      expect(mockTimeService.setTime).toHaveBeenCalledWith(2 * 60); // 2:00 AM
    });

    it('должен инициализировать ECSManager с EventBus и TickManager', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .withECSManager(mockECSManager)
        .build();

      await core.initializeEventBus();
      core.initializeTickManager();
      await core.initializeECSManager();

      expect(core._ecsManager).toBe(mockECSManager);
    });

    it('должен инициализировать модули после готовности Phaser', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withPhaser(mockPhaserGame)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .withECSManager(mockECSManager)
        .withModuleManager(mockModuleManager)
        .build();

      // Настраиваем все зависимости
      core._phaser = mockPhaserGame;
      core._eventBus = mockEventBus;
      core._tickManager = mockTickManager;
      core._ecsManager = mockECSManager;

      // Эмулируем событие 'ready'
      setTimeout(() => {
        mockPhaserGame.events.once.mock.calls.forEach(
          ([event, callback]: [string, (...args: unknown[]) => void]) => {
            if (event === 'ready') callback();
          },
        );
      }, 0);

      await core.initializeModules();

      expect(mockModuleManager.init).toHaveBeenCalled();
      expect(mockMainScene.init).toHaveBeenCalledWith(mockEventBus, mockTickManager);
      expect(mockMainScene.setModuleManager).toHaveBeenCalledWith(mockModuleManager);
    });

    it('должен корректно обрабатывать последовательность инициализации', async () => {
      const core = new CoreBuilder(mockPhaserConfig)
        .withPhaser(mockPhaserGame)
        .withEventBus(mockEventBus)
        .withTickManager(mockTickManager)
        .withECSManager(mockECSManager)
        .withModuleManager(mockModuleManager)
        .build();

      await core.initializePhaser();
      await core.initializeEventBus();
      core.initializeTickManager();
      await core.initializeECSManager();

      // Проверяем что все компоненты инициализированы правильно
      expect(core._phaser).toBe(mockPhaserGame);
      expect(core._eventBus).toBe(mockEventBus);
      expect(core._tickManager).toBe(mockTickManager);
      expect(core._ecsManager).toBe(mockECSManager);
    });
  });

  describe('ecsRegistries getter', () => {
    it('должен возвращать null если ECSManager не инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = null;

      expect(core.ecsRegistries).toBeNull();
    });

    it('должен возвращать объект с функциями доступа к реестрам если ECSManager инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = mockECSManager;

      const registries = core.ecsRegistries;

      expect(registries).toBeDefined();
      expect(registries).not.toBeNull();
      expect(typeof registries?.components).toBe('function');
      expect(typeof registries?.systems).toBe('function');
      expect(typeof registries?.clusters).toBe('function');
      expect(typeof registries?.entityFactories).toBe('function');
    });

    it('components() должен возвращать ComponentRegistry', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const componentRegistry = registries?.components();

      expect(componentRegistry).toBe(mockComponentRegistry);
      expect(ComponentRegistry.getInstance).toHaveBeenCalled();
    });

    it('systems() должен возвращать SystemRegistry', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const systemRegistry = registries?.systems();

      expect(systemRegistry).toBe(mockSystemRegistry);
      expect(SystemRegistry.getInstance).toHaveBeenCalled();
    });

    it('clusters() должен возвращать ClusterRegistry', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const clusterRegistry = registries?.clusters();

      expect(clusterRegistry).toBe(mockClusterRegistry);
      expect(ClusterRegistry.getInstance).toHaveBeenCalled();
    });

    it('entityFactories() должен возвращать EntityFactoryRegistry', () => {
      const core = new Core(mockPhaserConfig);
      core._ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const entityFactoryRegistry = registries?.entityFactories();

      expect(entityFactoryRegistry).toBe(mockEntityFactoryRegistry);
      expect(EntityFactoryRegistry.getInstance).toHaveBeenCalled();
    });
  });
});
