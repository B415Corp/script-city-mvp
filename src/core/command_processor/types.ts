/**
 * Базовый интерфейс для команд.
 * Команды представляют намерения изменить игровое состояние.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export interface ICommand {
  /** Тип команды (например, 'BuildBuilding', 'ChangeTaxRate') */
  type: string;
  /** Время создания команды (timestamp в миллисекундах) */
  timestamp: number;
  /** Опциональная валидация команды */
  validate?(): ValidationResult;
}

/**
 * Результат валидации команды.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export interface ValidationResult {
  /** Валидна ли команда */
  valid: boolean;
  /** Сообщение об ошибке (если невалидна) */
  error?: string;
}

/**
 * Типы команд для типизации.
 *
 * Теги: `arch:commands`, `arch:ui`
 */
export interface BuildBuildingCommand extends ICommand {
  type: 'BuildBuilding';
  position: { x: number; y: number };
  buildingType: string;
}

export interface BulldozeAreaCommand extends ICommand {
  type: 'BulldozeArea';
  area: { x: number; y: number; width: number; height: number };
}

export interface ChangeTaxRateCommand extends ICommand {
  type: 'ChangeTaxRate';
  taxType: string;
  newRate: number;
}

export interface SetPolicyCommand extends ICommand {
  type: 'SetPolicy';
  policyId: string;
  enabled: boolean;
}

export interface SetSimulationSpeedCommand extends ICommand {
  type: 'SetSimulationSpeed';
  speedLevel: number;
}

/** Тип объединения всех команд */
export type Command =
  | BuildBuildingCommand
  | BulldozeAreaCommand
  | ChangeTaxRateCommand
  | SetPolicyCommand
  | SetSimulationSpeedCommand;
