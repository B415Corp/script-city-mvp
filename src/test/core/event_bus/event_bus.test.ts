import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../../core/event_bus/event_bus';
import { Events } from '../../../core/event_bus/events';
import { CallSystemPayload, Subscription } from '../../../core/event_bus/types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('emit', () => {
    it('should emit event without payload', () => {
      const handler = vi.fn();
      eventBus.on(Events.GameStarted, handler);

      eventBus.emit(Events.GameStarted);

      expect(handler).toHaveBeenCalledWith(undefined);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit event with payload', () => {
      const handler = vi.fn();
      const payload: CallSystemPayload = {
        systemName: 'TestSystem',
        entityId: 123,
      };

      eventBus.on(Events.CallSystem, handler);
      eventBus.emit(Events.CallSystem, payload);

      expect(handler).toHaveBeenCalledWith(payload);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when no handlers are registered', () => {
      expect(() => {
        eventBus.emit(Events.GameStarted);
      }).not.toThrow();
    });

    it('should handle handler errors gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      eventBus.on(Events.GameStarted, errorHandler);
      eventBus.on(Events.GameStarted, goodHandler);

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.emit(Events.GameStarted);

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(goodHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Ошибка при публикации события "GameStarted":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('on', () => {
    it('should register event handler and return subscription', () => {
      const handler = vi.fn();
      const subscription = eventBus.on(Events.GameStarted, handler);

      expect(subscription).toHaveProperty('unsubscribe');
      expect(typeof subscription.unsubscribe).toBe('function');

      eventBus.emit(Events.GameStarted);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GameStarted, handler1);
      eventBus.on(Events.GameStarted, handler2);

      eventBus.emit(Events.GameStarted);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should allow handlers for different events', () => {
      const gameHandler = vi.fn();
      const tickHandler = vi.fn();

      eventBus.on(Events.GameStarted, gameHandler);
      eventBus.on(Events.LogicTick, tickHandler);

      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.LogicTick, { delta: 1.0, totalTime: 100 });

      expect(gameHandler).toHaveBeenCalledTimes(1);
      expect(tickHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('once', () => {
    it('should register handler that executes only once', () => {
      const handler = vi.fn();
      eventBus.once(Events.GameStarted, handler);

      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.GameStarted);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return subscription that can unsubscribe before execution', () => {
      const handler = vi.fn();
      const subscription = eventBus.once(Events.GameStarted, handler);

      subscription.unsubscribe();
      eventBus.emit(Events.GameStarted);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GameStarted, handler1);
      eventBus.on(Events.GameStarted, handler2);

      eventBus.off(Events.GameStarted, handler1);
      eventBus.emit(Events.GameStarted);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when removing non-existent handler', () => {
      const handler = vi.fn();
      expect(() => {
        eventBus.off(Events.GameStarted, handler);
      }).not.toThrow();
    });

    it('should not throw error when removing from non-existent event', () => {
      const handler = vi.fn();
      expect(() => {
        eventBus.off(Events.GameStarted, handler);
      }).not.toThrow();
    });
  });

  describe('subscription', () => {
    it('should allow unsubscribing via subscription object', () => {
      const handler = vi.fn();
      const subscription = eventBus.on(Events.GameStarted, handler);

      subscription.unsubscribe();
      eventBus.emit(Events.GameStarted);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple unsubscriptions gracefully', () => {
      const handler = vi.fn();
      const subscription = eventBus.on(Events.GameStarted, handler);

      subscription.unsubscribe();
      subscription.unsubscribe(); // Second unsubscribe should be safe

      eventBus.emit(Events.GameStarted);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('clearEvents', () => {
    it('should clear all handlers for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GameStarted, handler1);
      eventBus.on(Events.GameStarted, handler2);
      eventBus.on(Events.LogicTick, vi.fn()); // Different event

      eventBus.clearEvents(Events.GameStarted);
      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.LogicTick, { delta: 1.0, totalTime: 100 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should clear all events when no event type specified', () => {
      const gameHandler = vi.fn();
      const tickHandler = vi.fn();

      eventBus.on(Events.GameStarted, gameHandler);
      eventBus.on(Events.LogicTick, tickHandler);

      eventBus.clearEvents();

      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.LogicTick, { delta: 1.0, totalTime: 100 });

      expect(gameHandler).not.toHaveBeenCalled();
      expect(tickHandler).not.toHaveBeenCalled();
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed once and on handlers', () => {
      const onceHandler = vi.fn();
      const onHandler = vi.fn();

      eventBus.once(Events.GameStarted, onceHandler);
      eventBus.on(Events.GameStarted, onHandler);

      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.GameStarted);

      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(onHandler).toHaveBeenCalledTimes(2);
    });

    it('should maintain handler order', () => {
      const calls: string[] = [];
      const handler1 = vi.fn(() => calls.push('handler1'));
      const handler2 = vi.fn(() => calls.push('handler2'));
      const handler3 = vi.fn(() => calls.push('handler3'));

      eventBus.on(Events.GameStarted, handler1);
      eventBus.on(Events.GameStarted, handler2);
      eventBus.on(Events.GameStarted, handler3);

      eventBus.emit(Events.GameStarted);

      expect(calls).toEqual(['handler1', 'handler2', 'handler3']);
    });
  });
});
