// Предназначен для создания/наследования инструментовF
export abstract class Tool {
  constructor() {}

  emit<T>(payload: T | null = null): void {
    console.log('test tool emit', payload);
  }
}
