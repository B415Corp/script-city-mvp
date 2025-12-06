/// <reference types="vite/client" />

/**
 * Типы для переменных окружения Vite.
 *
 * Все переменные окружения должны начинаться с префикса VITE_
 * для того, чтобы Vite мог их обработать и сделать доступными в коде.
 */
interface ImportMetaEnv {
  /**
   * Включение/выключение дебаг логов.
   * Установите в 'true' для включения дебаг логов, 'false' или не устанавливайте для выключения.
   *
   * @example
   * VITE_DEBUG=true
   */
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

