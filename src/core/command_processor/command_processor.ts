import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ECSManager } from '../ecs_manager/ecs_manager';
import {
  BuildBuildingCommand,
  BulldozeAreaCommand,
  ChangeTaxRateCommand,
  ICommand,
  SetPolicyCommand,
  SetSimulationSpeedCommand,
  ValidationResult,
} from './types';

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
  private ecsManager: ECSManager;

  constructor(eventBus: EventBus, ecsManager: ECSManager) {
    this.eventBus = eventBus;
    this.ecsManager = ecsManager;
    console.warn('⚙️ CommandProcessor initialized');
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

    // Обрабатываем все команды в очереди
    const commandsToProcess = [...this.commandQueue];
    this.commandQueue = [];

    for (const command of commandsToProcess) {
      // Валидация команды
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        console.warn('⚙️ CommandProcessor: command validation failed', {
          command: command.type,
          error: validation.error,
        });
        this.eventBus.emit(Events.CommandRejected, {
          command,
          reason: validation.error,
        });
        continue;
      }

      // Применение команды
      try {
        this.applyCommand(command);
        this.eventBus.emit(Events.CommandProcessed, { command });
      } catch (error) {
        console.error('⚙️ CommandProcessor: command processing failed', {
          command: command.type,
          error,
        });
        this.eventBus.emit(Events.CommandFailed, {
          command,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
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

    // Валидация по типу команды
    switch (command.type) {
      case 'BuildBuilding':
        return this.validateBuildBuildingCommand(command);
      case 'BulldozeArea':
        return this.validateBulldozeAreaCommand(command);
      case 'ChangeTaxRate':
        return this.validateChangeTaxRateCommand(command);
      case 'SetPolicy':
        return this.validateSetPolicyCommand(command);
      case 'SetSimulationSpeed':
        return this.validateSetSimulationSpeedCommand(command);
      default:
        // Неизвестный тип команды - считаем валидной для расширяемости
        return { valid: true };
    }
  }

  /**
   * Применение команды через соответствующие системы.
   * Команды не должны напрямую мутировать данные, а должны работать через системы ECS.
   *
   * @param command - команда для применения
   */
  private applyCommand(command: ICommand): void {
    switch (command.type) {
      case 'BuildBuilding':
        this.applyBuildBuildingCommand(command);
        break;
      case 'BulldozeArea':
        this.applyBulldozeAreaCommand(command);
        break;
      case 'ChangeTaxRate':
        this.applyChangeTaxRateCommand(command);
        break;
      case 'SetPolicy':
        this.applySetPolicyCommand(command);
        break;
      case 'SetSimulationSpeed':
        this.applySetSimulationSpeedCommand(command);
        break;
      default:
        console.warn('⚙️ CommandProcessor: unknown command type', command.type);
    }
  }

  /**
   * Очистка очереди команд.
   * Полезно при перезапуске игры или сбросе состояния.
   */
  clearQueue(): void {
    this.commandQueue = [];
  }

  // Валидаторы для конкретных типов команд

  private validateBuildBuildingCommand(command: ICommand): ValidationResult {
    const cmd = command as BuildBuildingCommand;
    if (!cmd.position || typeof cmd.position.x !== 'number' || typeof cmd.position.y !== 'number') {
      return {
        valid: false,
        error: 'BuildBuilding command requires valid position {x, y}',
      };
    }
    if (!cmd.buildingType || typeof cmd.buildingType !== 'string') {
      return {
        valid: false,
        error: 'BuildBuilding command requires buildingType',
      };
    }
    return { valid: true };
  }

  private validateBulldozeAreaCommand(command: ICommand): ValidationResult {
    const cmd = command as BulldozeAreaCommand;
    if (
      !cmd.area ||
      typeof cmd.area.x !== 'number' ||
      typeof cmd.area.y !== 'number' ||
      typeof cmd.area.width !== 'number' ||
      typeof cmd.area.height !== 'number'
    ) {
      return {
        valid: false,
        error: 'BulldozeArea command requires valid area {x, y, width, height}',
      };
    }
    return { valid: true };
  }

  private validateChangeTaxRateCommand(command: ICommand): ValidationResult {
    const cmd = command as ChangeTaxRateCommand;
    if (!cmd.taxType || typeof cmd.taxType !== 'string') {
      return {
        valid: false,
        error: 'ChangeTaxRate command requires taxType',
      };
    }
    if (typeof cmd.newRate !== 'number' || cmd.newRate < 0 || cmd.newRate > 1) {
      return {
        valid: false,
        error: 'ChangeTaxRate command requires newRate between 0 and 1',
      };
    }
    return { valid: true };
  }

  private validateSetPolicyCommand(command: ICommand): ValidationResult {
    const cmd = command as SetPolicyCommand;
    if (!cmd.policyId || typeof cmd.policyId !== 'string') {
      return {
        valid: false,
        error: 'SetPolicy command requires policyId',
      };
    }
    if (typeof cmd.enabled !== 'boolean') {
      return {
        valid: false,
        error: 'SetPolicy command requires enabled boolean',
      };
    }
    return { valid: true };
  }

  private validateSetSimulationSpeedCommand(command: ICommand): ValidationResult {
    const cmd = command as SetSimulationSpeedCommand;
    if (typeof cmd.speedLevel !== 'number' || cmd.speedLevel < 0) {
      return {
        valid: false,
        error: 'SetSimulationSpeed command requires speedLevel >= 0',
      };
    }
    return { valid: true };
  }

  // Применение конкретных типов команд

  private applyBuildBuildingCommand(command: ICommand): void {
    const cmd = command as BuildBuildingCommand;
    // TODO: Применение через систему строительства
    // В будущем это будет работать через ECS системы
    this.eventBus.emit(Events.BuildCommandRequested, {
      position: cmd.position,
      buildingType: cmd.buildingType,
    });
  }

  private applyBulldozeAreaCommand(command: ICommand): void {
    const cmd = command as BulldozeAreaCommand;
    // TODO: Применение через систему сноса
    this.eventBus.emit(Events.DemolishCommandRequested, {
      area: cmd.area,
    });
  }

  private applyChangeTaxRateCommand(command: ICommand): void {
    const cmd = command as ChangeTaxRateCommand;
    // TODO: Применение через экономическую систему
    this.eventBus.emit(Events.ChangeTaxRequested, {
      taxType: cmd.taxType,
      newRate: cmd.newRate,
    });
  }

  private applySetPolicyCommand(command: ICommand): void {
    const cmd = command as SetPolicyCommand;
    // TODO: Применение через систему политик
    this.eventBus.emit(Events.PolicyChangeRequested, {
      policyId: cmd.policyId,
      enabled: cmd.enabled,
    });
  }

  private applySetSimulationSpeedCommand(command: ICommand): void {
    const cmd = command as SetSimulationSpeedCommand;
    // Применение через TickManager (через событие)
    this.eventBus.emit(Events.SetSimulationSpeedRequested, {
      speedLevel: cmd.speedLevel,
    });
  }
}
