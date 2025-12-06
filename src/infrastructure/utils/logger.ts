/**
 * Утилита для дебаг логирования с поддержкой env переменных и записи в IndexedDB.
 *
 * **Теги**: `arch:infrastructure`, `util:logging`, `debug:info`
 *
 * Использует переменную окружения VITE_DEBUG для включения/выключения дебаг логов.
 * Если VITE_DEBUG=true, то debug логи будут выводиться в консоль и автоматически
 * сохраняться в IndexedDB браузера. Логи записываются древовидно с отступами для групп.
 * Одна дата - одна запись в IndexedDB. Логи хранятся локально в браузере.
 *
 * @example
 * import { debugLog, debugWarn, debugError, downloadLogs } from '@/infrastructure/utils/logger';
 *
 * debugLog('Компонент инициализирован', { id: 123 });
 * debugWarn('Warning message');
 * debugError('Error occurred', error);
 *
 * debugGroup('Инициализация');
 * debugLog('Шаг 1');
 * debugLog('Шаг 2');
 * debugGroupEnd();
 *
 * // Скачать логи за текущую дату
 * await downloadLogs();
 */

declare const indexedDB: IDBFactory;

type LogLevel = 'LOG' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args: unknown[];
  indent: number;
}

interface SerializableLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args: string[]; // Сериализованные аргументы как строки
  indent: number;
}

interface DayLogs {
  date: string;
  entries: SerializableLogEntry[];
}

/**
 * Проверяет, включены ли дебаг логи через переменную окружения.
 * @returns true если VITE_DEBUG === 'true'
 */
function isDebugEnabled(): boolean {
  return import.meta.env.VITE_DEBUG === 'true';
}

/**
 * Форматирует дату в формат YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует время в формат HH:mm:ss
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Форматирует дату и время для имени файла
 */
function formatDateForFilename(date: Date): string {
  return formatDate(date);
}

/**
 * Создает отступ для древовидной структуры
 */
function createIndent(level: number): string {
  return '  '.repeat(level);
}

/**
 * Безопасно сериализует значение для сохранения в IndexedDB
 */
function safeSerialize(value: unknown, visited = new WeakSet()): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'symbol') {
    return '[Symbol]';
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  // Обработка циклических ссылок
  if (visited.has(value as object)) {
    return '[Circular]';
  }

  visited.add(value as object);

  try {
    // Пытаемся использовать JSON.stringify с replacer для удаления функций
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'function') {
        return '[Function]';
      }
      if (typeof val === 'symbol') {
        return '[Symbol]';
      }
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      return val;
    });
  } catch (error) {
    // Если не удалось сериализовать, возвращаем строковое представление
    try {
      return String(value);
    } catch {
      return '[Unable to serialize]';
    }
  }
}

/**
 * Сериализует аргументы в массив строк для сохранения
 */
function serializeArgsForStorage(args: unknown[]): string[] {
  return args.map((arg) => safeSerialize(arg));
}

/**
 * Сериализует аргументы в строку для вывода
 */
function serializeArgs(args: unknown[]): string {
  if (args.length === 0) {
    return '';
  }
  return (
    ' ' +
    args
      .map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(
              arg,
              (key, val) => {
                if (typeof val === 'function') {
                  return '[Function]';
                }
                if (typeof val === 'symbol') {
                  return '[Symbol]';
                }
                return val;
              },
              2,
            );
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ')
  );
}

// Константы для IndexedDB
const DB_NAME = 'script_city_logs';
const DB_VERSION = 1;
const LOGS_STORE = 'logs';

// Глобальное состояние для логирования
let currentIndent = 0;
let currentDate = formatDateForFilename(new Date());
let logEntries: LogEntry[] = [];
let db: IDBDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Инициализирует IndexedDB для хранения логов
 */
async function initializeDB(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (): void => {
      console.error('Ошибка при открытии базы данных логов:', request.error);
      reject(request.error);
    };

    request.onsuccess = (): void => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event): void => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Создаем object store для логов (ключ - дата)
      if (!database.objectStoreNames.contains(LOGS_STORE)) {
        database.createObjectStore(LOGS_STORE, { keyPath: 'date' });
      }
    };
  });

  return initPromise;
}

/**
 * Сохраняет логи за текущую дату в IndexedDB
 */
async function saveLogsToDB(): Promise<void> {
  if (!isDebugEnabled() || logEntries.length === 0 || !db) {
    return;
  }

  try {
    const transaction = db.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);

    // Получаем существующие логи за сегодня
    const getRequest = store.get(currentDate);
    const existingLogs: DayLogs | undefined = await new Promise((resolve, reject) => {
      getRequest.onsuccess = (): void => {
        resolve(getRequest.result);
      };
      getRequest.onerror = (): void => {
        reject(getRequest.error);
      };
    });

    // Сериализуем новые логи для сохранения
    const serializedNewEntries: SerializableLogEntry[] = logEntries.map((entry) => ({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      args: serializeArgsForStorage(entry.args),
      indent: entry.indent,
    }));

    // Объединяем с существующими логами
    const allEntries = existingLogs
      ? [...existingLogs.entries, ...serializedNewEntries]
      : serializedNewEntries;

    // Сохраняем обратно
    const dayLogs: DayLogs = {
      date: currentDate,
      entries: allEntries,
    };

    await new Promise<void>((resolve, reject) => {
      const putRequest = store.put(dayLogs);
      putRequest.onsuccess = (): void => {
        resolve();
      };
      putRequest.onerror = (): void => {
        reject(putRequest.error);
      };
    });

    // Очищаем массив после сохранения
    logEntries = [];
  } catch (error) {
    console.error('Ошибка при сохранении логов в IndexedDB:', error);
  }
}

/**
 * Записывает лог в память и периодически сохраняет в IndexedDB
 */
async function writeToStorage(entry: LogEntry): Promise<void> {
  if (!isDebugEnabled()) {
    return;
  }

  // Инициализируем БД если еще не инициализирована
  if (!db) {
    await initializeDB().catch((error) => {
      console.error('Ошибка при инициализации БД логов:', error);
    });
  }

  const today = formatDateForFilename(new Date(entry.timestamp));

  // Если дата изменилась, сохраняем старые логи и начинаем новые
  if (currentDate !== today) {
    if (logEntries.length > 0 && db) {
      await saveLogsToDB();
    }
    currentDate = today;
    logEntries = [];
  }

  // Добавляем в массив
  logEntries.push(entry);

  // Сохраняем в БД каждые 10 записей или каждые 5 секунд
  if (logEntries.length >= 10 && db) {
    await saveLogsToDB();
  }
}

// Автоматическое сохранение каждые 5 секунд
let saveInterval: number | null = null;

function startAutoSave(): void {
  if (saveInterval) {
    return;
  }

  saveInterval = window.setInterval(() => {
    if (logEntries.length > 0 && db) {
      saveLogsToDB().catch((error) => {
        console.error('Ошибка при автосохранении логов:', error);
      });
    }
  }, 5000);
}

function stopAutoSave(): void {
  if (saveInterval) {
    window.clearInterval(saveInterval);
    saveInterval = null;
  }
}

/**
 * Получает логи за указанную дату из IndexedDB
 */
export async function getLogsForDate(date: string): Promise<SerializableLogEntry[]> {
  if (!isDebugEnabled()) {
    return [];
  }

  if (!db) {
    await initializeDB().catch(() => {
      return [];
    });
  }

  if (!db) {
    return [];
  }

  try {
    const transaction = db.transaction([LOGS_STORE], 'readonly');
    const store = transaction.objectStore(LOGS_STORE);

    const dayLogs: DayLogs | undefined = await new Promise((resolve, reject) => {
      const request = store.get(date);
      request.onsuccess = (): void => {
        resolve(request.result);
      };
      request.onerror = (): void => {
        reject(request.error);
      };
    });

    return dayLogs?.entries || [];
  } catch (error) {
    console.error('Ошибка при получении логов из IndexedDB:', error);
    return [];
  }
}

/**
 * Форматирует логи в текстовый формат
 */
function formatLogsAsText(entries: SerializableLogEntry[]): string {
  if (entries.length === 0) {
    return '';
  }

  let content = '';

  for (const entry of entries) {
    const indent = createIndent(entry.indent);
    const timestamp = `${formatDate(new Date(entry.timestamp))} ${formatTime(new Date(entry.timestamp))}`;
    const level = `[${entry.level}]`;
    // Аргументы уже сериализованы как строки
    const argsStr = entry.args.length > 0 ? ' ' + entry.args.join(' ') : '';
    content += `${timestamp} ${level} ${indent}${entry.message}${argsStr}\n`;
  }

  return content;
}

/**
 * Скачивает логи за указанную дату (по умолчанию - текущая дата)
 */
export async function downloadLogs(date?: string): Promise<void> {
  if (!isDebugEnabled()) {
    return;
  }

  const targetDate = date || formatDateForFilename(new Date());

  // Получаем логи из БД
  const dbEntries = await getLogsForDate(targetDate);

  // Добавляем текущие логи из памяти, если дата совпадает
  let allEntries: SerializableLogEntry[] = dbEntries;
  if (targetDate === currentDate && logEntries.length > 0) {
    // Сериализуем текущие логи из памяти
    const serializedCurrentEntries: SerializableLogEntry[] = logEntries.map((entry) => ({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      args: serializeArgsForStorage(entry.args),
      indent: entry.indent,
    }));
    allEntries = [...dbEntries, ...serializedCurrentEntries];
  }

  if (allEntries.length === 0) {
    console.warn(`Нет логов за дату ${targetDate}`);
    return;
  }

  let content = `=== Логи за ${targetDate} ===\n\n`;
  content += formatLogsAsText(allEntries);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs-${targetDate}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Очищает логи за указанную дату из IndexedDB
 */
export async function clearLogsForDate(date: string): Promise<void> {
  if (!db) {
    await initializeDB().catch(() => {
      return;
    });
  }

  if (!db) {
    return;
  }

  try {
    const transaction = db.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(date);
      request.onsuccess = (): void => {
        resolve();
      };
      request.onerror = (): void => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Ошибка при очистке логов:', error);
  }
}

/**
 * Дебаг лог (аналог console.log).
 * Выводится только если VITE_DEBUG === 'true'.
 * Записывается в файл с датой и временем.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`, ...args);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'LOG',
      message,
      args,
      indent: currentIndent,
    };

    writeToStorage(entry).catch((error) => {
      console.error('Ошибка при записи лога в хранилище:', error);
    });
  }
}

/**
 * Дебаг предупреждение (аналог console.warn).
 * Выводится только если VITE_DEBUG === 'true'.
 * Записывается в файл с датой и временем.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugWarn(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.warn(`[DEBUG] ${message}`, ...args);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      args,
      indent: currentIndent,
    };

    writeToStorage(entry).catch((error) => {
      console.error('Ошибка при записи лога в хранилище:', error);
    });
  }
}

/**
 * Дебаг ошибка (аналог console.error).
 * Выводится только если VITE_DEBUG === 'true'.
 * Записывается в файл с датой и временем.
 *
 * @param message - сообщение для логирования
 * @param ...args - дополнительные аргументы для логирования
 */
export function debugError(message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.error(`[DEBUG] ${message}`, ...args);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      args,
      indent: currentIndent,
    };

    writeToStorage(entry).catch((error) => {
      console.error('Ошибка при записи лога в хранилище:', error);
    });
  }
}

/**
 * Дебаг группа (аналог console.group).
 * Выводится только если VITE_DEBUG === 'true'.
 * Увеличивает уровень отступа для последующих логов.
 *
 * @param label - метка группы
 */
export function debugGroup(label: string): void {
  if (isDebugEnabled()) {
    console.group(`[DEBUG] ${label}`);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'LOG',
      message: `▶ ${label}`,
      args: [],
      indent: currentIndent,
    };

    currentIndent++;
    writeToStorage(entry).catch((error) => {
      console.error('Ошибка при записи лога в хранилище:', error);
    });
  }
}

/**
 * Закрытие дебаг группы (аналог console.groupEnd).
 * Выводится только если VITE_DEBUG === 'true'.
 * Уменьшает уровень отступа для последующих логов.
 */
export function debugGroupEnd(): void {
  if (isDebugEnabled()) {
    console.groupEnd();

    if (currentIndent > 0) {
      currentIndent--;
    }
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

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'LOG',
      message: '[TABLE]',
      args: [data, columns].filter(Boolean),
      indent: currentIndent,
    };

    writeToStorage(entry).catch((error) => {
      console.error('Ошибка при записи лога в хранилище:', error);
    });
  }
}

// Инициализация при загрузке модуля
if (isDebugEnabled()) {
  initializeDB()
    .then(() => {
      startAutoSave();
      // Сохраняем логи при закрытии страницы
      window.addEventListener('beforeunload', () => {
        stopAutoSave();
        if (logEntries.length > 0 && db) {
          saveLogsToDB();
        }
      });
    })
    .catch((error) => {
      console.error('Ошибка при инициализации логирования:', error);
    });
}
