import { EventCallback, HandlerInfo, Subscription, EventPayloadMap } from './types';
import { Events } from './events';

// ============================================================================
// TYPE-SAFE EVENT BUS
// ============================================================================

export class EventBus {
  private listeners: Map<string, Set<HandlerInfo>> = new Map();

  on<K extends keyof EventPayloadMap>(
    event: K,
    callback: EventCallback<EventPayloadMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: callback as EventCallback<unknown>,
      once: false,
    };

    this.listeners.get(event)!.add(handlerInfo);

    return () => this.off(event, callback);
  }

  off<K extends keyof EventPayloadMap>(
    event: K,
    callback: EventCallback<EventPayloadMap[K]>,
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Remove the specific callback
      for (const handlerInfo of callbacks) {
        if (handlerInfo.handler === callback) {
          callbacks.delete(handlerInfo);
          break;
        }
      }
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    for (const handlerInfo of callbacks) {
      try {
        (handlerInfo.handler as EventCallback<EventPayloadMap[K]>)(payload as EventPayloadMap[K]);
      } catch (error) {
        console.error(`[EventBus] Error in callback for "${event}":`, error);
      }
    }
  }

  once<K extends keyof EventPayloadMap>(
    event: K,
    callback: EventCallback<EventPayloadMap[K]>,
  ): () => void {
    const wrappedCallback: EventCallback<EventPayloadMap[K]> = (payload: EventPayloadMap[K]) => {
      callback(payload);
      this.off(event, wrappedCallback);
    };

    return this.on(event, wrappedCallback);
  }

  clear(): void {
    this.listeners.clear();
  }

  getListenerCount(event: keyof EventPayloadMap): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  // Legacy methods for backward compatibility during transition
  emitLegacy(eventType: string, payload?: unknown): void {
    this.emit(
      eventType as keyof EventPayloadMap,
      payload as EventPayloadMap[keyof EventPayloadMap],
    );
  }

  onLegacy(eventType: string, handler: (payload?: unknown) => void): Subscription {
    return {
      unsubscribe: this.on(eventType as keyof EventPayloadMap, handler as EventCallback<unknown>),
    };
  }

  clearEvents(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}
