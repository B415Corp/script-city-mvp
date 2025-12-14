import { Tool } from '../tool';

export class LivingZoneTool extends Tool {
  constructor() {
    super();
  }

  emit<T>(payload: T | null = null): void {
    console.log('Living zone tool selected', payload);
  }
}
