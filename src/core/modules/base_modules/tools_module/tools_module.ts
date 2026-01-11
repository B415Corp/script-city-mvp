import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { ToolId, ToolsEvents, ToolStackType } from './types';
import { Events } from '@/core/event_bus/events';
import { LivingZoneTool } from './tools/living_zone_tool';
import { CommercialZoneTool } from './tools/commercial_zone_tool';
import { ClearZoneTool } from './tools/clear_zone_tool';
import { BaseModule } from '../../extends';
import { SelectTool } from './tools/select_tool';

export class ToolsModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  public selectedTool!: string;
  private readonly defaultTool: ToolId = 'select';

  // Список доступных инструментов
  private readonly toolsStack: ToolStackType = {
    select: {
      localeName: 'select',
      description: null,
      icon: null,
      class: new SelectTool(),
    },
    living_zone: {
      localeName: 'living_zone',
      description: null,
      icon: null,
      class: new LivingZoneTool(),
    },
    commercial_zone: {
      localeName: 'commercial_zone',
      description: null,
      icon: null,
      class: new CommercialZoneTool(),
    },
    clear_zone: {
      localeName: 'clear_zone',
      description: null,
      icon: null,
      class: new ClearZoneTool(),
    },
  };

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);

    eventBus.on(Events.SelectTool, (payload) => {
      const entry = this.toolsStack[payload?.type ?? ''];
      if (!entry) return;

      entry.class.activate(this.eventBus);
      this.selectedTool = payload?.type ?? '';
    });

    eventBus.on(Events.ResetToolToDefault, () => {
      const entry = this.toolsStack[this.defaultTool];
      if (!entry) return;

      entry.class.activate(this.eventBus);
      this.selectedTool = this.defaultTool;
    });
  }

  // список инструментов
  public getToolsList(): string[] {
    return Object.keys(this.toolsStack);
  }

  public getCurrentToolName(): string {
    return this.selectedTool;
  }
}
