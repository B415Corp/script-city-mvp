export class EventBus {
  constructor() {
    console.warn('EventBus initialized');
  }

  emit<T = unknown>(event: string, data?: T): void {
    console.warn('EventBus emitted event', event, data);
  }

  clear(): void {
    console.warn('EventBus cleared');
  }
}
