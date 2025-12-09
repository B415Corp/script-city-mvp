import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ECSManager } from '../ecs_manager/ecs_manager';
import { debugLog, debugGroup, debugGroupEnd } from '@/infrastructure/utils/logger';
import { ICommand, ValidationResult } from './types';
import { CommandRegistry } from './command_registry';

/**
 * Обрабатывает команды от UI и применяет их к игровому состоянию.
 *
 * Принципы работы:
 * - Принимает команды от UI слоя
 * - Валидирует команды перед применением
 * - Применяет команды через соответствующие системы (не напрямую мутирует данные)
 * - Генерирует события при успешном применении команд
 * - Поддерживает очередь команд для обработки в рамках одного тика
 *
 * Теги: `arch:commands`, `arch:core`, `arch:ui`
 */
export class CommandProcessor {
  private commandQueue: ICommand[] = [];
  private eventBus: EventBus;
  private _ecsManager: ECSManager;
  private registry: CommandRegistry;

  constructor(eventBus: EventBus, ecsManager: ECSManager, registry: CommandRegistry) {
    debugLog('🔄 CommandProcessor создан');
    this.eventBus = eventBus;
    this._ecsManager = ecsManager;
    this.registry = registry;
  }

  /**
   * Добавление команды в очередь для обработки.
   * Команда будет обработана при следующем вызове processCommands().
   *
   * @param command - команда для добавления в очередь
   */
  enqueueCommand(command: ICommand): void {
    // Устанавливаем timestamp, если он не установлен
    if (!command.timestamp) {
      command.timestamp = Date.now();
    }
    this.commandQueue.push(command);
    debugLog('⚙️ CommandProcessor: команда добавлена в очередь', {
      type: command.type,
      queueLength: this.commandQueue.length,
    });
  }

  /**
   * Обработка всех команд в очереди.
   * Вызывается в начале каждого тика (из TickManager).
   *
   * Последовательность обработки:
   * 1. Валидация команды
   * 2. Применение команды через соответствующие системы
   * 3. Генерация событий при успешном применении
   */
  processCommands(): void {
    if (this.commandQueue.length === 0) {
      return;
    }

    debugGroup('⚙️ CommandProcessor: обработка команд');
    const queueLength = this.commandQueue.length;
    debugLog('Команд в очереди', { count: queueLength });

    // Обрабатываем все команды в очереди
    const commandsToProcess = [...this.commandQueue];
    this.commandQueue = [];

    for (const command of commandsToProcess) {
      debugGroup(`Обработка команды: ${command.type}`);
      // Валидация команды
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        debugLog('Валидация команды провалена', {
          command: command.type,
          error: validation.error,
        });
        this.eventBus.emit(Events.CommandRejected, {
          command,
          reason: validation.error,
        });
        debugGroupEnd();
        continue;
      }

      debugLog('Валидация команды успешна', { command: command.type });

      // Применение команды
      try {
        debugLog('Применение команды', { command: command.type });
        this.applyCommand(command);
        this.eventBus.emit(Events.CommandProcessed, { command });
        debugLog('Команда обработана успешно', { command: command.type });
      } catch (error) {
        debugLog('Ошибка обработки команды', {
          command: command.type,
          error,
        });
        this.eventBus.emit(Events.CommandFailed, {
          command,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      debugGroupEnd();
    }

    debugLog('Обработка команд завершена', { processed: queueLength });
    debugGroupEnd();
  }

  /**
   * Валидация команды перед применением.
   *
   * @param command - команда для валидации
   * @returns результат валидации
   */
  validateCommand(command: ICommand): ValidationResult {
    // Если команда имеет собственный метод валидации, используем его
    if (command.validate) {
      return command.validate();
    }

    // Базовая валидация: проверка наличия обязательных полей
    if (!command.type) {
      return {
        valid: false,
        error: 'Command type is required',
      };
    }

    if (!command.timestamp) {
      return {
        valid: false,
        error: 'Command timestamp is required',
      };
    }

    // Ищем хэндлер для типа команды
    const handler = this.registry.getHandler(command.type);
    if (!handler) {
      // Неизвестный тип команды - считаем валидной для расширяемости
      return { valid: true };
    }

    return handler.validate(command);
  }

  /**
   * Применение команды через соответствующие системы.
   * Команды не должны напрямую мутировать данные, а должны работать через системы ECS.
   *
   * @param command - команда для применения
   */
  private applyCommand(command: ICommand): void {
    const handler = this.registry.getHandler(command.type);
    if (!handler) {
      console.warn('⚙️ CommandProcessor: unknown command type', command.type);
      return;
    }

    handler.apply(command);
  }

  /**
   * Очистка очереди команд.
   * Полезно при перезапуске игры или сбросе состояния.
   */
  clearQueue(): void {
    const queueLength = this.commandQueue.length;
    this.commandQueue = [];
    debugLog('⚙️ CommandProcessor: очередь команд очищена', { clearedCount: queueLength });
  }
}
