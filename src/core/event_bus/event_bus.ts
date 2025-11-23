import { EventHandler, HandlerInfo, Subscription } from './types';

/**
 * Событийная шина для межмодульной коммуникации без жёстких связей.
 *
 * Реализует паттерн Publisher-Subscriber, позволяя модулям публиковать события
 * и подписываться на них без прямых зависимостей друг от друга.
 *
 * Основные возможности:
 * - Публикация типизированных событий с данными
 * - Подписка на события (множественная)
 * - Одноразовые подписки (автоматически удаляются после вызова)
 * - Отмена подписок
 * - Очистка подписок (для конкретного события или всех)
 *
 * @example
 * const eventBus = new EventBus();
 *
 * // Подписка на событие
 * const sub = eventBus.on<{ id: string }>('BuildingCompleted', (data) => {
 *   console.log('Building:', data?.id);
 * });
 *
 * // Публикация события
 * eventBus.emit('BuildingCompleted', { id: '123' });
 *
 * // Отписка
 * sub.unsubscribe();
 */
export class EventBus {
  /**
   * Хранилище обработчиков событий.
   * Ключ - тип события (строка), значение - множество обработчиков для этого события.
   */
  private handlers: Map<string, Set<HandlerInfo>> = new Map();

  /**
   * Создаёт новый экземпляр EventBus.
   */
  constructor() {
    console.warn('🚌 EventBus initialized');
  }

  /**
   * Публикует событие указанного типа с опциональными данными.
   *
   * Вызывает все зарегистрированные обработчики для данного типа события.
   * Одноразовые подписки (созданные через `once`) автоматически удаляются после вызова.
   *
   * Ошибки в обработчиках не прерывают выполнение других обработчиков -
   * они логируются в консоль, но не влияют на остальные подписки.
   *
   * @param eventType - Тип события (например, 'ConstructionCompleted', 'TickStarted')
   * @param payload - Опциональные данные события (типизированы через дженерик T)
   *
   * @example
   * eventBus.emit('ConstructionCompleted', { buildingId: '123', type: 'residential' });
   * eventBus.emit('TickStarted'); // событие без данных
   */
  emit<T = unknown>(eventType: string, payload?: T): void {
    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    // Создаём копию множества, чтобы можно было удалять обработчики во время итерации
    const handlersToCall = Array.from(eventHandlers);

    handlersToCall.forEach((handlerInfo) => {
      try {
        handlerInfo.handler(payload);
      } catch (error) {
        console.error(`Error in event handler for "${eventType}":`, error);
      }

      // Удаляем одноразовые подписки после вызова
      if (handlerInfo.once) {
        eventHandlers.delete(handlerInfo);
        // Если больше нет обработчиков для этого события, удаляем запись
        if (eventHandlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    });
  }

  /**
   * Подписывается на событие указанного типа.
   *
   * Обработчик будет вызываться каждый раз, когда публикуется событие данного типа.
   * Подписка остаётся активной до тех пор, пока не будет отменена через `unsubscribe()`
   * или `off()`.
   *
   * Возвращает объект подписки с методом `unsubscribe()` для удобной отмены подписки.
   *
   * @param eventType - Тип события, на которое подписываемся
   * @param handler - Функция-обработчик, которая будет вызвана при публикации события
   * @returns Объект подписки с методом `unsubscribe()` для отмены подписки
   *
   * @example
   * const subscription = eventBus.on<{ id: string }>('BuildingCompleted', (data) => {
   *   console.log('Building completed:', data?.id);
   * });
   *
   * // Позже можно отписаться
   * subscription.unsubscribe();
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): Subscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: false,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    return {
      unsubscribe: (): void => {
        this.off(eventType, handler);
      },
    };
  }

  /**
   * Подписывается на событие указанного типа один раз.
   *
   * Обработчик будет вызван только при первой публикации события данного типа,
   * после чего подписка автоматически удаляется.
   *
   * Полезно для одноразовых действий, например, инициализации при старте игры,
   * обработки первого вхождения в состояние и т.д.
   *
   * Возвращает объект подписки, который можно использовать для ручной отмены
   * до того, как событие будет опубликовано.
   *
   * @param eventType - Тип события, на которое подписываемся
   * @param handler - Функция-обработчик, которая будет вызвана один раз
   * @returns Объект подписки с методом `unsubscribe()` для отмены подписки
   *
   * @example
   * eventBus.once('GameStarted', () => {
   *   console.log('Игра запущена!');
   *   // Этот обработчик будет вызван только один раз
   * });
   */
  once<T = unknown>(eventType: string, handler: EventHandler<T>): Subscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: true,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    return {
      unsubscribe: (): void => {
        this.off(eventType, handler);
      },
    };
  }

  /**
   * Отменяет подписку на событие для указанного обработчика.
   *
   * Удаляет конкретный обработчик из списка подписок для данного типа события.
   * Если после удаления не остаётся обработчиков для этого события,
   * запись о событии также удаляется из хранилища.
   *
   * Для отмены подписки можно также использовать метод `unsubscribe()` объекта,
   * возвращаемого методами `on()` и `once()`.
   *
   * @param eventType - Тип события, от которого отписываемся
   * @param handler - Функция-обработчик, которую нужно удалить из подписок
   *
   * @example
   * const handler = (data) => console.log(data);
   * eventBus.on('SomeEvent', handler);
   *
   * // Позже отписываемся
   * eventBus.off('SomeEvent', handler);
   */
  off(eventType: string, handler: Function): void {
    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers) {
      return;
    }

    // Находим и удаляем обработчик
    for (const handlerInfo of eventHandlers) {
      if (handlerInfo.handler === handler) {
        eventHandlers.delete(handlerInfo);
        break;
      }
    }

    // Если больше нет обработчиков для этого события, удаляем запись
    if (eventHandlers.size === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Очищает подписки на события.
   *
   * Если указан `eventType`, удаляет все подписки только для этого типа события.
   * Если `eventType` не указан, удаляет все подписки для всех типов событий.
   *
   * Полезно для очистки состояния при перезапуске игры, смене сцены,
   * или полной очистке EventBus перед уничтожением.
   *
   * @param eventType - Опциональный тип события для очистки. Если не указан, очищаются все подписки
   *
   * @example
   * // Очистить все подписки на конкретное событие
   * eventBus.clear('SomeEvent');
   *
   * // Очистить все подписки на все события
   * eventBus.clear();
   */
  clear(eventType?: string): void {
    if (eventType) {
      // Очистка подписок для конкретного типа события
      this.handlers.delete(eventType);
    } else {
      // Очистка всех подписок
      this.handlers.clear();
    }
  }

  /**
   * Получение списка всех активных подписок (для отладки).
   *
   * @returns объект с типами событий и количеством подписок
   */
  getSubscriptions(): Record<string, { count: number; once: number }> {
    const result: Record<string, { count: number; once: number }> = {};

    for (const [eventType, handlers] of this.handlers.entries()) {
      let onceCount = 0;
      for (const handlerInfo of handlers) {
        if (handlerInfo.once) {
          onceCount++;
        }
      }
      result[eventType] = {
        count: handlers.size,
        once: onceCount,
      };
    }

    return result;
  }
}
