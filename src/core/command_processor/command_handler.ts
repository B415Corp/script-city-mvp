import { ICommand, ValidationResult } from './types';

/**
 * Интерфейс хэндлера команды.
 * Хэндлер отвечает за валидацию и применение конкретного типа команды.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export interface ICommandHandler {
  /** Тип команды, которую обрабатывает этот хэндлер */
  commandType: string;

  /** Валидирует команду */
  validate(command: ICommand): ValidationResult;

  /** Применяет команду */
  apply(command: ICommand): void;
}

/**
 * Интерфейс регистратора команд.
 * Позволяет модулям регистрировать свои хэндлеры команд.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export interface ICommandRegistry {
  /** Регистрирует хэндлер для типа команды */
  registerHandler(handler: ICommandHandler): void;

  /** Получает хэндлер для типа команды */
  getHandler(commandType: string): ICommandHandler | undefined;

  /** Возвращает все зарегистрированные типы команд */
  getRegisteredTypes(): string[];
}
