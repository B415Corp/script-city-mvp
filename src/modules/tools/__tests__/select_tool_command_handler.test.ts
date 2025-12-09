import { describe, it, expect, vi } from 'vitest';
import { SelectToolCommandHandler } from '../select_tool_command_handler';
import { EventBus } from '@/core/event_bus/event_bus';
import { SelectToolCommand } from '@/core/command_processor/types';
import type { ToolManager } from '@/core/tool_manager/tool_manager';

describe('SelectToolCommandHandler', () => {
  const eventBus = new EventBus();

  const makeHandler = (
    overrides?: Partial<{ hasTool: boolean }>,
  ): {
    handler: SelectToolCommandHandler;
    toolManager: Pick<ToolManager, 'hasTool' | 'activateTool'>;
  } => {
    const toolManager: Pick<ToolManager, 'hasTool' | 'activateTool'> = {
      hasTool: vi.fn().mockReturnValue(overrides?.hasTool ?? true),
      activateTool: vi.fn(),
    };
    const handler = new SelectToolCommandHandler(eventBus, toolManager);
    return { handler, toolManager };
  };

  it('validates presence and existence of tool', () => {
    const { handler, toolManager } = makeHandler({ hasTool: false });

    expect(handler.validate({ type: 'SelectTool', timestamp: Date.now() })).toEqual({
      valid: false,
      error: 'SelectTool command requires toolId',
    });

    const missing: SelectToolCommand = {
      type: 'SelectTool',
      toolId: 'missing',
      timestamp: Date.now(),
    };
    expect(handler.validate(missing)).toEqual({
      valid: false,
      error: 'Tool "missing" is not registered',
    });
    expect(toolManager.hasTool).toHaveBeenCalledWith('missing');
  });

  it('activates tool on apply', () => {
    const { handler, toolManager } = makeHandler({ hasTool: true });
    const command = { type: 'SelectTool', toolId: 'zone', timestamp: Date.now() };

    const validation = handler.validate(command);
    expect(validation.valid).toBe(true);

    handler.apply(command);
    expect(toolManager.activateTool).toHaveBeenCalledWith('zone');
  });
});
