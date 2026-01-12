/**
 * Данные события ModuleEnabled/ModuleDisabled
 * Содержит информацию о модуле
 */
export interface ModuleStatePayload {
  /** Идентификатор модуля */
  id: string;
}

/**
 * Данные события ModuleError
 * Содержит информацию об ошибке модуля
 */
export interface ModuleErrorPayload {
  /** Идентификатор модуля */
  id: string;
  /** Объект ошибки */
  error: Error;
}
