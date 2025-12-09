import { BaseCommandHandler } from '@/core/command_processor/handlers';
import { ICommand, SelectToolCommand, ValidationResult } from '@/core/command_processor/types';
import { EventBus } from '@/core/event_bus/event_bus';
import { ToolManager } from '@/core/tool_manager/tool_manager';

/**
 * Хэндлер команды выбора инструмента.
 *
 * **Теги**: `arch:commands`, `arch:tools`, `gameplay:editor`
 */
export class SelectToolCommandHandler extends BaseCommandHandler {
  commandType = 'SelectTool';

  constructor(
    eventBus: EventBus,
    private readonly toolManager: ToolManager,
  ) {
    super(eventBus);
  }

  validate(command: ICommand): ValidationResult {
    const { toolId } = command as SelectToolCommand;

    if (!toolId || typeof toolId !== 'string') {
      return {
        valid: false,
        error: 'SelectTool command requires toolId',
      };
    }

    if (!this.toolManager.hasTool(toolId)) {
      return {
        valid: false,
        error: `Tool "${toolId}" is not registered`,
      };
    }

    return { valid: true };
  }

  apply(command: ICommand): void {
    const { toolId } = command as SelectToolCommand;
    this.toolManager.activateTool(toolId);
  }
}
