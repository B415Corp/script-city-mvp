import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolManager } from '../tool_manager/tool_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ToolActionContext, ToolDefinition } from '../tool_manager/types';

describe('ToolManager', () => {
  let eventBus: EventBus;
  let enqueueCommandMock: ReturnType<typeof vi.fn>;
  let toolManager: ToolManager;

  beforeEach(() => {
    eventBus = new EventBus();
    enqueueCommandMock = vi.fn();
    const fakeCommandProcessor: { enqueueCommand: (command: unknown) => void } = {
      enqueueCommand: enqueueCommandMock,
    };
    toolManager = new ToolManager({
      eventBus,
      commandProcessor: fakeCommandProcessor,
    });
  });

  const baseCategory = {
    id: 'test',
    name: 'Test',
    icon: '🧪',
    order: 1,
  };

  const makeTool = (id: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    id,
    type: 'select' as const,
    name: `Tool ${id}`,
    icon: '🔧',
    description: 'test tool',
    categoryId: baseCategory.id,
    order: 1,
    ...overrides,
  });

  it('registers tool, creates category and emits ToolRegistered', () => {
    const registered: Array<{ toolId: string; categoryId: string }> = [];
    eventBus.on<{ toolId: string; categoryId: string }>(Events.ToolRegistered, (p) => {
      if (p) registered.push({ toolId: p.toolId, categoryId: p.categoryId });
    });

    toolManager.registerTool({
      category: baseCategory,
      tool: makeTool('a'),
    });

    expect(toolManager.getCategories().map((c) => c.id)).toEqual(['test']);
    expect(toolManager.getTool('a')?.name).toBe('Tool a');
    expect(registered).toEqual([{ toolId: 'a', categoryId: 'test' }]);
  });

  it('activates and deactivates tools, invoking behaviors', () => {
    const onActivate = vi.fn();
    const onDeactivate = vi.fn();

    toolManager.registerTool({
      category: baseCategory,
      tool: makeTool('a', { behavior: { onActivate, onDeactivate } }),
    });
    toolManager.registerTool({
      category: baseCategory,
      tool: makeTool('b'),
    });

    toolManager.activateTool('a');
    expect(toolManager.isToolActive('a')).toBe(true);
    expect(onActivate).toHaveBeenCalledTimes(1);

    toolManager.activateTool('b');
    expect(toolManager.isToolActive('b')).toBe(true);
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('delegates map events to behavior and emits ToolUsed/ToolHovered/ToolUnhovered', () => {
    const toolUsed: Array<{ toolId: string }> = [];
    const toolHovered: Array<{ toolId: string }> = [];
    const toolUnhovered: Array<{ toolId: string }> = [];

    eventBus.on<{ toolId: string }>(
      Events.ToolUsed,
      (p) => p && toolUsed.push({ toolId: p.toolId }),
    );
    eventBus.on<{ toolId: string }>(
      Events.ToolHovered,
      (p) => p && toolHovered.push({ toolId: p.toolId }),
    );
    eventBus.on<{ toolId: string }>(
      Events.ToolUnhovered,
      (p) => p && toolUnhovered.push({ toolId: p.toolId }),
    );

    toolManager.registerTool({
      category: baseCategory,
      tool: makeTool('a', {
        behavior: {
          onUse: ({ tile, enqueueCommand }: ToolActionContext) =>
            enqueueCommand({
              type: 'DemoCommand',
              timestamp: Date.now(),
              position: tile,
            }),
          onHover: vi.fn(),
          onUnhover: vi.fn(),
        },
      }),
    });

    toolManager.activateTool('a');

    eventBus.emit(Events.TileHovered, { tileX: 1, tileY: 2 });
    eventBus.emit(Events.TileClicked, { tileX: 3, tileY: 4 });
    eventBus.emit(Events.TileUnhovered, { tileX: 1, tileY: 2 });

    expect(enqueueCommandMock).toHaveBeenCalledTimes(1);
    expect(toolUsed).toEqual([{ toolId: 'a' }]);
    expect(toolHovered).toEqual([{ toolId: 'a' }]);
    expect(toolUnhovered).toEqual([{ toolId: 'a' }]);
  });
});
