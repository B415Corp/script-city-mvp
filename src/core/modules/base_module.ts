import { EventBus } from '../event_bus/event_bus';

class BaseModule {
  public eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    console.log('BaseModule init');
  }
}

export default BaseModule;
