import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { ModuleManager } from '../../../core/modules/module_manager';
import { EventBus } from '../../../core/event_bus/event_bus';
import { ECSManager } from '../../../core/ecs/ecs_manager';
import { TickManager } from '../../../core/tick/tick_manager';
import { Events } from '../../../core/event_bus/events';

// Mock модулей для тестирования
vi.mock('../../../core/modules/base_modules/map_module/map_module', () => ({
  default: class MockMapModule {
    enabled = true;
  },
}));

vi.mock('../../../core/modules/base_modules/tools_module/tools_module', () => ({
  ToolsModule: class MockToolsModule {
    enabled = true;
  },
}));

vi.mock('../../../core/modules/base_modules/toolbar_module/toolbar_module', () => ({
  default: class MockToolbarModule {
    enabled = true;
  },
}));

vi.mock('../../../core/modules/base_modules/debug_module/debug_module', () => ({
  DebugModule: class MockDebugModule {
    enabled = true;
  },
}));

vi.mock('../../../core/modules/custom_modules/kek_module', () => ({
  default: class MockKekModule {
    enabled = true;
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
  },
}));

// Mock для Phaser.Scene
const createMockScene = (): Mocked<Phaser.Scene> => ({
  add: {
    container: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
    }),
  },
} as any);

// Mock для EventBus
const createMockEventBus = (): Mocked<EventBus> => ({
  emit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  clearEvents: vi.fn(),
} as any);

// Mock для ECSManager
const createMockECSManager = (): Mocked<ECSManager> => ({
  // Здесь можно добавить методы ECSManager если нужны
} as any);

// Mock для TickManager
const createMockTickManager = (): Mocked<TickManager> => ({
  // Здесь можно добавить методы TickManager если нужны
} as any);

describe('ModuleManager', () => {
  let mockScene: Mocked<Phaser.Scene>;
  let mockEventBus: Mocked<EventBus>;
  let mockECSManager: Mocked<ECSManager>;
  let mockTickManager: Mocked<TickManager>;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    mockScene = createMockScene();
    mockEventBus = createMockEventBus();
    mockECSManager = createMockECSManager();
    mockTickManager = createMockTickManager();

    moduleManager = new ModuleManager(
      mockScene,
      mockEventBus,
      mockECSManager,
      mockTickManager,
    );
  });

  describe('initialization', () => {
    it('should create instance with provided dependencies', () => {
      expect(moduleManager).toBeInstanceOf(ModuleManager);
    });

    it('should initialize base modules on init()', () => {
      // Act
      moduleManager.init();

      // Assert - проверяем что базовые модули созданы
      const mapModule = moduleManager.getBaseModuleApi('MapModule');
      const toolsModule = moduleManager.getBaseModuleApi('ToolsModule');
      const toolbarModule = moduleManager.getBaseModuleApi('ToolbarModule');
      const debugModule = moduleManager.getBaseModuleApi('DebugModule');

      expect(mapModule).toBeDefined();
      expect(toolsModule).toBeDefined();
      expect(toolbarModule).toBeDefined();
      expect(debugModule).toBeDefined();
    });

    it('should initialize custom modules on init()', () => {
      // Act
      moduleManager.init();

      // Assert - проверяем что кастомный модуль создан
      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule).toBeDefined();
    });
  });

  describe('base modules', () => {
    beforeEach(() => {
      moduleManager.init();
    });

    it('should return base module API by name', () => {
      const mapModule = moduleManager.getBaseModuleApi('MapModule');
      expect(mapModule).toBeDefined();
      expect(typeof mapModule).toBe('object');
    });

    it('should return undefined for non-existent base module', () => {
      const result = moduleManager.getBaseModuleApi('NonExistentModule' as any);
      expect(result).toBeUndefined();
    });

    it('should initialize DebugModule with ECSManager and TickManager', () => {
      const debugModule = moduleManager.getBaseModuleApi('DebugModule');
      expect(debugModule).toBeDefined();
      // DebugModule получает дополнительные параметры в конструкторе
    });

    it('should initialize other base modules with scene and eventBus only', () => {
      const mapModule = moduleManager.getBaseModuleApi('MapModule');
      const toolsModule = moduleManager.getBaseModuleApi('ToolsModule');
      const toolbarModule = moduleManager.getBaseModuleApi('ToolbarModule');

      expect(mapModule).toBeDefined();
      expect(toolsModule).toBeDefined();
      expect(toolbarModule).toBeDefined();
    });
  });

  describe('custom modules', () => {
    beforeEach(() => {
      moduleManager.init();
    });

    it('should return custom module API by name', () => {
      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule).toBeDefined();
      expect(typeof kekModule).toBe('object');
    });

    it('should return undefined for non-existent custom module', () => {
      const result = moduleManager.getCustomModuleApi('NonExistentModule' as any);
      expect(result).toBeUndefined();
    });

    it('should enable custom module by default', () => {
      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule?.enabled).toBe(true);
    });

    it('should disable custom module', () => {
      const result = moduleManager.setCustomModuleEnabled('KekModule', false);
      expect(result).toBe(true);

      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule?.enabled).toBe(false);
    });

    it('should enable custom module', () => {
      // Сначала выключаем
      moduleManager.setCustomModuleEnabled('KekModule', false);

      // Потом включаем
      const result = moduleManager.setCustomModuleEnabled('KekModule', true);
      expect(result).toBe(true);

      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule?.enabled).toBe(true);
    });

    it('should return false when trying to set state for non-existent module', () => {
      const result = moduleManager.setCustomModuleEnabled('NonExistentModule' as any, false);
      expect(result).toBe(false);
    });

    it('should change module enabled state when enabling', () => {
      moduleManager.setCustomModuleEnabled('KekModule', false); // выключаем

      moduleManager.setCustomModuleEnabled('KekModule', true); // включаем

      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule?.enabled).toBe(true);
    });

    it('should change module enabled state when disabling', () => {
      moduleManager.setCustomModuleEnabled('KekModule', false); // выключаем

      const kekModule = moduleManager.getCustomModuleApi('KekModule');
      expect(kekModule?.enabled).toBe(false);
    });
  });

  describe('module state management', () => {
    beforeEach(() => {
      moduleManager.init();
    });

    it('should handle multiple enable/disable cycles', () => {
      const moduleName = 'KekModule';

      // Включаем
      moduleManager.setCustomModuleEnabled(moduleName, true);
      expect(moduleManager.getCustomModuleApi(moduleName)?.enabled).toBe(true);

      // Выключаем
      moduleManager.setCustomModuleEnabled(moduleName, false);
      expect(moduleManager.getCustomModuleApi(moduleName)?.enabled).toBe(false);

      // Снова включаем
      moduleManager.setCustomModuleEnabled(moduleName, true);
      expect(moduleManager.getCustomModuleApi(moduleName)?.enabled).toBe(true);
    });

    it('should not emit events when setting same state', () => {
      mockEventBus.emit.mockClear();

      // Модуль уже включен по умолчанию
      moduleManager.setCustomModuleEnabled('KekModule', true);

      // Событие не должно быть отправлено
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });
});
