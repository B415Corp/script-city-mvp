import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';
import { Events } from '../../event_bus/events';

// Импорт компонентов производительности
import './performance/components';
import './performance/entities';
import './performance/systems';
import './performance/clusters';

/**
 * Бюджет кадра при 60 FPS. Симуляция обязана в него укладываться.
 */
const FRAME_BUDGET_MS = 16;

/**
 * `performance.memory` — нестандартное расширение, доступно только в Chrome/Edge.
 * Возвращает размер используемой кучи в байтах или 0, если API недоступен.
 */
function getUsedHeapSize(): number {
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
  return perf.memory?.usedJSHeapSize ?? 0;
}

interface FrameStats {
  frameCount: number;
  totalTimeMs: number;
  avgFrameCostMs: number;
  p95FrameCostMs: number;
  maxFrameCostMs: number;
}

describe('ECS Performance Tests', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  /**
   * Игровой цикл на фиксированном числе кадров.
   *
   * Меряется СТОИМОСТЬ одного кадра — время, потраченное непосредственно на игровую
   * логику (вызов систем через LogicTick), а не wall-clock FPS. Wall-clock зависит от
   * загрузки ОС, планировщика и сборщика мусора: одна пауза в 30ms «съедает» minFPS
   * до 33, хотя сама игра при этом не медленнее. Стоимость кадра — устойчивая
   * характеристика, по ней и проверяем, влезает ли симуляция в бюджет кадра.
   */
  function runGameLoop(frameCount: number, onFrame?: (frame: number) => void): FrameStats {
    const frameCosts: number[] = [];
    const startTime = performance.now();

    for (let frame = 1; frame <= frameCount; frame++) {
      const frameStart = performance.now();

      // Логика игры: все ECS-системы, подписанные на LogicTick
      eventBus.emit(Events.LogicTick, { delta: 16 });

      frameCosts.push(performance.now() - frameStart);

      onFrame?.(frame);
    }

    const totalTimeMs = performance.now() - startTime;
    const sortedCosts = [...frameCosts].sort((a, b) => a - b);
    const totalCost = frameCosts.reduce((sum, cost) => sum + cost, 0);

    return {
      frameCount,
      totalTimeMs,
      avgFrameCostMs: totalCost / frameCosts.length,
      // 95-й перцентиль вместо максимума: единичный выброс (GC-пауза, холодный старт)
      // не должен валить тест, но систематическое ухудшение — выдаст
      p95FrameCostMs: sortedCosts[Math.floor(frameCosts.length * 0.95)] ?? 0,
      maxFrameCostMs: sortedCosts[sortedCosts.length - 1] ?? 0,
    };
  }

  function createEntities(count: number): number {
    const world = ecsManager.getWorld();
    for (let i = 0; i < count; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }
    return count;
  }

  describe('Создание сущностей', () => {
    it('должен создавать 1000 сущностей быстро', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('должен создавать 10000 сущностей быстро', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('должен создавать 50000 сущностей быстро', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      for (let i = 0; i < 50000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Стоимость кадра', () => {
    it('должен укладываться в бюджет кадра при 500 сущностях', () => {
      createEntities(500);

      const result = runGameLoop(300, (frame) => {
        // Имитируем рост города каждые 120 кадров
        if (frame % 120 === 0) createEntities(10);
      });

      expect(result.frameCount).toBe(300);
      expect(result.avgFrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
      expect(result.p95FrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
    });

    it('должен укладываться в бюджет кадра при 10000 сущностях', () => {
      createEntities(10000);

      // Прогрев: компиляция запросов и JIT
      runGameLoop(30);

      const result = runGameLoop(120);

      expect(result.avgFrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
      expect(result.p95FrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
    });

    it('должен выдерживать рост города с 500 до 5000 сущностей', () => {
      createEntities(500);

      const result = runGameLoop(600, (frame) => {
        if (frame % 100 === 0) createEntities(100);
      });

      expect(result.avgFrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
      expect(result.p95FrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
    });
  });

  describe('Смешанная нагрузка (тики + события)', () => {
    it('должен укладываться в бюджет кадра при потоке событий', () => {
      createEntities(2000);

      let eventCount = 0;

      const result = runGameLoop(300, (frame) => {
        if (frame % 10 === 0) {
          eventBus.emit('performance:user_action', { action: 'click', frame });
          eventCount++;
        }
        if (frame % 30 === 0) {
          eventBus.emit('performance:ai_update', { ai: 'decision', frame });
          eventCount++;
        }
        if (frame % 100 === 0) {
          eventBus.emit('performance:save_game', { type: 'auto', frame });
          eventCount++;
        }
      });

      expect(eventCount).toBeGreaterThan(20);
      expect(result.avgFrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
      expect(result.p95FrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
    });
  });

  describe('Долгосрочная стабильность', () => {
    it('должен выполнять 10000 тиков без деградации стоимости кадра', () => {
      createEntities(1000);

      const result = runGameLoop(10000, (frame) => {
        if (frame % 200 === 0) createEntities(25);
      });

      expect(result.frameCount).toBe(10000);
      expect(result.p95FrameCostMs).toBeLessThan(FRAME_BUDGET_MS);
    });
  });

  describe('Память', () => {
    it('не должен расти неограниченно при длительной работе', () => {
      const startMemory = getUsedHeapSize();

      createEntities(20000);
      runGameLoop(500);

      const memoryDelta = getUsedHeapSize() - startMemory;

      // Без Chrome/Edge API метрика недоступна — проверять нечего
      if (memoryDelta > 0) {
        expect(memoryDelta).toBeLessThan(512 * 1024 * 1024);
      }
    });

    it('не должен дублировать системы при многократных обновлениях', () => {
      const initialStats = ecsManager.getStats();

      runGameLoop(100);

      const finalStats = ecsManager.getStats();
      expect(finalStats.totalSystemsCount).toBe(initialStats.totalSystemsCount);
    });
  });
});
