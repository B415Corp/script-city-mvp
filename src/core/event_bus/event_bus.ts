import { EventHandler, HandlerInfo, Subscription } from './types';
import { Events } from '@/event_bus/events';

export class EventBus {
  private handlers: Map<string, Set<HandlerInfo>> = new Map();

  // Публикация события в шине
  public emit<T = unknown>(eventType: Events, payload: T): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const readyHandlers = Array.from(handlers);
    readyHandlers.forEach((handler: HandlerInfo) => {
      try {
        handler.handler(payload);
      } catch (error) {
        console.error(`Ошибка при публикации события "${eventType}":`, error);
      }

      if (handler.once) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    });
  }

  // подписка на событие шины
  public on<T = unknown>(eventType: Events, handler: EventHandler<T>): Subscription {
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

  // Одноразовая подписка на событие шины
  public once<T>(eventType: Events, handler: EventHandler<T>): Subscription {
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

  // отписка от события шины
  public off<T = unknown>(eventType: Events, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    // Удаляем обработчики
    for (const handlerInfo of eventHandlers) {
      if (handlerInfo.handler === handler) {
        eventHandlers.delete(handlerInfo);
        return;
      }
    }

    // Если больше нет обработчиков для этого события, удаляем запись
    if (eventHandlers.size === 0) {
      this.handlers.delete(eventType);
    }
  }

  // Очистка событий
  clearEvents(eventType: Events): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}
