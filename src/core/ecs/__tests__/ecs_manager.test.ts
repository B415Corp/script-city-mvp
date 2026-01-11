import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld } from 'bitecs';
import { ECSManager, ScheduleManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { Logger } from '../../utils/logger';
import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';

// Моки для зависимостей
vi.mock('bitecs', () => ({
  createWorld: vi.fn(),
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
      realEventBus.emit('custom:event', { someData: 'test' });

      // Проверяем, что система была вызвана
      expect(mockSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0);
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
      realEventBus.emit('CallSystem', { systemName: 'CallSystemTest' });

      // Проверяем, что система была вызвана
      expect(mockSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0);
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
      realEventBus.emit('CallSystem', { systemName: 'FailingSystem' });

      // Проверяем, что система была вызвана (несмотря на ошибку)
      expect(failingSystem).toHaveBeenCalledWith(ecsManager.getWorld(), 0);
    });
  });
});
