import BaseModule from '../base_module';
import { EventBus } from '../../event_bus/event_bus';

export class KekModule extends BaseModule {
  constructor(eventBus: EventBus) {
    super(eventBus);
    console.log('KekModule init');
    // eventBus.phaser?.scene.add;
  }
}

export default KekModule;
