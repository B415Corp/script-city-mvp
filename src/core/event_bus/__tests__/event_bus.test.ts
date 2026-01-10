import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../event_bus';

describe('EventBus (Type-Safe)', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('Basic Event Handling', () => {
    it('should emit and receive events', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('time:tick', callback);

      eventBus.emit('time:tick', { tick: 1, time: 60 });

      expect(callback).toHaveBeenCalledWith({ tick: 1, time: 60 });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('time:tick', callback1);
      eventBus.on('time:tick', callback2);

      eventBus.emit('time:tick', { tick: 1, time: 60 });

      expect(callback1).toHaveBeenCalledWith({ tick: 1, time: 60 });
      expect(callback2).toHaveBeenCalledWith({ tick: 1, time: 60 });
    });

    it('should not call listeners for different events', () => {
      const tickCallback = vi.fn();
      const dayCallback = vi.fn();

      eventBus.on('time:tick', tickCallback);
      eventBus.on('time:day', dayCallback);

      eventBus.emit('time:tick', { tick: 1, time: 60 });

      expect(tickCallback).toHaveBeenCalledTimes(1);
      expect(dayCallback).toHaveBeenCalledTimes(0);
    });

    it('should handle events with undefined payloads', () => {
      const callback = vi.fn();
      eventBus.on('time:day', callback);

      eventBus.emit('time:day', { day: 1 });

      expect(callback).toHaveBeenCalledWith({ day: 1 });
    });
  });

  describe('Subscription Management', () => {
    it('should unsubscribe listeners', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('time:tick', callback);

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      eventBus.emit('time:tick', { tick: 2, time: 120 });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should support off method', () => {
      const callback = vi.fn();
      eventBus.on('time:tick', callback);

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      expect(callback).toHaveBeenCalledTimes(1);

      eventBus.off('time:tick', callback);

      eventBus.emit('time:tick', { tick: 2, time: 120 });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscriptions and unsubscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = eventBus.on('time:tick', callback1);
      eventBus.on('time:tick', callback2);

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsub1();

      eventBus.emit('time:tick', { tick: 2, time: 120 });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe('Once Events', () => {
    it('should trigger once listeners only once', () => {
      const callback = vi.fn();
      eventBus.once('time:day', callback);

      eventBus.emit('time:day', { day: 1 });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ day: 1 });

      eventBus.emit('time:day', { day: 2 });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should return unsubscribe function for once', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.once('time:day', callback);

      eventBus.emit('time:day', { day: 1 });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe(); // Should not do anything since it's already unsubscribed

      eventBus.emit('time:day', { day: 2 });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const goodCallback = vi.fn();
      const badCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      eventBus.on('time:tick', goodCallback);
      eventBus.on('time:tick', badCallback);

      // Should not throw
      expect(() => {
        eventBus.emit('time:tick', { tick: 1, time: 60 });
      }).not.toThrow();

      // Good callback should still work
      expect(goodCallback).toHaveBeenCalledTimes(1);
      expect(badCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle empty event emissions', () => {
      expect(() => {
        eventBus.emit('time:tick', { tick: 1, time: 60 });
      }).not.toThrow();
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy emit method', () => {
      const callback = vi.fn();
      eventBus.onLegacy('time:tick', callback);

      eventBus.emitLegacy('time:tick', { tick: 1, time: 60 });

      expect(callback).toHaveBeenCalledWith({ tick: 1, time: 60 });
    });

    it('should support legacy on method', () => {
      const callback = vi.fn();
      const subscription = eventBus.onLegacy('time:tick', callback);

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      expect(callback).toHaveBeenCalledTimes(1);

      subscription.unsubscribe();

      eventBus.emit('time:tick', { tick: 2, time: 120 });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility Methods', () => {
    it('should clear all listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('time:tick', callback1);
      eventBus.on('time:day', callback2);

      eventBus.clear();

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      eventBus.emit('time:day', { day: 1 });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should report listener count', () => {
      expect(eventBus.getListenerCount('time:tick')).toBe(0);

      eventBus.on('time:tick', vi.fn());
      expect(eventBus.getListenerCount('time:tick')).toBe(1);

      eventBus.on('time:tick', vi.fn());
      expect(eventBus.getListenerCount('time:tick')).toBe(2);

      eventBus.on('time:day', vi.fn());
      expect(eventBus.getListenerCount('time:day')).toBe(1);
      expect(eventBus.getListenerCount('time:tick')).toBe(2);
    });

    it('should clear specific events', () => {
      const tickCallback = vi.fn();
      const dayCallback = vi.fn();

      eventBus.on('time:tick', tickCallback);
      eventBus.on('time:day', dayCallback);

      eventBus.clearEvents('time:tick');

      eventBus.emit('time:tick', { tick: 1, time: 60 });
      eventBus.emit('time:day', { day: 1 });

      expect(tickCallback).not.toHaveBeenCalled();
      expect(dayCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct payload types at compile time', () => {
      // These should compile without errors
      eventBus.on('time:tick', (payload) => {
        expect(typeof payload.tick).toBe('number');
        expect(typeof payload.time).toBe('number');
      });

      eventBus.on('time:day', (payload) => {
        expect(typeof payload.day).toBe('number');
      });

      // Emit correct payloads
      eventBus.emit('time:tick', { tick: 1, time: 60 });
      eventBus.emit('time:day', { day: 1 });
    });

    it('should handle complex event payloads', () => {
      eventBus.on('citizen:hired', (payload) => {
        expect(typeof payload.entityId).toBe('number');
        expect(typeof payload.workplaceId).toBe('number');
        expect(typeof payload.salary).toBe('number');
      });

      eventBus.emit('citizen:hired', {
        entityId: 123,
        workplaceId: 456,
        salary: 50000,
      });
    });
  });
});
