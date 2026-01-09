import { describe, it, expect, beforeEach } from 'vitest';
import { TickController } from '../../../../core/tick/controllers/tick_controller';

describe('TickController', () => {
  let controller: TickController;

  beforeEach(() => {
    controller = new TickController(10);
  });

  describe('initialization', () => {
    it('должен инициализировать with default tick rate', () => {
      const defaultController = new TickController();
      expect(defaultController.getTickRate()).toBe(10);
      expect(defaultController.getFixedStepMs()).toBe(100);
    });

    it('должен инициализировать with custom tick rate', () => {
      expect(controller.getTickRate()).toBe(10);
      expect(controller.getFixedStepMs()).toBe(100);
    });

    it('должен запускаться без паузы', () => {
      expect(controller.isPaused()).toBe(false);
    });
  });

  describe('update', () => {
    it('должен возвращать 0 ticks when paused', () => {
      controller.pause();
      const ticks = controller.update(100);
      expect(ticks).toBe(0);
    });

    it('should accumulate time and return correct tick count', () => {
      // 100ms delta = 1 tick (fixed step = 100ms)
      const ticks1 = controller.update(100);
      expect(ticks1).toBe(1);

      // Another 50ms = 0.5 accumulated, not enough for another tick
      const ticks2 = controller.update(50);
      expect(ticks2).toBe(0);

      // Another 50ms = 100ms total accumulated = 1 tick
      const ticks3 = controller.update(50);
      expect(ticks3).toBe(1);
    });

    it('должен обрабатывать multiple ticks in single update', () => {
      // 200ms delta = 2 ticks
      const ticks = controller.update(200);
      expect(ticks).toBe(2);
    });

    it('должен обрабатывать fractional time accumulation', () => {
      // 250ms = 2 ticks + 50ms remainder
      controller.update(250);
      expect(controller.isPaused()).toBe(false); // Just to trigger accumulator processing

      // Another 50ms = 1 more tick
      const ticks = controller.update(50);
      expect(ticks).toBe(1);
    });

    it('should cap maximum accumulated time', () => {
      // Very large delta should be capped
      const ticks = controller.update(1000); // Much larger than maxAccumulatedMs (250)
      expect(ticks).toBe(2); // Should be 2 ticks (200ms) instead of 10
    });
  });

  describe('setSpeed', () => {
    it('should set tick rate and calculate fixed step', () => {
      controller.setSpeed(20);
      expect(controller.getTickRate()).toBe(20);
      expect(controller.getFixedStepMs()).toBe(50);
    });

    it('should set different speeds correctly', () => {
      controller.setSpeed(60); // 1 tick per second
      expect(controller.getTickRate()).toBe(60);
      expect(controller.getFixedStepMs()).toBeCloseTo(16.67, 2);

      controller.setSpeed(1); // 1 tick per minute
      expect(controller.getTickRate()).toBe(1);
      expect(controller.getFixedStepMs()).toBe(1000);
    });

    it('should pause when speed is invalid', () => {
      controller.setSpeed(0);
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(-5);
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(NaN);
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(Infinity);
      expect(controller.isPaused()).toBe(true);
    });

    it('should resume when setting valid speed after invalid', () => {
      controller.setSpeed(0); // Pause
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(10); // Resume
      expect(controller.isPaused()).toBe(false);
      expect(controller.getTickRate()).toBe(10);
    });
  });

  describe('pause control', () => {
    it('должен приостанавливаться и возобновляться', () => {
      expect(controller.isPaused()).toBe(false);

      controller.pause();
      expect(controller.isPaused()).toBe(true);

      controller.resume();
      expect(controller.isPaused()).toBe(false);
    });

    it('should toggle pause state', () => {
      expect(controller.isPaused()).toBe(false);

      controller.togglePause();
      expect(controller.isPaused()).toBe(true);

      controller.togglePause();
      expect(controller.isPaused()).toBe(false);
    });
  });

  describe('getters', () => {
    it('должен возвращать correct fixed step in milliseconds', () => {
      expect(controller.getFixedStepMs()).toBe(100);

      controller.setSpeed(20);
      expect(controller.getFixedStepMs()).toBe(50);
    });

    it('должен возвращать correct tick rate', () => {
      expect(controller.getTickRate()).toBe(10);

      controller.setSpeed(30);
      expect(controller.getTickRate()).toBe(30);
    });

    it('должен возвращать pause state', () => {
      expect(controller.isPaused()).toBe(false);

      controller.pause();
      expect(controller.isPaused()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать very small deltas', () => {
      const ticks = controller.update(0.1);
      expect(ticks).toBe(0);
    });

    it('должен обрабатывать zero delta', () => {
      const ticks = controller.update(0);
      expect(ticks).toBe(0);
    });

    it('должен обрабатывать negative delta', () => {
      const ticks = controller.update(-100);
      expect(ticks).toBe(0);
    });

    it('должен обрабатывать very fast updates', () => {
      // Multiple updates in quick succession
      let totalTicks = 0;
      for (let i = 0; i < 10; i++) {
        totalTicks += controller.update(10);
      }
      expect(totalTicks).toBe(1); // Only 1 tick should accumulate
    });
  });
});
