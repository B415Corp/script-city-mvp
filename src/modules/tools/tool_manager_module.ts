import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { ToolManager } from '@/core/tool_manager/tool_manager';
import { debugError, debugLog } from '@/infrastructure/utils/logger';
import { SelectToolCommandHandler } from './select_tool_command_handler';

/**
 * Модуль-провайдер менеджера инструментов.
 * Создает и регистрирует ToolManager, хэндлер SelectTool.
 *
 * **Теги**: `arch:module`, `arch:tools`, `arch:ui`, `gameplay:editor`
 */
export class ToolManagerModule implements IModule {
  id = 'tools';
  dependencies?: string[];

  private toolManager?: ToolManager;

  async initialize(core: GameCore): Promise<void> {
    const eventBus = core.getEventBus();
    const commandProcessor = core.getCommandProcessor();

    this.toolManager = new ToolManager({
      eventBus,
      commandProcessor,
    });

    core.setToolManager(this.toolManager);

    core
      .getModuleManager()
      .registerCommandHandler(new SelectToolCommandHandler(eventBus, this.toolManager));

    debugLog('🔧 ToolManagerModule инициализирован');
  }

  destroy(): void {
    if (this.toolManager) {
      this.toolManager.destroy();
    }
    debugLog('🔧 ToolManagerModule уничтожен');
  }

  getToolManager(): ToolManager {
    if (!this.toolManager) {
      debugError('ToolManager not initialized. Call initialize() first.', {
        toolManager: this.toolManager,
      });
      throw new Error('ToolManager not initialized. Call initialize() first.');
    }
    return this.toolManager;
  }
}
