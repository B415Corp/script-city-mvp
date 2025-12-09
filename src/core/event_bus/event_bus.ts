import { EventHandler, HandlerInfo, Subscription } from './types';
import { Events } from './events';
import { debugLog } from '@/infrastructure/utils/logger';

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
 * import { Events } from './events';
 * const eventBus = new EventBus();
 *
 * // Подписка на событие (рекомендуется использовать Events enum)
 * const sub = eventBus.on<{ tileX: number; tileY: number }>(Events.TileClicked, (data) => {
 *   console.log('Tile clicked:', data?.tileX, data?.tileY);
 * });
 *
 * // Публикация события
 * eventBus.emit(Events.TileClicked, { tileX: 10, tileY: 20 });
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
   * События, которые не нужно логировать (циклические события).
   * Используется Set для быстрой проверки исключений.
   */
  private readonly EXCLUDED_FROM_LOGGING = new Set<string>([
    Events.TickStarted,
    Events.TickEnded,
    Events.BuildingLevelUp,
  ]);

  /**
   * Счётчик событий за текущий тик.
   */
  private eventsPerTick: number = 0;
  private lastTickEventsCount: number = 0;

  /**
   * История событий за последние N тиков для расчёта среднего значения.
   */
  private eventsPerTickHistory: number[] = [];
  private readonly EVENTS_HISTORY_SIZE = 30; // Храним историю за 30 тиков

  /**
   * Создаёт новый экземпляр EventBus.
   */
  constructor() {
    // Подписываемся на события тиков для отслеживания событий за тик
    this.on(Events.TickStarted, () => {
      this.lastTickEventsCount = this.eventsPerTick;

      // Добавляем в историю
      this.eventsPerTickHistory.push(this.eventsPerTick);

      // Ограничиваем размер истории
      if (this.eventsPerTickHistory.length > this.EVENTS_HISTORY_SIZE) {
        this.eventsPerTickHistory.shift();
      }

      this.eventsPerTick = 0;
    });
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
   * @param eventType - Тип события (рекомендуется использовать Events enum)
   * @param payload - Опциональные данные события (типизированы через дженерик T)
   *
   * @example
   * import { Events } from './events';
   * eventBus.emit(Events.TileClicked, { tileX: 10, tileY: 20 });
   * eventBus.emit(Events.TickStarted); // событие без данных
   */
  emit<T = unknown>(eventType: Events | string, payload?: T): void {
    // Увеличиваем счётчик событий за тик
    this.eventsPerTick++;

    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers || eventHandlers.size === 0) {
      // if (!this.EXCLUDED_FROM_LOGGING.has(eventType)) {
      //   debugLog('EventBus: нет обработчиков для события', { eventType });
      // }
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
   * import { Events } from './events';
   * const subscription = eventBus.on<{ tileX: number; tileY: number }>(Events.TileClicked, (data) => {
   *   console.log('Tile clicked:', data?.tileX, data?.tileY);
   * });
   *
   * // Позже можно отписаться
   * subscription.unsubscribe();
   */
  on<T = unknown>(eventType: Events | string, handler: EventHandler<T>): Subscription {
    if (!this.handlers.has(eventType)) {
      debugLog('EventBus on: обработчики не найдены, создаём новый набор', { eventType });
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: false,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    debugLog('EventBus on: подписка добавлена', { eventType, handlerInfo });

    return {
      unsubscribe: (): void => {
        debugLog('EventBus on: отписка', { eventType, handlerInfo });
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
   * import { Events } from './events';
   * eventBus.once(Events.GameStarted, () => {
   *   console.log('Игра запущена!');
   *   // Этот обработчик будет вызван только один раз
   * });
   */
  once<T = unknown>(eventType: Events | string, handler: EventHandler<T>): Subscription {
    if (!this.handlers.has(eventType)) {
      debugLog('EventBus once: обработчики не найдены, создаём новый набор', { eventType });
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: true,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    debugLog('EventBus once: одноразовая подписка добавлена', { eventType, handlerInfo });

    return {
      unsubscribe: (): void => {
        debugLog('EventBus once: отписка', { eventType, handlerInfo });
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
   * import { Events } from './events';
   * const handler = (data) => console.log(data);
   * eventBus.on(Events.TileClicked, handler);
   *
   * // Позже отписываемся
   * eventBus.off(Events.TileClicked, handler);
   */
  off(eventType: Events | string, handler: Function): void {
    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers) {
      debugLog('EventBus off: обработчики не найдены', { eventType, handler });
      return;
    }

    // Находим и удаляем обработчик
    for (const handlerInfo of eventHandlers) {
      if (handlerInfo.handler === handler) {
        eventHandlers.delete(handlerInfo);
        debugLog('EventBus off: обработчик найден и удалён', { eventType, handlerInfo });
        break;
      }
    }

    // Если больше нет обработчиков для этого события, удаляем запись
    if (eventHandlers.size === 0) {
      this.handlers.delete(eventType);
      debugLog('EventBus off: обработчиков не осталось, удаляем тип события', { eventType });
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
   * import { Events } from './events';
   * // Очистить все подписки на конкретное событие
   * eventBus.clear(Events.TileClicked);
   *
   * // Очистить все подписки на все события
   * eventBus.clear();
   */
  clear(eventType?: Events | string): void {
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


  /**
   * Получение количества событий, зарегистрированных за последний тик.
   *
   * @returns количество событий за последний завершённый тик
   */
  getEventsPerTick(): number {
    return this.lastTickEventsCount;
  }

  /**
   * Получение среднего количества событий за последние N тиков.
   *
   * @returns среднее количество событий за тик
   */
  getAverageEventsPerTick(): number {
    if (this.eventsPerTickHistory.length === 0) {
      return 0;
    }

    const sum = this.eventsPerTickHistory.reduce((acc, count) => acc + count, 0);
    return Math.round(sum / this.eventsPerTickHistory.length);
  }
}
