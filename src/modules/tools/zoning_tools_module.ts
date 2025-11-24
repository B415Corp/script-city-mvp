import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { ToolRegistration } from './types';

/**
 * Модуль инструментов зонирования.
 * Регистрирует инструменты для работы с зонами (жилые, коммерческие, промышленные).
 *
 * **Теги**: `arch:module`, `arch:tools`, `gameplay:zoning`, `building:zoning`
 */
export class ZoningToolsModule implements IModule {
  id = 'zoning_tools';
  dependencies = ['tools'];

  private core?: GameCore;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    this.registerTools();
    console.warn('🔧 ZoningToolsModule initialized');
  }

  private registerTools(): void {
    const toolManager = this.core!.getToolManager();
    if (!toolManager) {
      throw new Error('ToolManager is not available. ToolsModule must be initialized before ZoningToolsModule.');
    }

    // Категория зонирования
    const zoningCategory: Omit<ToolRegistration['category'], 'tools'> = {
      id: 'zoning',
      name: 'Зонирование',
      icon: '🏘️',
      order: 1,
    };

    // Жилая зона низкой плотности
    toolManager.registerTool({
      category: zoningCategory,
      tool: {
        id: 'zone_residential_low',
        type: 'zone_residential_low',
        name: 'Жилая (низкая)',
        icon: '🏠',
        description: 'Жилая зона низкой плотности',
        categoryId: 'zoning',
        order: 1,
        hotkey: '1',
      },
    });

    // Коммерческая зона низкой плотности
    toolManager.registerTool({
      category: zoningCategory,
      tool: {
        id: 'zone_commercial_low',
        type: 'zone_commercial_low',
        name: 'Коммерческая (низкая)',
        icon: '🏪',
        description: 'Коммерческая зона низкой плотности',
        categoryId: 'zoning',
        order: 2,
        hotkey: '2',
      },
    });

    // Промышленная зона низкой плотности
    toolManager.registerTool({
      category: zoningCategory,
      tool: {
        id: 'zone_industrial_low',
        type: 'zone_industrial_low',
        name: 'Промышленная (низкая)',
        icon: '🏭',
        description: 'Промышленная зона низкой плотности',
        categoryId: 'zoning',
        order: 3,
        hotkey: '3',
      },
    });

    // Удаление зонирования
    toolManager.registerTool({
      category: zoningCategory,
      tool: {
        id: 'zone_remove',
        type: 'zone_remove',
        name: 'Удалить зону',
        icon: '🗑️',
        description: 'Удалить зонирование с тайла',
        categoryId: 'zoning',
        order: 4,
        hotkey: '4',
      },
    });
  }

  destroy(): void {
    console.warn('🔧 ZoningToolsModule destroyed');
  }
}
