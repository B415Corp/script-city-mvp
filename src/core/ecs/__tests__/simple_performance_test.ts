import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';

describe('Simple Performance Test', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Очищаем реестры перед каждым тестом
    ComponentRegistry.getInstance().clear();
    SystemRegistry.getInstance().clear();
    ClusterRegistry.getInstance().clear();
    EntityFactoryRegistry.getInstance().clear();

    // Создаем реальные экземпляры зависимостей
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  it('должен зарегистрировать компоненты производительности', () => {
    const registry = ComponentRegistry.getInstance();

    expect(registry.has('PerformanceCitizen')).toBe(true);
    expect(registry.has('PerformanceBuilding')).toBe(true);
    expect(registry.has('PerformanceVehicle')).toBe(true);
    expect(registry.has('SimplePerformance')).toBe(true);
  });

  it('должен зарегистрировать фабрики производительности', () => {
    const registry = EntityFactoryRegistry.getInstance();

    expect(registry.has('performance_citizen')).toBe(true);
    expect(registry.has('performance_building')).toBe(true);
    expect(registry.has('performance_vehicle')).toBe(true);
    expect(registry.has('simple_performance_entity')).toBe(true);
  });

  it('должен создать одну простую сущность', () => {
    const world = ecsManager.getWorld();
    const startTime = performance.now();

    const entityId = EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Создание 1 сущности заняло ${duration.toFixed(2)}ms`);

    expect(entityId).toBeDefined();
    expect(typeof entityId).toBe('number');
    expect(duration).toBeLessThan(10);
  });
});
