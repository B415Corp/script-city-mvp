import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { ToolRegistration } from '@/core/tool_manager/types';
import { debugLog } from '@/infrastructure/utils/logger';
import { ZoneTileCommand, RemoveZoneCommand } from '@/core/command_processor/types';

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
    debugLog('🔧 ZoningToolsModule инициализирован');
  }

  private registerTools(): void {
    const toolManager = this.core!.getToolManager();
    if (!toolManager) {
      throw new Error(
        'ToolManager is not available. ToolManagerModule must be initialized before ZoningToolsModule.',
      );
    }

    // Категория зонирования
    const zoningCategory: Omit<ToolRegistration['category'], 'tools'> = {
      id: 'zoning',
      name: 'Зонирование',
      icon: '🏘️',
      order: 1,
    };

    const registerZoneTool = (
      tool: Omit<ToolRegistration['tool'], 'categoryId' | 'behavior'>,
      zoneType: ZoneTileCommand['zoneType'],
    ): void => {
      toolManager.registerTool({
        category: zoningCategory,
        tool: {
          ...tool,
          categoryId: zoningCategory.id,
          behavior: {
            onUse: ({ tile, enqueueCommand }) =>
              enqueueCommand({
                type: 'ZoneTile',
                position: { x: tile.x, y: tile.y },
                zoneType,
                timestamp: Date.now(),
              }),
          },
        },
      });
    };

    // Жилая зона низкой плотности
    registerZoneTool(
      {
        id: 'zone_residential_low',
        type: 'zone_residential_low',
        name: 'Жилая (низкая)',
        icon: '🏠',
        description: 'Жилая зона низкой плотности',
        order: 1,
        hotkey: '1',
      },
      'residential_low',
    );

    // Коммерческая зона низкой плотности
    registerZoneTool(
      {
        id: 'zone_commercial_low',
        type: 'zone_commercial_low',
        name: 'Коммерческая (низкая)',
        icon: '🏪',
        description: 'Коммерческая зона низкой плотности',
        order: 2,
        hotkey: '2',
      },
      'commercial_low',
    );

    // Промышленная зона низкой плотности
    registerZoneTool(
      {
        id: 'zone_industrial_low',
        type: 'zone_industrial_low',
        name: 'Промышленная (низкая)',
        icon: '🏭',
        description: 'Промышленная зона низкой плотности',
        order: 3,
        hotkey: '3',
      },
      'industrial_low',
    );

    // Удаление зонирования
    toolManager.registerTool({
      category: zoningCategory,
      tool: {
        id: 'zone_remove',
        type: 'zone_remove',
        name: 'Удалить зону',
        icon: '🗑️',
        description: 'Удалить зонирование с тайла',
        categoryId: zoningCategory.id,
        order: 4,
        hotkey: '4',
        behavior: {
          onUse: ({ tile, enqueueCommand }) => {
            const command: RemoveZoneCommand = {
              type: 'RemoveZone',
              position: { x: tile.x, y: tile.y },
              timestamp: Date.now(),
            };
            enqueueCommand(command);
          },
        },
      },
    });
  }

  destroy(): void {
    debugLog('🔧 ZoningToolsModule уничтожен');
  }
}
