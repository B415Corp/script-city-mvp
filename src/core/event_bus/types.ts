export interface Subscription {
  unsubscribe(): void;
}

export interface HandlerInfo {
  handler: EventHandler;
  once: boolean;
}

export type EventHandler<T = unknown> = (payload?: T) => void;
