import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../event_bus';
import { Events } from '../events';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('on() - подписка на события', () => {
    it('должен позволять подписаться на событие', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('test:event', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.getListenerCount('test:event')).toBe(1);
    });

    it('должен позволять подписаться на типизированное событие из Events', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on(Events.GameStarted, callback);

      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.getListenerCount(Events.GameStarted)).toBe(1);
    });

    it('должен позволять нескольким подписчикам подписаться на одно событие', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test:event', callback1);
      eventBus.on('test:event', callback2);

      expect(eventBus.getListenerCount('test:event')).toBe(2);
    });

    it('должен возвращать функцию отписки', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('test:event', callback);

      expect(eventBus.getListenerCount('test:event')).toBe(1);

      unsubscribe();

      expect(eventBus.getListenerCount('test:event')).toBe(0);
    });
  });

  describe('off() - отписка от событий', () => {
    it('должен отписывать конкретный колбэк от события', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test:event', callback1);
      eventBus.on('test:event', callback2);

      expect(eventBus.getListenerCount('test:event')).toBe(2);

      eventBus.off('test:event', callback1);

      expect(eventBus.getListenerCount('test:event')).toBe(1);
    });

    it('должен корректно работать с типизированными событиями', () => {
      const callback = vi.fn();

      eventBus.on(Events.GameStarted, callback);
      expect(eventBus.getListenerCount(Events.GameStarted)).toBe(1);

      eventBus.off(Events.GameStarted, callback);
      expect(eventBus.getListenerCount(Events.GameStarted)).toBe(0);
    });

    it('должен удалять событие из listeners если нет подписчиков', () => {
      const callback = vi.fn();

      eventBus.on('test:event', callback);
      expect(eventBus.getListenerCount('test:event')).toBe(1);

      eventBus.off('test:event', callback);
      expect(eventBus.getListenerCount('test:event')).toBe(0);
    });

    it('не должен падать при попытке отписать несуществующий колбэк', () => {
      const callback = vi.fn();

      expect(() => {
        eventBus.off('nonexistent:event', callback);
      }).not.toThrow();
    });
  });

  describe('emit() - отправка событий', () => {
    it('должен вызывать все колбэки для события', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test:event', callback1);
      eventBus.on('test:event', callback2);

      eventBus.emit('test:event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('должен корректно работать с типизированными событиями', () => {
      const callback = vi.fn();

      eventBus.on(Events.LogicTick, callback);

      const payload = { tick: 1, deltaTime: 16 };
      eventBus.emit(Events.LogicTick, payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('не должен падать если нет подписчиков на событие', () => {
      expect(() => {
        eventBus.emit('nonexistent:event', { data: 'test' });
      }).not.toThrow();
    });

    it('должен передавать undefined payload если он не указан', () => {
      const callback = vi.fn();

      eventBus.on('test:event', callback);
      eventBus.emit('test:event');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('должен изолировать ошибки в колбэках', () => {
      const goodCallback = vi.fn();
      const badCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('test:event', goodCallback);
      eventBus.on('test:event', badCallback);

      eventBus.emit('test:event', { data: 'test' });

      // Хороший колбэк должен быть вызван несмотря на ошибку в плохом
      expect(goodCallback).toHaveBeenCalledWith({ data: 'test' });
      expect(badCallback).toHaveBeenCalledWith({ data: 'test' });

      // Должна быть залогирована ошибка
      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventBus] Error in callback for "test:event":',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('once() - однократная подписка', () => {
    it('должен вызвать колбэк только один раз', () => {
      const callback = vi.fn();

      eventBus.once('test:event', callback);

      eventBus.emit('test:event', { data: 'first' });
      eventBus.emit('test:event', { data: 'second' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'first' });
    });

    it('должен автоматически отписывать колбэк после первого вызова', () => {
      const callback = vi.fn();

      eventBus.once('test:event', callback);
      expect(eventBus.getListenerCount('test:event')).toBe(1);

      eventBus.emit('test:event');
      expect(eventBus.getListenerCount('test:event')).toBe(0);
    });

    it('должен корректно работать с типизированными событиями', () => {
      const callback = vi.fn();

      eventBus.once(Events.GameStarted, callback);

      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.GameStarted); // Второй вызов не должен сработать

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('должен возвращать функцию отписки которая работает до первого вызова', () => {
      const callback = vi.fn();

      const unsubscribe = eventBus.once('test:event', callback);

      // Отписываемся до первого вызова
      unsubscribe();

      eventBus.emit('test:event');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clear() - очистка всех подписок', () => {
    it('должен удалять все подписки', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('event1', callback1);
      eventBus.on('event2', callback2);

      expect(eventBus.getListenerCount('event1')).toBe(1);
      expect(eventBus.getListenerCount('event2')).toBe(1);

      eventBus.clear();

      expect(eventBus.getListenerCount('event1')).toBe(0);
      expect(eventBus.getListenerCount('event2')).toBe(0);
    });
  });

  describe('getListenerCount() - подсчет подписчиков', () => {
    it('должен возвращать правильное количество подписчиков', () => {
      expect(eventBus.getListenerCount('test:event')).toBe(0);

      eventBus.on('test:event', vi.fn());
      expect(eventBus.getListenerCount('test:event')).toBe(1);

      eventBus.on('test:event', vi.fn());
      expect(eventBus.getListenerCount('test:event')).toBe(2);
    });

    it('должен возвращать 0 для событий без подписчиков', () => {
      expect(eventBus.getListenerCount('nonexistent:event')).toBe(0);
    });
  });

  describe('Legacy методы - обратная совместимость', () => {
    describe('emitLegacy()', () => {
      it('должен работать как обычный emit', () => {
        const callback = vi.fn();

        eventBus.on('legacy:event', callback);
        eventBus.emitLegacy('legacy:event', { legacy: true });

        expect(callback).toHaveBeenCalledWith({ legacy: true });
      });
    });

    describe('onLegacy()', () => {
      it('должен возвращать объект Subscription с методом unsubscribe', () => {
        const callback = vi.fn();

        const subscription = eventBus.onLegacy('legacy:event', callback);

        expect(typeof subscription.unsubscribe).toBe('function');
        expect(eventBus.getListenerCount('legacy:event')).toBe(1);

        subscription.unsubscribe();

        expect(eventBus.getListenerCount('legacy:event')).toBe(0);
      });
    });
  });

  describe('clearEvents() - очистка конкретных событий', () => {
    it('должен удалять все подписчики для конкретного события', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('event1', callback1);
      eventBus.on('event2', callback2);

      expect(eventBus.getListenerCount('event1')).toBe(1);
      expect(eventBus.getListenerCount('event2')).toBe(1);

      eventBus.clearEvents('event1');

      expect(eventBus.getListenerCount('event1')).toBe(0);
      expect(eventBus.getListenerCount('event2')).toBe(1);
    });

    it('должен работать как clear() если eventType не указан', () => {
      const callback = vi.fn();

      eventBus.on('event1', callback);
      eventBus.on('event2', callback);

      eventBus.clearEvents();

      expect(eventBus.getListenerCount('event1')).toBe(0);
      expect(eventBus.getListenerCount('event2')).toBe(0);
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должен корректно работать полный цикл подписка->отправка->отписка', () => {
      const callback = vi.fn();

      // Подписываемся
      const unsubscribe = eventBus.on('integration:event', callback);
      expect(eventBus.getListenerCount('integration:event')).toBe(1);

      // Отправляем событие
      eventBus.emit('integration:event', { step: 1 });
      expect(callback).toHaveBeenCalledWith({ step: 1 });

      // Отписываемся
      unsubscribe();
      expect(eventBus.getListenerCount('integration:event')).toBe(0);

      // Повторная отправка не должна вызвать колбэк
      callback.mockClear();
      eventBus.emit('integration:event', { step: 2 });
      expect(callback).not.toHaveBeenCalled();
    });

    it('должен поддерживать несколько независимых шин событий', () => {
      const eventBus1 = new EventBus();
      const eventBus2 = new EventBus();

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus1.on('shared:event', callback1);
      eventBus2.on('shared:event', callback2);

      eventBus1.emit('shared:event', { from: 'bus1' });
      eventBus2.emit('shared:event', { from: 'bus2' });

      expect(callback1).toHaveBeenCalledWith({ from: 'bus1' });
      expect(callback2).toHaveBeenCalledWith({ from: 'bus2' });
    });
  });
});
