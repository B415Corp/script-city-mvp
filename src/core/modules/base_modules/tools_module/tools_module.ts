import { EventBus } from '@/core/event_bus/event_bus';
import { ToolsEvents, ToolStackType } from './types';
import { Events } from '@/core/event_bus/events';
import { LivingZoneTool } from './tools/living_zone_tool';
import { CommercialZoneTool } from './tools/commercial_zone_tool';
import { ClearZoneTool } from './tools/clear_zone_tool';
import { BaseModule } from '../../extends';

export class ToolsModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  public selectedTool!: string;

  // Список доступных инструментов
  private readonly toolsStack: ToolStackType = {
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

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('ToolsModule: init');
    super(scene, eventBus);

    this.scene = scene;
    this.eventBus = eventBus;

    // событие при выборе инструмента по его типу
    eventBus.on<ToolsEvents>(Events.SelectTool, (payload) => {
      if (!payload) {
        console.error('ToolsModule: нет данных');
        return;
      }

      if (!this.toolsStack[payload?.type]) {
        console.error(`ToolsModule: не найден инструмент с названием ${payload.type}`);
      }

      // вызов
      try {
        this.toolsStack[payload?.type].class.emit(payload.type);
        this.selectedTool = payload.type;
      } catch (error) {
        console.error(error);
      }
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
