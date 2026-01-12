import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { ToolActivatedPayload, ToolId } from './types';

export abstract class Tool {
  abstract readonly id: ToolId;
  abstract getActivatedPayload(): ToolActivatedPayload;

  public activate(eventBus: EventBus): void {
    eventBus.emit(Events.ToolActivated, this.getActivatedPayload());
  }
}
