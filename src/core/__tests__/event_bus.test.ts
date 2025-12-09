import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

// Тестируем pub/sub механику EventBus: вызов обработчиков, очистку и метрики событий за тик.
describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('calls subscribers for emit and supports once/off', () => {
    // Шаг 1: Подготавливаем обработчики и массив payloads.
    const payloads: Array<number | string> = [];
    const handler = (value?: number): void => {
      if (value !== undefined) {
        payloads.push(value);
      }
    };

    // Шаг 2: Подписка on + одноразовая once.
    eventBus.on<number>('custom', handler);
    eventBus.once<string>('custom', (value) => payloads.push(value ?? ''));

    // Шаг 3: Эмитим три раза, последний после off.
    eventBus.emit('custom', 1);
    eventBus.emit('custom', 2);
    eventBus.off('custom', handler);
    eventBus.emit('custom', 3);

    // Шаг 4: Проверяем, что once сработала один раз, on — два раза.
    expect(payloads).toEqual([1, 1, 2]);
  });

  it('clears subscriptions by type and globally', () => {
    // Шаг 1: Подписываемся на два события.
    const calls: string[] = [];
    eventBus.on('a', () => calls.push('a'));
    eventBus.on('b', () => calls.push('b'));

    // Шаг 2: Чистим только 'a' и эмитим оба.
    eventBus.clear('a');
    eventBus.emit('a');
    eventBus.emit('b');

    // Шаг 3: Проверяем, что сработало только 'b'.
    expect(calls).toEqual(['b']);

    // Шаг 4: Чистим все и эмитим ещё раз.
    eventBus.clear();
    eventBus.emit('b');
    expect(calls).toEqual(['b']);
  });

  it('tracks events per tick and average', () => {
    // Шаг 1: Эмитим события в один тик.
    eventBus.emit('custom');
    eventBus.emit('custom');
    eventBus.emit(Events.TickStarted);

    // Шаг 2: Проверяем счётчик за тик (учитывается TickStarted).
    expect(eventBus.getEventsPerTick()).toBe(3);

    // Шаг 3: Новый тик с двумя событиями.
    eventBus.emit('other');
    eventBus.emit(Events.TickStarted);

    // Шаг 4: Проверяем текущий и средний счётчики.
    expect(eventBus.getEventsPerTick()).toBe(2);
    // History should contain [3, 2] -> rounded average is 3
    expect(eventBus.getAverageEventsPerTick()).toBe(3);
  });
});
