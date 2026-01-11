import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Мокаем все зависимости перед импортом Core
vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    Game: vi.fn(),
    Scene: class MockScene {},
    Types: {
      Core: {
        GameConfig: {},
      },
    },
  },
}));

vi.mock('../event_bus/event_bus');
vi.mock('../tick/tick_manager');
vi.mock('../ecs/ecs_manager');
vi.mock('../modules/module_manager');
vi.mock('../scenes');
vi.mock('../simulations/entry_simulation');
vi.mock('../ecs/registry/component_registry');
vi.mock('../ecs/registry/system_registry');
vi.mock('../ecs/registry/cluster_registry');
vi.mock('../ecs/registry/entity_factory_registry');

import Phaser from 'phaser';
import { Core } from '../core';
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

describe('Core', () => {
  let mockPhaserConfig: Phaser.Types.Core.GameConfig;
  let mockPhaserGame: Phaser.Game;
  let mockEventBus: EventBus;
  let mockTickManager: TickManager;
  let mockECSManager: ECSManager;
  let mockModuleManager: ModuleManager;
  let mockMainScene: MainScene;
  let mockEntrySimulation: EntrySimulation;

  // Моки для window и event listeners
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  // Моки для реестров
  let mockComponentRegistry: ComponentRegistry;
  let mockSystemRegistry: SystemRegistry;
  let mockClusterRegistry: ClusterRegistry;
  let mockEntityFactoryRegistry: EntityFactoryRegistry;
  let mockTimeService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки
    mockPhaserConfig = {
      type: 0, // Phaser.AUTO
      width: 800,
      height: 600,
      scene: [],
    };

    mockPhaserGame = {
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

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      clear: vi.fn(),
      getListenerCount: vi.fn(),
      emitLegacy: vi.fn(),
      onLegacy: vi.fn(),
      clearEvents: vi.fn(),
    } as unknown as EventBus;

    mockTickManager = {
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
    } as unknown as TickManager;

    mockECSManager = {
      destroy: vi.fn(),
      getWorld: vi.fn(),
    } as unknown as ECSManager;

    mockModuleManager = {
      init: vi.fn(),
      destroy: vi.fn(),
    } as unknown as ModuleManager;

    mockMainScene = {
      init: vi.fn(),
      setModuleManager: vi.fn(),
    } as unknown as MainScene;

    mockEntrySimulation = {
      start: vi.fn(),
    } as unknown as EntrySimulation;

    // Мокаем конструкторы
    vi.mocked(Phaser.Game).mockImplementation(() => mockPhaserGame);
    vi.mocked(EventBus as any).mockImplementation(() => mockEventBus);
    vi.mocked(TickManager as any).mockImplementation(() => mockTickManager);
    vi.mocked(ECSManager as any).mockImplementation(() => mockECSManager);
    vi.mocked(ModuleManager as any).mockImplementation(() => mockModuleManager);
    vi.mocked(EntrySimulation as any).mockImplementation(() => mockEntrySimulation);

    // Мокаем получение сцены
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

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('constructor', () => {
    it('должен корректно инициализироваться с конфигом Phaser', () => {
      const core = new Core(mockPhaserConfig);

      expect(core).toBeDefined();
      expect((core as any).phaserConfig).toBe(mockPhaserConfig);
      expect((core as any).enableSimulation).toBe(false);
    });

    it('должен настраивать resize handler в конструкторе', () => {
      const core = new Core(mockPhaserConfig);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect((core as any).resizeHandler).toBeDefined();
    });
  });

  describe('setupResizeHandler', () => {
    it('должен корректно настраивать обработчик resize', () => {
      const core = new Core(mockPhaserConfig);
      const resizeHandler = (core as any).resizeHandler;

      expect(resizeHandler).toBeDefined();
      expect(typeof resizeHandler).toBe('function');
    });

    it('должен изменять размер Phaser при resize события', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).phaser = mockPhaserGame;

      const resizeHandler = (core as any).resizeHandler;
      resizeHandler();

      expect(mockPhaserGame.scale.resize).toHaveBeenCalledWith(
        window.innerWidth,
        window.innerHeight,
      );
    });

    it('не должен падать если Phaser не инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).phaser = undefined;

      const resizeHandler = (core as any).resizeHandler;

      expect(() => resizeHandler()).not.toThrow();
    });
  });

  describe('destroy', () => {
    let core: Core;

    beforeEach(() => {
      core = new Core(mockPhaserConfig);
      (core as any).phaser = mockPhaserGame;
      (core as any).eventBus = mockEventBus;
      (core as any).tickManager = mockTickManager;
      (core as any).ecsManager = mockECSManager;
      (core as any).moduleManager = mockModuleManager;
    });

    it('должен удалять resize listener', () => {
      core.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', (core as any).resizeHandler);
      expect((core as any).resizeHandler).toBeUndefined();
    });

    it('должен уничтожать ModuleManager с error handling', () => {
      const destroySpy = vi.spyOn(mockModuleManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect((core as any).moduleManager).toBeUndefined();
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
      expect((core as any).moduleManager).toBeUndefined();
    });

    it('должен уничтожать ECSManager с error handling', () => {
      const destroySpy = vi.spyOn(mockECSManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect((core as any).ecsManager).toBeNull();
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
      expect((core as any).ecsManager).toBeNull();
    });

    it('должен уничтожать TickManager с error handling', () => {
      const destroySpy = vi.spyOn(mockTickManager, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect((core as any).tickManager).toBeUndefined();
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
      expect((core as any).tickManager).toBeUndefined();
    });

    it('должен уничтожать EventBus с error handling', () => {
      const clearSpy = vi.spyOn(mockEventBus, 'clear');

      core.destroy();

      expect(clearSpy).toHaveBeenCalled();
      expect((core as any).eventBus).toBeUndefined();
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
      expect((core as any).eventBus).toBeUndefined();
    });

    it('должен уничтожать Phaser последним с error handling', () => {
      const destroySpy = vi.spyOn(mockPhaserGame, 'destroy');

      core.destroy();

      expect(destroySpy).toHaveBeenCalledWith(true);
      expect((core as any).phaser).toBeUndefined();
    });

    it('должен обрабатывать ошибки при уничтожении Phaser', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(mockPhaserGame, 'destroy').mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      core.destroy();

      expect(consoleSpy).toHaveBeenCalledWith('[Core] Error destroying Phaser:', expect.any(Error));
      expect((core as any).phaser).toBeUndefined();
    });
  });

  describe('init', () => {
    let core: Core;

    beforeEach(() => {
      core = new Core(mockPhaserConfig);
    });

    it('должен инициализировать Phaser', async () => {
      await core.init();

      expect(Phaser.Game).toHaveBeenCalledWith(mockPhaserConfig);
      expect((core as any).phaser).toBe(mockPhaserGame);
    });

    it('должен инициализировать EventBus', async () => {
      await core.init();

      expect(EventBus).toHaveBeenCalled();
      expect((core as any).eventBus).toBe(mockEventBus);
    });

    it('должен инициализировать TickManager с EventBus', async () => {
      await core.init();

      expect(TickManager).toHaveBeenCalledWith(mockEventBus, 10);
      expect((core as any).tickManager).toBe(mockTickManager);
      expect(mockTimeService.setTime).toHaveBeenCalledWith(2 * 60); // 2:00 AM
    });

    it('должен инициализировать ECSManager с EventBus и TickManager', async () => {
      await core.init();

      expect(ECSManager).toHaveBeenCalledWith(mockEventBus, mockTickManager);
      expect((core as any).ecsManager).toBe(mockECSManager);
    });

    it('должен инициализировать модули после готовности Phaser', async () => {
      // Получаем коллбэк для 'ready' события
      await core.init();

      // Имитируем вызов коллбэка 'ready'
      const readyCallback = vi
        .mocked(mockPhaserGame.events.once)
        .mock.calls.find(([event]: any) => event === 'ready')?.[1];

      if (readyCallback) {
        readyCallback();
      }

      expect(ModuleManager).toHaveBeenCalledWith(
        mockMainScene,
        mockEventBus,
        mockECSManager,
        mockTickManager,
      );
      expect(mockModuleManager.init).toHaveBeenCalled();
      expect(mockMainScene.init).toHaveBeenCalledWith(mockEventBus, mockTickManager);
      expect(mockMainScene.setModuleManager).toHaveBeenCalledWith(mockModuleManager);
    });

    it('должен корректно обрабатывать последовательность инициализации', async () => {
      await core.init();

      // Проверяем что Phaser инициализирован первым
      expect(Phaser.Game).toHaveBeenCalledWith(mockPhaserConfig);

      // Проверяем что EventBus инициализирован
      expect(EventBus).toHaveBeenCalled();

      // Проверяем что TickManager инициализирован с EventBus
      expect(TickManager).toHaveBeenCalledWith(mockEventBus, 10);

      // Проверяем что ECSManager инициализирован с EventBus и TickManager
      expect(ECSManager).toHaveBeenCalledWith(mockEventBus, mockTickManager);
    });

    it('должен запускать симуляцию если enableSimulation = true', async () => {
      // Меняем флаг enableSimulation
      (core as any).enableSimulation = true;

      await core.init();

      expect(EntrySimulation).toHaveBeenCalledWith(mockECSManager, mockEventBus, mockTickManager);
      expect(mockEntrySimulation.start).toHaveBeenCalled();
    });

    it('не должен запускать симуляцию если enableSimulation = false', async () => {
      (core as any).enableSimulation = false;

      await core.init();

      expect(EntrySimulation).not.toHaveBeenCalled();
      expect(mockEntrySimulation.start).not.toHaveBeenCalled();
    });

    it('должен выбрасывать ошибку если Phaser не может инициализироваться', async () => {
      (Phaser.Game as any).mockImplementation(() => {
        throw new Error('Phaser init failed');
      });

      await expect(core.init()).rejects.toThrow('Failed to initialize Phaser: Phaser init failed');
    });

    it('должен выбрасывать ошибку если EventBus не может инициализироваться', async () => {
      (EventBus as any).mockImplementation(() => {
        throw new Error('EventBus init failed');
      });

      await expect(core.init()).rejects.toThrow(
        'Failed to initialize EventBus: EventBus init failed',
      );
    });

    it('должен выбрасывать ошибку если TickManager не может инициализироваться', async () => {
      (TickManager as any).mockImplementation(() => {
        throw new Error('TickManager init failed');
      });

      await expect(core.init()).rejects.toThrow(
        'Failed to initialize TickManager: TickManager init failed',
      );
    });

    it('должен выбрасывать ошибку если ECSManager не может инициализироваться', async () => {
      (ECSManager as any).mockImplementation(() => {
        throw new Error('ECSManager init failed');
      });

      await expect(core.init()).rejects.toThrow(
        'Failed to initialize ECSManager: ECSManager init failed',
      );
    });

    it('должен выбрасывать ошибку если ECSManager инициализируется без EventBus', async () => {
      (core as any).eventBus = null;

      await expect(core.init()).rejects.toThrow(
        'EventBus and TickManager must be initialized before ECSManager',
      );
    });

    it('должен выбрасывать ошибку если ECSManager инициализируется без TickManager', async () => {
      (core as any).tickManager = null;

      await expect(core.init()).rejects.toThrow(
        'EventBus and TickManager must be initialized before ECSManager',
      );
    });

    it('должен выбрасывать ошибку при инициализации модулей если Phaser не инициализирован', async () => {
      (core as any).phaser = null;

      await expect(core.init()).rejects.toThrow('Phaser not initialized');
    });

    it('должен выбрасывать ошибку если MainScene не найдена', async () => {
      vi.mocked(mockPhaserGame.scene.getScene).mockReturnValue(undefined as any);

      await core.init();

      // Имитируем вызов коллбэка 'ready'
      const readyCallback = vi
        .mocked(mockPhaserGame.events.once)
        .mock.calls.find(([event]: any) => event === 'ready')?.[1];

      if (readyCallback) {
        await expect(readyCallback()).rejects.toThrow('MainScene not found');
      }
    });

    it('должен выбрасывать ошибку если EventBus не инициализирован при настройке модулей', async () => {
      (core as any).eventBus = null;

      await core.init();

      // Имитируем вызов коллбэка 'ready'
      const readyCallback = vi
        .mocked(mockPhaserGame.events.once)
        .mock.calls.find(([event]: any) => event === 'ready')?.[1];

      if (readyCallback) {
        await expect(readyCallback()).rejects.toThrow('EventBus not initialized');
      }
    });

    it('должен выбрасывать ошибку если TickManager не инициализирован при настройке модулей', async () => {
      (core as any).tickManager = null;

      await core.init();

      // Имитируем вызов коллбэка 'ready'
      const readyCallback = vi
        .mocked(mockPhaserGame.events.once)
        .mock.calls.find(([event]: any) => event === 'ready')?.[1];

      if (readyCallback) {
        await expect(readyCallback()).rejects.toThrow('TickManager not initialized');
      }
    });

    it('должен выбрасывать ошибку если симуляция не может стартовать', async () => {
      (core as any).enableSimulation = true;
      (EntrySimulation as any).mockImplementation(() => {
        throw new Error('Simulation start failed');
      });

      await expect(core.init()).rejects.toThrow(
        'Failed to start simulation: Simulation start failed',
      );
    });

    it('должен выбрасывать ошибку если все менеджеры не инициализированы для симуляции', async () => {
      (core as any).enableSimulation = true;
      (core as any).ecsManager = null;

      await expect(core.init()).rejects.toThrow(
        'All managers must be initialized before starting simulation',
      );
    });
  });

  describe('ecsRegistries getter', () => {
    it('должен возвращать null если ECSManager не инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).ecsManager = null;

      expect(core.ecsRegistries).toBeNull();
    });

    it('должен возвращать объект с функциями доступа к реестрам если ECSManager инициализирован', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).ecsManager = mockECSManager;

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
      (core as any).ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const componentRegistry = registries?.components();

      expect(componentRegistry).toBe(mockComponentRegistry);
      expect(ComponentRegistry.getInstance).toHaveBeenCalled();
    });

    it('systems() должен возвращать SystemRegistry', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const systemRegistry = registries?.systems();

      expect(systemRegistry).toBe(mockSystemRegistry);
      expect(SystemRegistry.getInstance).toHaveBeenCalled();
    });

    it('clusters() должен возвращать ClusterRegistry', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const clusterRegistry = registries?.clusters();

      expect(clusterRegistry).toBe(mockClusterRegistry);
      expect(ClusterRegistry.getInstance).toHaveBeenCalled();
    });

    it('entityFactories() должен возвращать EntityFactoryRegistry', () => {
      const core = new Core(mockPhaserConfig);
      (core as any).ecsManager = mockECSManager;

      const registries = core.ecsRegistries;
      const entityFactoryRegistry = registries?.entityFactories();

      expect(entityFactoryRegistry).toBe(mockEntityFactoryRegistry);
      expect(EntityFactoryRegistry.getInstance).toHaveBeenCalled();
    });
  });
});
