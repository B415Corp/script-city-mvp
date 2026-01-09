import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TickManager } from '../../../core/tick/tick_manager';
import { EventBus } from '../../../core/event_bus/event_bus';
import { Events } from '../../../core/event_bus/events';
import { LogicTickData } from '../../../core/tick/types';

describe('TickManager', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;

  beforeEach(() => {
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus, 10);
  });

  describe('initialization', () => {
    it('должен инициализировать with default tick rate', () => {
      const defaultManager = new TickManager(eventBus);
      expect(defaultManager.getTickRate()).toBe(10);
      expect(defaultManager.getFixedStepMs()).toBe(100);
    });

    it('должен инициализировать with custom tick rate', () => {
      expect(tickManager.getTickRate()).toBe(10);
      expect(tickManager.getFixedStepMs()).toBe(100);
    });

    it('должен запускаться без паузы', () => {
      expect(tickManager.isPaused()).toBe(false);
    });
  });

  describe('update', () => {
    it('должен отправлять событие TickStarted при обновлении', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.TickStarted, mockHandler);

      tickManager.update(1000, 16.67);

      expect(mockHandler).toHaveBeenCalledWith({
        time: 1000,
        delta: 16.67,
      });
    });

    it('должен отправлять события LogicTick для выполненных тиков', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.LogicTick, mockHandler);

      // 100ms delta = 1 tick
      tickManager.update(1000, 100);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      const logicTickData = mockHandler.mock.calls[0][0] as LogicTickData;
      expect(logicTickData.delta).toBe(100);
      expect(logicTickData.ticksExecuted).toBe(1);
    });

    it('должен отправлять множественные события LogicTick для множественных тиков', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.LogicTick, mockHandler);

      // 200ms delta = 2 ticks (due to maxAccumulatedMs limit)
      tickManager.update(1000, 200);

      expect(mockHandler).toHaveBeenCalledTimes(2);
      mockHandler.mock.calls.forEach((call, index) => {
        const data = call[0] as LogicTickData;
        expect(data.delta).toBe(100);
        expect(data.ticksExecuted).toBe(2);
      });
    });

    it('должен отправлять события GameTimeUpdated для каждого тика', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.GameTimeUpdated, mockHandler);

      tickManager.update(1000, 200); // 2 ticks

      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('не должен отправлять события при паузе', () => {
      const tickHandler = vi.fn();
      const logicHandler = vi.fn();
      const timeHandler = vi.fn();

      eventBus.on(Events.TickStarted, tickHandler);
      eventBus.on(Events.LogicTick, logicHandler);
      eventBus.on(Events.GameTimeUpdated, timeHandler);

      tickManager.pause();
      tickManager.update(1000, 200);

      expect(tickHandler).toHaveBeenCalledTimes(1); // TickStarted still emits
      expect(logicHandler).not.toHaveBeenCalled();
      expect(timeHandler).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('должен обрабатывать GamePauseToggle events', () => {
      expect(tickManager.isPaused()).toBe(false);

      eventBus.emit(Events.GamePauseToggle);
      expect(tickManager.isPaused()).toBe(true);

      eventBus.emit(Events.GamePauseToggle);
      expect(tickManager.isPaused()).toBe(false);
    });

    it('должен обрабатывать SetGameSpeed events', () => {
      eventBus.emit(Events.SetGameSpeed, { speed: 60 });
      expect(tickManager.getTickRate()).toBe(60);
      expect(tickManager.getFixedStepMs()).toBeCloseTo(16.67, 2);
    });
  });

  describe('pause control', () => {
    it('должен приостанавливаться и возобновляться', () => {
      expect(tickManager.isPaused()).toBe(false);

      tickManager.pause();
      expect(tickManager.isPaused()).toBe(true);

      tickManager.resume();
      expect(tickManager.isPaused()).toBe(false);
    });

    it('должен переключать паузу', () => {
      expect(tickManager.isPaused()).toBe(false);

      tickManager.togglePause();
      expect(tickManager.isPaused()).toBe(true);

      tickManager.togglePause();
      expect(tickManager.isPaused()).toBe(false);
    });
  });

  describe('controller access', () => {
    it('должен предоставлять доступ к контроллеру тиков', () => {
      const controller = tickManager.getTickController();
      expect(controller).toBeDefined();
      expect(typeof controller.getTickRate).toBe('function');
      expect(typeof controller.getFixedStepMs).toBe('function');
    });

    it('should provide access to time controller', () => {
      const controller = tickManager.getTimeController();
      expect(controller).toBeDefined();
      expect(typeof controller.getGameTime).toBe('function');
      expect(typeof controller.tick).toBe('function');
    });
  });

  describe('delegated getters', () => {
    it('should delegate fixed step getter', () => {
      expect(tickManager.getFixedStepMs()).toBe(100);
    });

    it('should delegate tick rate getter', () => {
      expect(tickManager.getTickRate()).toBe(10);
    });

    it('should delegate pause state getter', () => {
      expect(tickManager.isPaused()).toBe(false);

      tickManager.pause();
      expect(tickManager.isPaused()).toBe(true);
    });
  });

  describe('complex scenarios', () => {
    it('должен обрабатывать speed changes during updates', () => {
      const logicHandler = vi.fn();
      eventBus.on(Events.LogicTick, logicHandler);

      // Change speed to 60 ticks/second (fixed step ≈ 16.67ms) first
      eventBus.emit(Events.SetGameSpeed, { speed: 60 });

      // Update with 20ms - should trigger 1 tick (since fixed step ≈ 16.67ms)
      tickManager.update(0, 20);
      expect(logicHandler).toHaveBeenCalledTimes(1);
    });

    it('должен обрабатывать pause and resume during game', () => {
      const logicHandler = vi.fn();
      eventBus.on(Events.LogicTick, logicHandler);

      // Normal operation
      tickManager.update(0, 100);
      expect(logicHandler).toHaveBeenCalledTimes(1);

      // Pause
      eventBus.emit(Events.GamePauseToggle);
      tickManager.update(0, 100);
      expect(logicHandler).toHaveBeenCalledTimes(1); // No additional calls

      // Resume
      eventBus.emit(Events.GamePauseToggle);
      tickManager.update(0, 100);
      expect(logicHandler).toHaveBeenCalledTimes(2);
    });

    it('should accumulate time correctly across multiple updates', () => {
      const logicHandler = vi.fn();
      eventBus.on(Events.LogicTick, logicHandler);

      // Multiple small updates
      tickManager.update(0, 30);
      tickManager.update(0, 30);
      tickManager.update(0, 30);
      tickManager.update(0, 30);

      // Should have accumulated 120ms = 1 tick + 20ms remainder
      expect(logicHandler).toHaveBeenCalledTimes(1);

      // Another 80ms should trigger another tick
      tickManager.update(0, 80);
      expect(logicHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration with controllers', () => {
    it('должен обновлять time controller on each tick', () => {
      const timeController = tickManager.getTimeController();
      const initialTime = timeController.getGameTime();

      tickManager.update(0, 200); // 2 ticks

      expect(timeController.getGameTime()).toBe(initialTime + 2);
    });

    it('should maintain controller state consistency', () => {
      const tickController = tickManager.getTickController();
      const timeController = tickManager.getTimeController();

      // Change speed through TickManager
      tickManager.getTickController().setSpeed(20);

      expect(tickController.getTickRate()).toBe(20);
      expect(tickManager.getTickRate()).toBe(20);
      expect(tickManager.getFixedStepMs()).toBe(50);
    });
  });
});
