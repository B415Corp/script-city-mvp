import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleManager } from '../module_manager';
import { EventBus } from '../../event_bus/event_bus';
import { ECSManager } from '../../ecs/ecs_manager';
import { TickManager } from '../../tick/tick_manager';
import { BaseModule, CustomModule } from '../extends';

// Stub-классы для тестирования (не используют Phaser API)
class StubBaseModule extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.id = 'stub-base-module';
  }
}

class StubCustomModule extends CustomModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.id = 'stub-custom-module';
  }
}

class StubDebugModule extends BaseModule {
  constructor(
    scene: Phaser.Scene,
    eventBus: EventBus,
    ecsManager: ECSManager | null,
    tickManager: TickManager,
  ) {
    super(scene, eventBus, ecsManager!);
    this.id = 'stub-debug-module';
    // Сохраняем для проверки
    (this as any).tickManager = tickManager;
  }
}

// Mock-классы для тестирования (не используются из-за vi.mock)

describe('ModuleManager', () => {
  let mockScene: Phaser.Scene;
  let eventBus: EventBus;
  let ecsManager: ECSManager | null;
  let tickManager: TickManager;
  let moduleManager: ModuleManager;

  beforeEach(() => {
    // Мокаем Phaser.Scene
    mockScene = {
      add: vi.fn(),
      scene: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    } as unknown as Phaser.Scene;

    eventBus = new EventBus();
    ecsManager = null; // Для Phase 0
    tickManager = {
      start: vi.fn(),
      stop: vi.fn(),
      getCurrentTick: vi.fn().mockReturnValue(0),
    } as unknown as TickManager;

    moduleManager = new ModuleManager(mockScene, eventBus, ecsManager, tickManager);
  });

  describe('конструктор', () => {
    it('должен корректно инициализировать ModuleManager', () => {
      expect((moduleManager as any).scene).toBe(mockScene);
      expect((moduleManager as any).eventBus).toBe(eventBus);
      expect((moduleManager as any).ecsManager).toBe(ecsManager);
      expect((moduleManager as any).tickManager).toBe(tickManager);
      expect((moduleManager as any).baseModuleApi).toBeInstanceOf(Map);
      expect((moduleManager as any).customModuleApi).toBeInstanceOf(Map);
    });

    it('должен корректно инициализировать с ECSManager', () => {
      const mockECSManager = {} as ECSManager;
      const managerWithECS = new ModuleManager(mockScene, eventBus, mockECSManager, tickManager);

      expect((managerWithECS as any).ecsManager).toBe(mockECSManager);
    });
  });

  describe('получение API модулей', () => {
    beforeEach(() => {
      // Ручная настройка модулей для тестирования
      const ecsManager = {} as ECSManager; // Mock ECSManager
      const baseModule = new StubBaseModule(mockScene, eventBus, ecsManager);
      const customModule = new StubCustomModule(mockScene, eventBus);

      (moduleManager as any).baseModuleApi.set('MapModule', baseModule);
      (moduleManager as any).customModuleApi.set('KekModule', customModule);
    });

    describe('getBaseModuleApi()', () => {
      it('должен возвращать базовый модуль по имени', () => {
        const module = moduleManager.getBaseModuleApi('MapModule');
        expect(module).toBeInstanceOf(StubBaseModule);
        expect(module?.enabled).toBe(true);
      });

      it('должен возвращать undefined для несуществующего модуля', () => {
        const module = moduleManager.getBaseModuleApi('NonExistentModule' as any);
        expect(module).toBeUndefined();
      });
    });

    describe('getCustomModuleApi()', () => {
      it('должен возвращать кастомный модуль по имени', () => {
        const module = moduleManager.getCustomModuleApi('KekModule');
        expect(module).toBeInstanceOf(StubCustomModule);
        expect(module?.enabled).toBe(true);
      });

      it('должен возвращать undefined для несуществующего модуля', () => {
        const module = moduleManager.getCustomModuleApi('NonExistentModule' as any);
        expect(module).toBeUndefined();
      });
    });
  });

  describe('управление состоянием кастомных модулей', () => {
    let customModule: StubCustomModule;

    beforeEach(() => {
      customModule = new StubCustomModule(mockScene, eventBus);
      (moduleManager as any).customModuleApi.set('KekModule', customModule);
    });

    describe('setCustomModuleEnabled()', () => {
      it('должен включать модуль и возвращать true', () => {
        const enableSpy = vi.spyOn(customModule, 'enable');

        const result = moduleManager.setCustomModuleEnabled('KekModule', true);

        expect(result).toBe(true);
        expect(enableSpy).toHaveBeenCalled();
      });

      it('должен выключать модуль и возвращать true', () => {
        const disableSpy = vi.spyOn(customModule, 'disable');

        const result = moduleManager.setCustomModuleEnabled('KekModule', false);

        expect(result).toBe(true);
        expect(disableSpy).toHaveBeenCalled();
      });

      it('должен возвращать false для несуществующего модуля', () => {
        const result = moduleManager.setCustomModuleEnabled('NonExistentModule' as any, true);

        expect(result).toBe(false);
      });
    });
  });

  describe('проверка статуса модулей', () => {
    beforeEach(() => {
      const ecsManager = {} as ECSManager; // Mock ECSManager
      const enabledBaseModule = new StubBaseModule(mockScene, eventBus, ecsManager);
      const enabledCustomModule = new StubCustomModule(mockScene, eventBus);
      const disabledCustomModule = new StubCustomModule(mockScene, eventBus);

      // Выключаем один модуль для тестирования
      (disabledCustomModule as any).isEnabled = false;

      (moduleManager as any).baseModuleApi.set('EnabledBase', enabledBaseModule);
      (moduleManager as any).customModuleApi.set('EnabledCustom', enabledCustomModule);
      (moduleManager as any).customModuleApi.set('DisabledCustom', disabledCustomModule);
    });

    describe('isBaseModuleEnabled()', () => {
      it('должен возвращать true для включенного базового модуля', () => {
        const result = moduleManager.isBaseModuleEnabled('EnabledBase' as any);
        expect(result).toBe(true);
      });

      it('должен возвращать false для несуществующего базового модуля', () => {
        const result = moduleManager.isBaseModuleEnabled('NonExistentModule' as any);
        expect(result).toBe(false);
      });
    });

    describe('isCustomModuleEnabled()', () => {
      it('должен возвращать true для включенного кастомного модуля', () => {
        const result = moduleManager.isCustomModuleEnabled('EnabledCustom' as any);
        expect(result).toBe(true);
      });

      it('должен возвращать false для выключенного кастомного модуля', () => {
        const result = moduleManager.isCustomModuleEnabled('DisabledCustom' as any);
        expect(result).toBe(false);
      });

      it('должен возвращать false для несуществующего кастомного модуля', () => {
        const result = moduleManager.isCustomModuleEnabled('NonExistentModule' as any);
        expect(result).toBe(false);
      });
    });
  });
});
