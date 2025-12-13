import { EventBus } from '@/core/event_bus/event_bus';
import BaseModule from '../base_module';
import { TestZoneTool } from './tools/zone_tool';
import { ToolsEvents, ToolStackType } from './types';
import { Events } from '@/core/event_bus/events';

export class ToolsModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  // Список доступных инструментов
  private readonly toolsStack: ToolStackType = {
    test_tool: {
      localeName: 'Тест_1',
      description: null,
      icon: null,
      class: new TestZoneTool(),
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

      // вызов
      this.toolsStack[payload?.type].class.emit(payload.type);
    });
  }

  // список инструментов
  public getToolsList(): string[] {
    return Object.keys(this.toolsStack);
  }
}
