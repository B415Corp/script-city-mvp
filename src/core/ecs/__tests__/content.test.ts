import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { Events } from '../../event_bus/events';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { ComponentRegistry } from '../registry/component_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';

// Игровой контент — ровно то, что импортирует рантайм (src/core/ecs/content.ts)
import '../content';
import { MoneyComponent } from '../components/citizen_components';
import { createCitizen } from '../entities/citizen_factory';

/**
 * Интеграционные тесты игрового ECS-контента: проверяем, что заявленный в
 * AGENTS.md инвариант «фиксированный шаг логики» действительно работает —
 * системы, зарегистрированные при импорте, выполняются на тиках TickManager.
 */
describe('Игровой ECS-контент', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  it('должен регистрировать компоненты, систему и кластер при импорте контента', () => {
    expect(ComponentRegistry.getInstance().has('Money')).toBe(true);
    expect(ComponentRegistry.getInstance().has('Factory')).toBe(true);
    expect(SystemRegistry.getInstance().has('work_income')).toBe(true);
    expect(ClusterRegistry.getInstance().has('first_sim')).toBe(true);
    expect(EntityFactoryRegistry.getInstance().has('citizen_entity')).toBe(true);
  });

  it('getStats() должен показывать реальное количество сущностей', () => {
    const world = ecsManager.getWorld();
    createCitizen(world);

    const stats = ecsManager.getStats();

    expect(stats.totalEntities).toBe(1);
    expect(stats.entityCounts.Money).toBe(1);
  });

  it('должен выполнять систему work_income на тиках', () => {
    const world = ecsManager.getWorld();
    const citizenId = createCitizen(world);

    const moneyBefore = MoneyComponent.money[citizenId];

    // Кластер first_sim выполняется раз в 200ms реального времени.
    // При delta=16ms на тик это примерно 13 тиков.
    for (let tick = 0; tick < 20; tick++) {
      eventBus.emit(Events.LogicTick, { delta: 16 });
    }

    expect(MoneyComponent.money[citizenId]).toBeGreaterThan(moneyBefore);
  });

  it('не должен выполнять отключённые системы', () => {
    const system = SystemRegistry.getInstance().get('work_income')!;
    const world = ecsManager.getWorld();
    const citizenId = createCitizen(world);

    SystemRegistry.getInstance().register('disabled_system', system.system, {
      name: 'disabled_system',
      enabled: false,
      cluster: 'first_sim',
    });

    const moneyBefore = MoneyComponent.money[citizenId];
    for (let tick = 0; tick < 20; tick++) {
      eventBus.emit(Events.LogicTick, { delta: 16 });
    }
    // work_income выполнился (деньги выросли), disabled_system — нет:
    // иначе деньги выросли бы вдвое
    const growth = MoneyComponent.money[citizenId] - moneyBefore;
    expect(growth).toBeGreaterThan(0);
    expect(growth).toBeLessThanOrEqual(2);
  });
});
