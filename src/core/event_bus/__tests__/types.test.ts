import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../event_bus';
import { Events } from '../events';
import type {
  EventPayloadMap,
  EventCallback,
  Subscription,
  HandlerInfo,
  EventPayload,
  CallSystemPayload,
} from '../types';

describe('EventBus Types', () => {
  describe('EventPayloadMap - маппинг событий к payload типам', () => {
    it('должен правильно типизировать известные события', () => {
      const eventBus = new EventBus();

      // Проверяем типизацию для LogicTick
      const logicTickCallback = vi.fn((payload: { tick: number; deltaTime: number }) => {});
      eventBus.on(Events.LogicTick, logicTickCallback);

      // Проверяем типизацию для GameStarted (undefined payload)
      const gameStartedCallback = vi.fn((payload?: undefined) => {});
      eventBus.on(Events.GameStarted, gameStartedCallback);

      // Проверяем типизацию для CallSystem
      const callSystemCallback = vi.fn((payload: CallSystemPayload) => {
        expect(typeof payload.systemName).toBe('string');
      });
      eventBus.on(Events.CallSystem, callSystemCallback);

      // Имитируем вызовы для проверки типов
      eventBus.emit(Events.LogicTick, { tick: 1, deltaTime: 16 });
      eventBus.emit(Events.GameStarted);
      eventBus.emit(Events.CallSystem, { systemName: 'TestSystem' });

      expect(logicTickCallback).toHaveBeenCalledWith({ tick: 1, deltaTime: 16 });
      expect(gameStartedCallback).toHaveBeenCalledWith(undefined);
      expect(callSystemCallback).toHaveBeenCalledWith({ systemName: 'TestSystem' });
    });

    it('должен поддерживать legacy события с типами', () => {
      const eventBus = new EventBus();

      // Проверяем legacy time:tick событие
      const timeTickCallback = vi.fn((payload: { tick: number; time: number }) => {});
      eventBus.on('time:tick', timeTickCallback);

      // Проверяем legacy time:day событие
      const timeDayCallback = vi.fn((payload: { day: number }) => {});
      eventBus.on('time:day', timeDayCallback);

      // Проверяем citizen:hired событие
      const citizenCallback = vi.fn((payload: { entityId: number; workplaceId: number; salary: number }) => {});
      eventBus.on('citizen:hired', citizenCallback);

      // Имитируем вызовы
      eventBus.emit('time:tick', { tick: 1, time: 1000 });
      eventBus.emit('time:day', { day: 1 });
      eventBus.emit('citizen:hired', { entityId: 1, workplaceId: 2, salary: 100 });

      expect(timeTickCallback).toHaveBeenCalledWith({ tick: 1, time: 1000 });
      expect(timeDayCallback).toHaveBeenCalledWith({ day: 1 });
      expect(citizenCallback).toHaveBeenCalledWith({ entityId: 1, workplaceId: 2, salary: 100 });
    });
  });

  describe('EventCallback тип', () => {
    it('должен поддерживать generic типизацию', () => {
      const eventBus = new EventBus();

      // Callback без параметров
      const noParamCallback: EventCallback = vi.fn(() => {});
      eventBus.on('test1', noParamCallback);

      // Callback с типизированным параметром
      const typedCallback: EventCallback<{ data: string }> = vi.fn((payload) => {
        if (payload) {
          expect(typeof payload.data).toBe('string');
        }
      });
      eventBus.on('test2', typedCallback);

      // Callback с unknown типом
      const unknownCallback: EventCallback<unknown> = vi.fn((payload) => {
        expect(payload).toBeDefined();
      });
      eventBus.on('test3', unknownCallback);

      eventBus.emit('test1');
      eventBus.emit('test2', { data: 'test' });
      eventBus.emit('test3', { any: 'data' });

      expect(noParamCallback).toHaveBeenCalledWith(undefined);
      expect(typedCallback).toHaveBeenCalledWith({ data: 'test' });
      expect(unknownCallback).toHaveBeenCalledWith({ any: 'data' });
    });
  });

  describe('Subscription интерфейс', () => {
    it('должен иметь метод unsubscribe', () => {
      const eventBus = new EventBus();

      const callback = vi.fn();
      const subscription = eventBus.onLegacy('test:event', callback);

      // Проверяем интерфейс Subscription
      expect(typeof subscription.unsubscribe).toBe('function');
      expect(eventBus.getListenerCount('test:event')).toBe(1);

      // Вызываем unsubscribe
      subscription.unsubscribe();
      expect(eventBus.getListenerCount('test:event')).toBe(0);
    });
  });

  describe('HandlerInfo интерфейс', () => {
    it('должен содержать handler и once поля', () => {
      const eventBus = new EventBus();

      const callback = vi.fn();
      eventBus.on('test:event', callback);

      // Получаем доступ к приватному полю для тестирования
      const listeners = (eventBus as any).listeners.get('test:event');
      expect(listeners).toBeDefined();

      const handlerInfo = Array.from(listeners)[0] as HandlerInfo;
      expect(handlerInfo).toHaveProperty('handler');
      expect(handlerInfo).toHaveProperty('once');
      expect(typeof handlerInfo.handler).toBe('function');
      expect(typeof handlerInfo.once).toBe('boolean');
      expect(handlerInfo.once).toBe(false);
    });
  });

  describe('EventPayload тип', () => {
    it('должен корректно извлекать тип payload для события', () => {
      const eventBus = new EventBus();

      // Проверяем типизацию через функцию
      function testEventPayload<T extends Events>(event: T, payload: EventPayload<T>) {
        const callback = vi.fn((p: EventPayload<T>) => p);
        eventBus.on(event, callback);
        eventBus.emit(event, payload);
        return callback.mock.calls[0][0];
      }

      // Test LogicTick payload
      const logicPayload = testEventPayload(Events.LogicTick, { tick: 1, deltaTime: 16 });
      expect(logicPayload).toEqual({ tick: 1, deltaTime: 16 });

      // Test CallSystem payload
      const callPayload = testEventPayload(Events.CallSystem, { systemName: 'Test' });
      expect(callPayload).toEqual({ systemName: 'Test' });

      // Test undefined payload
      const gamePayload = testEventPayload(Events.GameStarted, undefined);
      expect(gamePayload).toBeUndefined();
    });
  });

  describe('CallSystemPayload интерфейс', () => {
    it('должен иметь обязательное поле systemName', () => {
      const eventBus = new EventBus();

      const callback = vi.fn((payload: CallSystemPayload) => {
        expect(payload.systemName).toBeDefined();
        expect(typeof payload.systemName).toBe('string');
      });

      eventBus.on(Events.CallSystem, callback);

      // Test с минимальными обязательными полями
      eventBus.emit(Events.CallSystem, { systemName: 'TestSystem' });

      // Test с дополнительными полями
      eventBus.emit(Events.CallSystem, {
        systemName: 'AnotherSystem',
        entityId: 123,
        extraData: { key: 'value' }
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Типобезопасность EventBus методов', () => {
    it('должен поддерживать правильную типизацию payload', () => {
      const eventBus = new EventBus();

      // Проверяем что правильные payload принимаются
      expect(() => {
        eventBus.emit(Events.LogicTick, { tick: 1, deltaTime: 16 });
        eventBus.emit(Events.GameStarted);
        eventBus.emit(Events.CallSystem, { systemName: 'Test' });
      }).not.toThrow();

      // Проверяем что неправильные типы отлавливаются компилятором
      // (этот тест проверяет что код компилируется с правильными типами)
      const typedCallback = vi.fn((payload: { tick: number; deltaTime: number }) => {
        expect(typeof payload.tick).toBe('number');
        expect(typeof payload.deltaTime).toBe('number');
      });

      eventBus.on(Events.LogicTick, typedCallback);
      eventBus.emit(Events.LogicTick, { tick: 1, deltaTime: 16 });

      expect(typedCallback).toHaveBeenCalledWith({ tick: 1, deltaTime: 16 });
    });

    it('должен поддерживать string события с unknown типами', () => {
      const eventBus = new EventBus();

      const callback = vi.fn((payload: unknown) => {
        // payload может быть любым типом
        expect(payload).toBeDefined();
      });

      eventBus.on('custom:event', callback);
      eventBus.emit('custom:event', { custom: 'data' });

      expect(callback).toHaveBeenCalledWith({ custom: 'data' });
    });
  });

  describe('Интеграция типов с реальными payload', () => {
    it('должен работать с реальными типами из других модулей', () => {
      const eventBus = new EventBus();

      // Имитируем использование типов из других модулей
      interface MockTilePayload {
        x: number;
        y: number;
      }

      const callback = vi.fn((payload: MockTilePayload) => {
        expect(typeof payload.x).toBe('number');
        expect(typeof payload.y).toBe('number');
      });

      // Используем как unknown событие для демонстрации
      eventBus.on('tile:custom', callback);
      eventBus.emit('tile:custom', { x: 10, y: 20 });

      expect(callback).toHaveBeenCalledWith({ x: 10, y: 20 });
    });
  });
});
