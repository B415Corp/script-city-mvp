/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Простой структурированный логгер
 */
export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private context: string;

  private constructor(context: string = 'App', level?: LogLevel) {
    this.context = context;
    this.level = level ?? this.getDefaultLevel();
  }

  /**
   * Получить инстанс логгера
   */
  static getInstance(context?: string, level?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context, level);
    }
    return Logger.instance;
  }

  /**
   * Создать логгер для конкретного контекста
   */
  static create(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Получить уровень логирования по умолчанию из env
   */
  private getDefaultLevel(): LogLevel {
    if (import.meta.env.PROD) {
      return LogLevel.ERROR;
    }
    return LogLevel.DEBUG;
  }

  /**
   * Установить уровень логирования
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Debug сообщение
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(
        `%c🐛 [DEBUG][${this.context}] ${message}`,
        'color: #6b7280; font-weight: 400;',
        ...args,
      );
    }
  }

  /**
   * Info сообщение
   */
  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(
        `%cℹ️ [INFO][${this.context}] ${message}`,
        'color: #10b981; font-weight: 500;',
        ...args,
      );
    }
  }

  /**
   * Warning сообщение
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(
        `%c⚠️ [WARN][${this.context}] ${message}`,
        'color: #f59e0b; font-weight: 500;',
        ...args,
      );
    }
  }

  /**
   * Error сообщение
   */
  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(
        `%c❌ [ERROR][${this.context}] ${message}`,
        'color: #ef4444; font-weight: 600;',
        error,
        ...args,
      );
    }
  }
}

// Export singleton для глобального использования
export const logger = Logger.getInstance();
