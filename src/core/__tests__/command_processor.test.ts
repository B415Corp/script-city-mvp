import { describe, it, expect, beforeEach } from 'vitest';
import { CommandProcessor } from '../command_processor/command_processor';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { CommandRegistry } from '../command_processor/command_registry';
import { ICommand, ValidationResult } from '../command_processor/types';
import { BaseCommandHandler } from '../command_processor/handlers';
import { ECSManager } from '../ecs_manager/ecs_manager';

// Тестируем жизненный цикл команд: enqueue → validate → apply + события результата.
class TestHandler extends BaseCommandHandler {
  commandType = 'Test';

  public validate(command: ICommand): ValidationResult {
    const isValid = (command as { allowed?: boolean }).allowed !== false;
    return isValid ? { valid: true } : { valid: false, error: 'forbidden' };
  }

  public apply(): void {
    this.eventBus.emit('applied');
  }
}

describe('CommandProcessor', () => {
  let eventBus: EventBus;
  let ecsManager: ECSManager;
  let registry: CommandRegistry;
  let processor: CommandProcessor;

  beforeEach(() => {
    // 1) Новый EventBus для изоляции.
    eventBus = new EventBus();
    // 2) Новый ECSManager.
    ecsManager = new ECSManager();
    // 3) Реестр команд и тестовый хэндлер.
    registry = new CommandRegistry();
    registry.registerHandler(new TestHandler(eventBus));
    // 4) Создаём CommandProcessor с зависимостями.
    processor = new CommandProcessor(eventBus, ecsManager, registry);
  });

  it('enqueues and processes valid commands', () => {
    // Валидная команда проходит apply и шлёт CommandProcessed + кастомное событие.
    const processed: string[] = [];
    // 1) Подписка на CommandProcessed — фиксируем тип команды.
    eventBus.on<{ command: ICommand }>(Events.CommandProcessed, (payload) => {
      const command = payload?.command;
      if (command) processed.push(command.type);
    });
    // 2) Подписка на кастомное событие из apply.
    eventBus.on('applied', () => processed.push('applied'));
    // 3) Кладём валидную команду в очередь.
    processor.enqueueCommand({ type: 'Test', timestamp: Date.now() });
    // 4) Обрабатываем очередь.
    processor.processCommands();
    // 5) Проверяем порядок событий.
    expect(processed).toEqual(['applied', 'Test']);
  });

  it('rejects invalid commands with events', () => {
    // Невалидная команда шлёт CommandRejected с причиной.
    const rejections: Array<{ type: string; reason?: string }> = [];
    // 1) Подписываемся на CommandRejected и собираем причину.
    eventBus.on<{ command: ICommand; reason?: string }>(Events.CommandRejected, (payload) => {
      const command = payload?.command;
      if (command) rejections.push({ type: command.type, reason: payload?.reason });
    });
    // 2) Кладём невалидную команду.
    processor.enqueueCommand({ type: 'Test', timestamp: Date.now(), allowed: false } as ICommand);
    // 3) Обрабатываем очередь.
    processor.processCommands();
    // 4) Проверяем, что отказ зафиксирован.
    expect(rejections).toEqual([{ type: 'Test', reason: 'forbidden' }]);
  });

  it('returns validation error when type missing', () => {
    // Базовая валидация ловит отсутствие типа.
    const result = processor.validateCommand({ type: '', timestamp: Date.now() });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Command type is required');
  });
});
