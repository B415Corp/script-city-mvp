import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { ToolManager } from './tool_manager';

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

    console.warn('🔧 ToolsModule initialized');
  }

  destroy(): void {
    if (this.toolManager) {
      this.toolManager.clear();
    }
    console.warn('🔧 ToolsModule destroyed');
  }

  /**
   * Получение ToolManager.
   * Используется для доступа к менеджеру инструментов из модуля.
   *
   * @returns экземпляр ToolManager
   */
  getToolManager(): ToolManager {
    if (!this.toolManager) {
      throw new Error('ToolManager not initialized. Call initialize() first.');
    }
    return this.toolManager;
  }
}
