import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { ToolManager } from './tool_manager';
import { debugError, debugLog } from '@/infrastructure/utils/logger';
import { EventBus } from '@/core/event_bus/event_bus';

/**
 * Модуль управления инструментами.
 * Создает и управляет ToolManager для работы с инструментами редактора.
 *
 * **Теги**: `arch:module`, `arch:tools`, `arch:ui`, `gameplay:editor`
 *
 * Этот модуль должен быть зарегистрирован первым среди модулей инструментов,
 * так как другие модули (например, ZoningToolsModule) зависят от него.
 */
export class ToolsModule implements IModule {
  id = 'tools';
  dependencies?: string[];

  private toolManager?: ToolManager;

  async initialize(core: GameCore): Promise<void> {
    // Создаем ToolManager
    const eventBus = core.getEventBus();
    this.toolManager = new ToolManager(eventBus);

    // Регистрируем ToolManager в GameCore для доступа через getToolManager()
    core.setToolManager(this.toolManager);

    debugLog('🔧 ToolsModule инициализирован');
  }

  destroy(): void {
    if (this.toolManager) {
      this.toolManager.clear();
    }
    debugLog('🔧 ToolsModule уничтожен');
  }

  /**
   * Получение ToolManager.
   * Используется для доступа к менеджеру инструментов из модуля.
   *
   * @returns экземпляр ToolManager
   */
  getToolManager(): ToolManager {
    if (!this.toolManager) {
      debugError('ToolManager not initialized. Call initialize() first.', {
        toolManager: this.toolManager,
      });
      return new ToolManager(new EventBus());
    }
    return this.toolManager;
  }
}
