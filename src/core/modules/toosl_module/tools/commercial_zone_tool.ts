import { Tool } from '../tool';

export class CommercialZoneTool extends Tool {
  constructor() {
    super();
  }

  emit<T>(payload: T | null = null): void {
    console.log('Commercial zone tool selected', payload);
  }
}
