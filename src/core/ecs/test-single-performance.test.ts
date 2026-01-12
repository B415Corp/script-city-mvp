import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from './ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { EntityFactoryRegistry } from './registry/entity_factory_registry';
import { Events } from '../event_bus/events';

// Импорт компонентов производительности
import './__tests__/performance/components';
import './__tests__/performance/entities';
import './__tests__/performance/systems';
import './__tests__/performance/clusters';

describe('Single Performance Test', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Создаем реальные экземпляры зависимостей
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  /**
   * Вспомогательная функция для запуска игрового цикла (синхронная версия)
   */
  function runGameLoopSync(ticks: number, onTick?: (tick: number) => void): {
    totalTime: number;
    averageFPS: number;
    finalEntityCount: number;
  } {
    const startTime = performance.now();

    for (let tickCount = 0; tickCount < ticks; tickCount++) {
      // Имитируем LogicTick событие (как в реальной игре)
      eventBus.emit(Events.LogicTick, { delta: 16 }); // 16ms = ~60 FPS

      // Вызываем пользовательский callback
      if (onTick) {
        onTick(tickCount);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageFPS = (ticks * 1000) / totalTime;

    // Подсчет сущностей (простая оценка)
    const world = ecsManager.getWorld();
    const entityEstimate = Object.keys(world).length * 100; // Грубая оценка

    return {
      totalTime,
      averageFPS,
      finalEntityCount: entityEstimate
    };
  }

  /**
   * Вспомогательная функция для вывода статистики систем
   */
  function logSystemStats(testName: string) {
    const stats = ecsManager.getStats();
    console.log(`\n📊 ${testName} - Статистика систем:`);
    console.log(`   Систем всего: ${stats.totalSystemsCount}`);
    console.log(`   Кластеров: ${stats.clustersCount}`);
    console.log(`   Систем в кластерах: ${stats.intervalSystems.length} интервальных`);
    console.log(`   Event-систем: ${Object.keys(stats.eventSystems).length} типов`);

    Object.entries(stats.clusters).forEach(([name, cluster]) => {
      console.log(`   Кластер "${name}": ${cluster.systemsCount} систем, интервал: ${cluster.interval || 'каждый тик'}`);
    });

    return stats;
  }

  it('должен выдерживать непрерывную нагрузку с 100 сущностями в течение 200 тиков', () => {
    const stats = logSystemStats('Непрерывная нагрузка 100 сущностей');

    const world = ecsManager.getWorld();

    // Создаем начальную популяцию
    for (let i = 0; i < 100; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }

    console.log('🚀 Запуск непрерывного цикла на 200 тиков...');

    const result = runGameLoopSync(200, (tick) => {
      // Каждые 50 тиков добавляем немного сущностей
      if (tick % 50 === 0 && tick > 0) {
        for (let i = 0; i < 5; i++) {
          EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
        }
        console.log(`   Тик ${tick}: Добавлено 5 сущностей, всего ~${105 + Math.floor(tick / 50) * 5}`);
      }

      // Каждые 20 тиков отправляем событие
      if (tick % 20 === 0) {
        eventBus.emit('performance:test_event', { tick, data: 'test' });
      }
    });

    console.log(`✅ Завершено: ${result.totalTime.toFixed(2)}ms, средний FPS: ${result.averageFPS.toFixed(1)}`);

    expect(result.averageFPS).toBeGreaterThan(30); // Минимум 30 FPS
    expect(result.totalTime).toBeLessThan(10000); // Максимум 10 секунд
  });
});
