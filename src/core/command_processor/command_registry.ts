import { ICommandHandler, ICommandRegistry } from './command_handler';
import { debugLog } from '@/infrastructure/utils/logger';

/**
 * Реестр хэндлеров команд.
 * Позволяет модулям регистрировать обработчики для своих команд.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export class CommandRegistry implements ICommandRegistry {
  private handlers = new Map<string, ICommandHandler>();

  registerHandler(handler: ICommandHandler): void {
    if (this.handlers.has(handler.commandType)) {
      debugLog('⚠️ CommandRegistry: перезапись хэндлера для типа', {
        commandType: handler.commandType,
      });
    }

    this.handlers.set(handler.commandType, handler);
    debugLog('📝 CommandRegistry: зарегистрирован хэндлер', {
      commandType: handler.commandType,
    });
  }

  getHandler(commandType: string): ICommandHandler | undefined {
    return this.handlers.get(commandType);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Очистка реестра (полезно для тестов или переинициализации)
   */
  clear(): void {
    this.handlers.clear();
    debugLog('🧹 CommandRegistry: реестр очищен');
  }
}
