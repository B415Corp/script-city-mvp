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
 * Предопределенные цвета для контекстов логгера
 */
export const LOG_CONTEXT_COLORS = [
  '#ff6b6b', // красный
  '#4ecdc4', // бирюзовый
  '#45b7d1', // голубой
  '#96ceb4', // мятный
  '#ffeaa7', // желтый
  '#dda0dd', // сливовый
  '#98d8c8', // салатовый
  '#f7dc6f', // золотой
  '#bb8fce', // фиолетовый
  '#85c1e9', // светло-синий
  '#f8c471', // оранжевый
  '#82e0aa', // зеленый
  '#f1948a', // розовый
  '#5dade2', // лазурный
  '#d7bde2', // лавандовый
] as const;

/**
 * Тип для цвета контекста
 */
export type LogContextColor = (typeof LOG_CONTEXT_COLORS)[number];

/**
 * Простой структурированный логгер
 */
export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private context: string;
  private contextColor: LogContextColor;

  private constructor(context: string = 'App', level?: LogLevel, contextColor?: LogContextColor) {
    this.context = context;
    this.level = level ?? this.getDefaultLevel();
    this.contextColor = contextColor ?? LOG_CONTEXT_COLORS[0]; // красный по умолчанию
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
   * Создать логгер для конкретного контекста с цветом
   */
  static create(context: string, contextColor?: LogContextColor): Logger {
    return new Logger(context, undefined, contextColor);
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
   * Получить цвет контекста
   */
  getContextColor(): LogContextColor {
    return this.contextColor;
  }

  /**
   * Установить цвет контекста
   */
  setContextColor(color: LogContextColor): void {
    this.contextColor = color;
  }

  /**
   * Debug сообщение
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(
        `%c🐛 %c[DEBUG]%c [${this.context}] ${message}`,
        'color: #6b7280; font-weight: 400;', // emoji
        'color: #6b7280; font-weight: 400;', // [DEBUG]
        `color: ${this.contextColor}; font-weight: 500;`, // [context] message
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
        `%cℹ️ %c[INFO]%c [${this.context}] ${message}`,
        'color: #10b981; font-weight: 500;', // emoji
        'color: #10b981; font-weight: 500;', // [INFO]
        `color: ${this.contextColor}; font-weight: 500;`, // [context] message
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
        `%c⚠️ %c[WARN]%c [${this.context}] ${message}`,
        'color: #f59e0b; font-weight: 500;', // emoji
        'color: #f59e0b; font-weight: 500;', // [WARN]
        `color: ${this.contextColor}; font-weight: 500;`, // [context] message
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
        `%c❌ %c[ERROR]%c [${this.context}] ${message}`,
        'color: #ef4444; font-weight: 600;', // emoji
        'color: #ef4444; font-weight: 600;', // [ERROR]
        `color: ${this.contextColor}; font-weight: 600;`, // [context] message
        error,
        ...args,
      );
    }
  }
}

// Export singleton для глобального использования
export const logger = Logger.getInstance();
