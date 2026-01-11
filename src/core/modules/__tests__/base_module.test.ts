import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseModule } from '../extends/base_module';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';

// Mock-наследник для тестирования абстрактного класса BaseModule
class TestBaseModule extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.id = 'test-base-module';
  }
}

describe('BaseModule', () => {
  let mockScene: Phaser.Scene;
  let eventBus: EventBus;
  let module: TestBaseModule;

  beforeEach(() => {
    // Мокаем Phaser.Scene
    mockScene = {
      add: vi.fn(),
      scene: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    } as any;

    eventBus = new EventBus();
    module = new TestBaseModule(mockScene, eventBus);
  });

  describe('конструктор', () => {
    it('должен корректно инициализировать модуль', () => {
      expect(module['scene']).toBe(mockScene);
      expect(module['eventBus']).toBe(eventBus);
      expect(module['id']).toBe('test-base-module');
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
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleEnabled, { id: 'test-base-module' });
    });

    it('не должен ничего делать если модуль уже включен', () => {
      module['isEnabled'] = true;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.enable();

      expect(module.enabled).toBe(true);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('метод disable()', () => {
    it('должен выключать модуль если он включен', () => {
      module['isEnabled'] = true;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.disable();

      expect(module.enabled).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleDisabled, { id: 'test-base-module' });
    });

    it('не должен ничего делать если модуль уже выключен', () => {
      module['isEnabled'] = false;

      const emitSpy = vi.spyOn(eventBus, 'emit');

      module.disable();

      expect(module.enabled).toBe(false);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('внутренние методы onEnable/onDisable', () => {
    it('onEnable должен эмитить событие ModuleEnabled', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Вызываем приватный метод через приведение типов
      (module as any).onEnable();

      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleEnabled, { id: 'test-base-module' });
    });

    it('onDisable должен эмитить событие ModuleDisabled', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Вызываем приватный метод через приведение типов
      (module as any).onDisable();

      expect(emitSpy).toHaveBeenCalledWith(Events.ModuleDisabled, { id: 'test-base-module' });
    });
  });
});
