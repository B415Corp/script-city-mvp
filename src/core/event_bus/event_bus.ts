import { EventCallback, HandlerInfo, Subscription, EventPayloadMap } from './types';

// ============================================================================
// TYPE-SAFE EVENT BUS WITH BACKWARD COMPATIBILITY
// ============================================================================

export class EventBus {
  private listeners: Map<string, Set<HandlerInfo>> = new Map();

  // Type-safe methods for known events
  on<K extends keyof EventPayloadMap>(
    event: K,
    callback: EventCallback<EventPayloadMap[K]>,
  ): () => void;
  // Fallback for unknown events
  on(event: string, callback: EventCallback<unknown>): () => void;
  on(event: string, callback: EventCallback<unknown>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: callback,
      once: false,
    };

    this.listeners.get(event)!.add(handlerInfo);

    return () => this.off(event, callback);
  }

  // Type-safe methods for known events
  off<K extends keyof EventPayloadMap>(event: K, callback: EventCallback<EventPayloadMap[K]>): void;
  // Fallback for unknown events
  off(event: string, callback: EventCallback<unknown>): void;
  off(event: string, callback: EventCallback<unknown>): void {
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

  // Type-safe methods for known events
  emit<K extends keyof EventPayloadMap>(event: K, payload: EventPayloadMap[K]): void;
  // Fallback for unknown events
  emit(event: string, payload?: unknown): void;
  emit(event: string, payload?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    for (const handlerInfo of callbacks) {
      try {
        handlerInfo.handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in callback for "${event}":`, error);
      }
    }
  }

  // Type-safe methods for known events
  once<K extends keyof EventPayloadMap>(
    event: K,
    callback: EventCallback<EventPayloadMap[K]>,
  ): () => void;
  // Fallback for unknown events
  once(event: string, callback: EventCallback<unknown>): () => void;
  once(event: string, callback: EventCallback<unknown>): () => void {
    const wrappedCallback: EventCallback<unknown> = (payload?: unknown) => {
      callback(payload);
      this.off(event, wrappedCallback);
    };

    return this.on(event, wrappedCallback);
  }

  clear(): void {
    this.listeners.clear();
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  // Legacy methods for backward compatibility during transition
  emitLegacy(eventType: string, payload?: unknown): void {
    this.emit(eventType, payload);
  }

  onLegacy(eventType: string, handler: (payload?: unknown) => void): Subscription {
    return {
      unsubscribe: this.on(eventType, handler),
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
