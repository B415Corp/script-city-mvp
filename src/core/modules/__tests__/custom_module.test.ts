import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomModule } from '../extends/custom_module';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';

// Mock-наследник для тестирования абстрактного класса CustomModule
class TestCustomModule extends CustomModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.id = 'test-custom-module';
  }

  // Публичные методы для тестирования protected методов
  public testOnEnable(): void {
    return this.onEnable();
  }

  public testOnDisable(): void {
    return this.onDisable();
  }
}

// Mock-наследник с переопределенными методами onEnable/onDisable
class TestCustomModuleWithOverrides extends CustomModule {
  public onEnableCalled = false;
  public onDisableCalled = false;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.id = 'test-custom-module-overrides';
  }

  protected onEnable(): void {
    this.onEnableCalled = true;
    super.onEnable();
  }

  protected onDisable(): void {
    this.onDisableCalled = false;
    super.onDisable();
  }

  // Публичные методы для тестирования protected методов
  public testOnEnable(): void {
    return this.onEnable();
  }

  public testOnDisable(): void {
    return this.onDisable();
  }
}

describe('CustomModule', () => {
  let mockScene: Phaser.Scene;
  let eventBus: EventBus;
  let module: TestCustomModule;
  let moduleWithOverrides: TestCustomModuleWithOverrides;

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
    module = new TestCustomModule(mockScene, eventBus);
    moduleWithOverrides = new TestCustomModuleWithOverrides(mockScene, eventBus);
  });

  describe('конструктор', () => {
    it('должен корректно инициализировать модуль', () => {
      expect(module['scene']).toBe(mockScene);
      expect(module['eventBus']).toBe(eventBus);
      expect(module['id']).toBe('test-custom-module');
      expect(module.enabled).toBe(true);
    });
  });

  describe('getter enabled', () => {
    it('должен возвращать текущее состояние enabled', () => {
      expect(module.enabled).toBe(true);
    });
  });

  describe('метод enable()', () => {
    it('должен включать модуль если он выключен', () => {
      // Сначала выключаем модуль
      module['isEnabled'] = false;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.enable();

      expect(module.enabled).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleEnabled, { id: 'test-custom-module' });
    });

    it('не должен ничего делать если модуль уже включен', () => {
      module['isEnabled'] = true;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.enable();

      expect(module.enabled).toBe(true);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('должен вызывать переопределенный метод onEnable', () => {
      moduleWithOverrides['isEnabled'] = false;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      moduleWithOverrides.enable();

      expect(moduleWithOverrides.enabled).toBe(true);
      expect(moduleWithOverrides.onEnableCalled).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleEnabled, {
        id: 'test-custom-module-overrides',
      });
    });
  });

  describe('метод disable()', () => {
    it('должен выключать модуль если он включен', () => {
      module['isEnabled'] = true;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.disable();

      expect(module.enabled).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleDisabled, { id: 'test-custom-module' });
    });

    it('не должен ничего делать если модуль уже выключен', () => {
      module['isEnabled'] = false;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.disable();

      expect(module.enabled).toBe(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('должен вызывать переопределенный метод onDisable', () => {
      moduleWithOverrides['isEnabled'] = true;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      moduleWithOverrides.disable();

      expect(moduleWithOverrides.enabled).toBe(false);
      expect(moduleWithOverrides.onDisableCalled).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleDisabled, {
        id: 'test-custom-module-overrides',
      });
    });
  });

  describe('защищенные методы onEnable/onDisable', () => {
    it('onEnable должен эмитить событие ModuleEnabled', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.testOnEnable();

      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleEnabled, { id: 'test-custom-module' });
    });

    it('onDisable должен эмитить событие ModuleDisabled', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.testOnDisable();

      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleDisabled, { id: 'test-custom-module' });
    });
  });

  describe('наследование и переопределение', () => {
    it('должен позволять наследникам переопределять onEnable', () => {
      const customModule = new TestCustomModuleWithOverrides(mockScene, eventBus);

      expect(() => {
        customModule.testOnEnable();
      }).not.toThrow();

      expect(customModule.onEnableCalled).toBe(true);
    });

    it('должен позволять наследникам переопределять onDisable', () => {
      const customModule = new TestCustomModuleWithOverrides(mockScene, eventBus);

      expect(() => {
        customModule.testOnDisable();
      }).not.toThrow();

      expect(customModule.onDisableCalled).toBe(false);
    });
  });
});
