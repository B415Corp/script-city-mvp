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

describe('Working Performance Test', () => {
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
   * Вспомогательная функция для запуска игрового цикла
   */
  function runGameLoop(ticks: number): {
    totalTime: number;
    averageFPS: number;
  } {
    const startTime = performance.now();

    for (let tickCount = 0; tickCount < ticks; tickCount++) {
      // Имитируем LogicTick событие (как в реальной игре)
      eventBus.emit(Events.LogicTick, { delta: 16 });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageFPS = (ticks * 1000) / totalTime;

    return { totalTime, averageFPS };
  }

  /**
   * Вспомогательная функция для вывода статистики систем
   */
  function logSystemStats(testName: string) {
    const stats = ecsManager.getStats();
    console.log(`\n📊 ${testName} - Статистика систем:`);
    console.log(`   Систем всего: ${stats.totalSystemsCount}`);
    console.log(`   Кластеров: ${stats.clustersCount}`);
    console.log(`   Интервальных систем: ${stats.intervalSystems.length}`);

    Object.entries(stats.clusters).forEach(([name, cluster]) => {
      console.log(`   Кластер "${name}": ${cluster.systemsCount} систем, интервал: ${cluster.interval || 'каждый тик'}`);
    });

    return stats;
  }

  it('должен показать статистику производительности', () => {
    const stats = logSystemStats('Базовая статистика');

    expect(stats.totalSystemsCount).toBeGreaterThan(0);
    expect(stats.clustersCount).toBeGreaterThan(0);
  });

  it('должен создать 1000 сущностей быстро', () => {
    const world = ecsManager.getWorld();
    const startTime = performance.now();

    // Создаем 1000 сущностей
    for (let i = 0; i < 1000; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`⚡ Создание 1000 сущностей: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(3)}ms на сущность)`);

    expect(duration).toBeLessThan(500);
  });

  it('должен выдерживать 1000 тиков непрерывной работы', () => {
    const world = ecsManager.getWorld();

    // Создаем начальную нагрузку
    for (let i = 0; i < 500; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }

    console.log('🚀 Запуск 1000 тиков непрерывной работы...');

    const result = runGameLoop(1000);

    console.log(`✅ 1000 тиков выполнено за ${result.totalTime.toFixed(2)}ms`);
    console.log(`   Средний FPS: ${result.averageFPS.toFixed(1)}`);
    console.log(`   Время на тик: ${(result.totalTime / 1000).toFixed(3)}ms`);

    expect(result.totalTime).toBeLessThan(2000); // Максимум 2 секунды
    expect(result.averageFPS).toBeGreaterThan(500); // Минимум 500 FPS
  });

  it('должен тестировать рост количества сущностей', () => {
    const world = ecsManager.getWorld();

    // Начальные 100 сущностей
    for (let i = 0; i < 100; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }

    console.log('📈 Тестирование роста: от 100 до 1000+ сущностей за 500 тиков...');

    let totalEntities = 100;
    const startTime = performance.now();

    for (let tick = 0; tick < 500; tick++) {
      // Имитируем LogicTick
      eventBus.emit(Events.LogicTick, { delta: 16 });

      // Каждые 50 тиков добавляем сущности
      if (tick % 50 === 0 && tick > 0) {
        const newEntities = Math.floor(Math.random() * 50) + 25; // 25-75 сущностей
        for (let i = 0; i < newEntities; i++) {
          EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
        }
        totalEntities += newEntities;

        if (tick % 100 === 0) {
          console.log(`   Тик ${tick}: Всего сущностей ~${totalEntities}`);
        }
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✅ Рост завершен: ${totalEntities} сущностей за ${duration.toFixed(2)}ms`);
    console.log(`   Средний FPS: ${(500 * 1000 / duration).toFixed(1)}`);

    expect(totalEntities).toBeGreaterThan(500);
    expect(duration).toBeLessThan(1500);
  });

  it('должен тестировать event-нагрузку', () => {
    const world = ecsManager.getWorld();

    // Создаем 200 сущностей
    for (let i = 0; i < 200; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }

    console.log('📡 Тестирование event-нагрузки: 200 тиков + события...');

    let eventCount = 0;
    const startTime = performance.now();

    for (let tick = 0; tick < 200; tick++) {
      // LogicTick
      eventBus.emit(Events.LogicTick, { delta: 16 });

      // Разные типы событий
      if (tick % 10 === 0) {
        eventBus.emit('performance:ui_click', { tick });
        eventCount++;
      }

      if (tick % 25 === 0) {
        eventBus.emit('performance:ai_decision', { tick });
        eventCount++;
      }

      if (tick % 50 === 0) {
        eventBus.emit('performance:save_data', { tick });
        eventCount++;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✅ Event-тест завершен: ${eventCount} событий за ${duration.toFixed(2)}ms`);
    console.log(`   Средний FPS: ${(200 * 1000 / duration).toFixed(1)}`);

    expect(eventCount).toBeGreaterThan(30);
    expect(duration).toBeLessThan(1000);
  });
});
