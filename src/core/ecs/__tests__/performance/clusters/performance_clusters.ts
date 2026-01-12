import { createCluster } from '../../../core/smart_constructors';

/**
 * Кластер для реалистичной симуляции города
 * Включает системы обновления жителей и зданий
 */
export const PerformanceSimulationCluster = createCluster(
  'performance_simulation',
  [
    'performance_citizen_update',
    'performance_building_update'
  ],
  {
    enabled: true,
    description: 'Системы симуляции города для тестов производительности',
    interval: 100, // Каждые 100 тиков для реалистичной симуляции
  },
);

/**
 * Кластер для чистых бенчмарков
 * Только простые системы для измерения базовой производительности
 */
export const PerformanceBenchmarkCluster = createCluster(
  'performance_benchmark',
  [
    'simple_performance_update'
  ],
  {
    enabled: true,
    description: 'Простые системы для измерения базовой производительности ECS',
    interval: undefined, // Каждый тик
  },
);

/**
 * Кластер для экстремальных нагрузок
 * Системы для стресс-тестирования
 */
export const PerformanceStressTestCluster = createCluster(
  'performance_stress_test',
  [
    'bulk_performance_update'
  ],
  {
    enabled: true,
    description: 'Системы для стресс-тестирования ECS с максимальными нагрузками',
    interval: undefined, // Каждый тик для максимальной нагрузки
  },
);
