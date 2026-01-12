import { query } from 'bitecs';
import { createSystem } from '../../../core/smart_constructors';
import {
  PerformanceCitizenComponent,
  PerformanceBuildingComponent,
  SimplePerformanceComponent,
} from '../components/performance_components';

/**
 * Система обновления жителей - симуляция повседневной активности
 */
export const PerformanceCitizenUpdateSystem = createSystem(
  'performance_citizen_update',
  ['PerformanceCitizen'],
  (world, entities, delta) => {
    let processed = 0;
    for (const entityId of entities) {
      // Имитация расходов/доходов
      if (PerformanceCitizenComponent.isWorking[entityId]) {
        PerformanceCitizenComponent.money[entityId] += Math.floor(10 * delta);
      } else {
        PerformanceCitizenComponent.money[entityId] -= Math.floor(2 * delta);
      }

      // Имитация изменения счастья
      const happinessChange = (Math.random() - 0.5) * 0.1;
      PerformanceCitizenComponent.happiness[entityId] = Math.max(
        0,
        Math.min(100, PerformanceCitizenComponent.happiness[entityId] + happinessChange),
      );

      // Имитация старения
      PerformanceCitizenComponent.age[entityId] += Math.floor(delta * 0.001);
      processed++;
    }
    return processed;
  },
  {
    cluster: 'performance_simulation',
    enabled: true,
  },
);

/**
 * Система обновления зданий
 */
export const PerformanceBuildingUpdateSystem = createSystem(
  'performance_building_update',
  ['PerformanceBuilding'],
  (world, entities, delta) => {
    let processed = 0;
    for (const entityId of entities) {
      if (PerformanceBuildingComponent.isActive[entityId]) {
        // Имитация дохода здания
        PerformanceBuildingComponent.income[entityId] += Math.floor(delta);

        // Имитация расходов на обслуживание
        PerformanceBuildingComponent.maintenanceCost[entityId] += Math.floor(delta * 0.1);
        processed++;
      }
    }
    return processed;
  },
  {
    cluster: 'performance_simulation',
    enabled: true,
  },
);

/**
 * Простая система для максимальной производительности
 * Минимальные вычисления для измерения overhead ECS
 */
export const SimplePerformanceSystem = createSystem(
  'simple_performance_update',
  ['SimplePerformance'],
  (world, entities, delta) => {
    let processed = 0;
    for (const entityId of entities) {
      if (SimplePerformanceComponent.active[entityId]) {
        // Минимальные вычисления
        SimplePerformanceComponent.value[entityId] += 1;
        processed++;
      }
    }
    return processed;
  },
  {
    cluster: 'performance_benchmark',
    enabled: true,
  },
);

/**
 * Система массового обновления для стресс-тестирования
 */
export const BulkPerformanceSystem = createSystem(
  'bulk_performance_update',
  ['SimplePerformance'],
  (world, entities, delta) => {
    let processed = 0;

    // Быстрое обновление всех сущностей
    for (const entityId of entities) {
      if (SimplePerformanceComponent.active[entityId]) {
        SimplePerformanceComponent.value[entityId] =
          (SimplePerformanceComponent.value[entityId] + 1) % 1000;
        processed++;
      }
    }

    // Возвращаем количество обработанных сущностей для статистики
    return processed;
  },
  {
    cluster: 'performance_stress_test',
    enabled: true,
  },
);
