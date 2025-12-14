import { Tool } from '../tool';

export class ClearZoneTool extends Tool {
  constructor() {
    super();
  }

  emit<T>(payload: T | null = null): void {
    console.log('Clear zone tool selected', payload);
  }
}
