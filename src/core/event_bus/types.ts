export interface Subscription {
  unsubscribe(): void;
}

export interface HandlerInfo {
  handler: EventHandler;
  once: boolean;
}

// eslint-disable-next-line -- параметр payload является частью сигнатуры типа функции
export type EventHandler<T = unknown> = (payload?: T) => void;
