import { Tool } from '../tool';

export class TestZoneTool extends Tool {
  constructor() {
    super();
  }

  emit<T>(payload: T | null = null): void {
    console.log('TestZoneTool 1', payload);
  }
}
