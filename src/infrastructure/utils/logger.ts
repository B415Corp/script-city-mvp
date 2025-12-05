/**
 * Утилита для дебаг логирования с поддержкой env переменных.
 *
 * **Теги**: `arch:infrastructure`, `util:logging`, `debug:info`
 *
 * Использует переменную окружения VITE_DEBUG для включения/выключения дебаг логов.
 * Если VITE_DEBUG=true, то debug логи будут выводиться в консоль.
 *
 * @example
 * import { debugLog, debugWarn, debugError } from '@/infrastructure/utils/logger';
 *
 * debugLog('Компонент инициализирован', { id: 123 });
 * debugWarn('Warning message');
 * debugError('Error occurred', error);
 */

/**
 * Проверяет, включены ли дебаг логи через переменную окружения.
 * @returns true если VITE_DEBUG === 'true'
 */
function isDebugEnabled(): boolean {
  return import.meta.env.VITE_DEBUG === 'true';
}

/**
 * Дебаг лог (аналог console.log).
 * Выводится только если VITE_DEBUG === 'true'.
 * Использует console.warn для соответствия правилам линтера.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Дебаг предупреждение (аналог console.warn).
 * Выводится только если VITE_DEBUG === 'true'.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugWarn(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.warn(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Дебаг ошибка (аналог console.error).
 * Выводится только если VITE_DEBUG === 'true'.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugError(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Дебаг группа (аналог console.group).
 * Выводится только если VITE_DEBUG === 'true'.
 *
 * @param label - метка группы
 */
export function debugGroup(label: string): void {
  if (isDebugEnabled()) {
    console.group(`[DEBUG] ${label}`);
  }
}

/**
 * Закрытие дебаг группы (аналог console.groupEnd).
 * Выводится только если VITE_DEBUG === 'true'.
 */
export function debugGroupEnd(): void {
  if (isDebugEnabled()) {
    console.groupEnd();
  }
}

/**
 * Дебаг таблица (аналог console.table).
 * Выводится только если VITE_DEBUG === 'true'.
 * Использует console.warn для соответствия правилам линтера.
 *
 * @param data - данные для отображения в виде таблицы
 * @param columns - опциональный массив колонок для отображения
 */
export function debugTable(data: unknown, columns?: string[]): void {
  if (isDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.table(data, columns);
  }
}
