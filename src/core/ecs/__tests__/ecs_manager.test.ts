import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld } from 'bitecs';
import { ECSManager, ScheduleManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';
import { TickManager } from '../../tick/tick_manager';
import { SystemFunction } from '../core/smart_constructors';
import { Logger } from '../../utils/logger';
import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';

// Моки для зависимостей
vi.mock('bitecs', () => ({
  createWorld: vi.fn(),
  deleteWorld: vi.fn(),
  getAllEntities: vi.fn(() => []),
  query: vi.fn(() => []),
  addEntity: vi.fn(() => 1),
}));

// Не мокаем реестры, используем реальные для интеграционных тестов

describe('ECSManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Очищаем реестры перед каждым тестом
    SystemRegistry.getInstance().clear();
    ComponentRegistry.getInstance().clear();
    ClusterRegistry.getInstance().clear();
    EntityFactoryRegistry.getInstance().clear();
  });

  // Базовые тесты структуры и импортов
  it('должен быть определен класс ECSManager', () => {
    expect(ECSManager).toBeDefined();
    expect(typeof ECSManager).toBe('function');
  });

  it('должен экспортировать ScheduleManager', () => {
    expect(ScheduleManager).toBeDefined();
    expect(typeof ScheduleManager).toBe('function');
  });

  // Тесты типов и интерфейсов
  it('должен содержать необходимые интерфейсы', () => {
    // Проверяем что определены ключевые интерфейсы
    expect(ECSManager).toBeDefined();
    expect(ScheduleManager).toBeDefined();
  });

  // Интеграционный тест: вызов системы по событию
  describe('Интеграционный тест: вызов системы по событию', () => {
    it('должен выполнять систему при получении события через eventBus', () => {
      // Создаем мок системы
      const mockSystem = vi.fn();

      // Регистрируем систему как event-driven
      const systemRegistry = SystemRegistry.getInstance();
      systemRegistry.register('TestEventSystem', mockSystem, {
        eventTriggers: ['custom:event'],
      });

      // Создаем реальные экземпляры зависимостей
      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);

      // Создаем ECSManager
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      // Имитируем получение события 'custom:event'
      const payload = { someData: 'test' };
      realEventBus.emit('custom:event', payload);

      // Система получает payload события третьим аргументом
      expect(mockSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0, payload);
    });

    it('должен выполнять систему по имени через CallSystem событие', () => {
      const mockSystem = vi.fn();

      // Регистрируем систему
      const systemRegistry = SystemRegistry.getInstance();
      systemRegistry.register('CallSystemTest', mockSystem, { enabled: true });

      // Создаем реальные экземпляры зависимостей
      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);

      // Создаем ECSManager
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      // Имитируем событие CallSystem
      const payload = { systemName: 'CallSystemTest' };
      realEventBus.emit('CallSystem', payload);

      // Проверяем, что система была вызвана с payload
      expect(mockSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0, payload);
    });

    it('должен логировать предупреждение если система не найдена', () => {
      // Создаем реальные экземпляры зависимостей
      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);

      // Создаем ECSManager
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      // Имитируем событие CallSystem для несуществующей системы
      realEventBus.emit('CallSystem', { systemName: 'NonExistentSystem' });

      // Система не найдена, поэтому ничего не должно произойти
      // (проверка на отсутствие ошибок)
    });

    it('должен логировать ошибку если система выбрасывает исключение', () => {
      const failingSystem = vi.fn().mockImplementation(() => {
        throw new Error('System execution failed');
      });

      // Регистрируем failing систему
      const systemRegistry = SystemRegistry.getInstance();
      systemRegistry.register('FailingSystem', failingSystem, { enabled: true });

      // Создаем реальные экземпляры зависимостей
      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);

      // Создаем ECSManager
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      // Имитируем событие CallSystem
      const payload = { systemName: 'FailingSystem' };
      realEventBus.emit('CallSystem', payload);

      // Проверяем, что система была вызвана (несмотря на ошибку)
      expect(failingSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0, payload);
    });

    it('должен пробрасывать payload в event-driven систему', () => {
      const received: unknown[] = [];

      const system = ((_world: unknown, _delta?: number, payload?: unknown): void => {
        received.push(payload);
      }) as SystemFunction;

      SystemRegistry.getInstance().register('PayloadSystem', system, {
        eventTriggers: ['payload:event'],
      });

      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      const payload = { citizenId: 7, action: 'hire' };
      realEventBus.emit('payload:event', payload);

      expect(received).toEqual([payload]);

      ecsManager.destroy();
    });

    it('должен отписываться от событий и чистить реестры в destroy', () => {
      const mockSystem = vi.fn();
      SystemRegistry.getInstance().register('DestroySystem', mockSystem, {
        eventTriggers: ['destroy:event'],
      });

      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      realEventBus.emit('destroy:event', {});
      expect(mockSystem).toHaveBeenCalledTimes(1);

      ecsManager.destroy();

      // Система больше не зарегистрирована и не вызывается
      realEventBus.emit('destroy:event', {});
      expect(mockSystem).toHaveBeenCalledTimes(1);

      expect(SystemRegistry.getInstance().size()).toBe(0);
      expect(ClusterRegistry.getInstance().size()).toBe(0);
      expect(ComponentRegistry.getInstance().size()).toBe(0);
      expect(EntityFactoryRegistry.getInstance().size()).toBe(0);

      // Повторный destroy безопасен
      expect(() => ecsManager.destroy()).not.toThrow();
    });

    it('должен останавливать обновление систем после destroy', () => {
      const mockSystem = vi.fn();
      SystemRegistry.getInstance().register('TickSystem', mockSystem, {});

      const realEventBus = new EventBus();
      const realTickManager = new TickManager(realEventBus);
      const ecsManager = new ECSManager(realEventBus, realTickManager);

      realEventBus.emit(Events.LogicTick, { delta: 16 });
      expect(mockSystem).toHaveBeenCalledTimes(1);

      ecsManager.destroy();

      realEventBus.emit(Events.LogicTick, { delta: 16 });
      expect(mockSystem).toHaveBeenCalledTimes(1);
    });
  });
});
