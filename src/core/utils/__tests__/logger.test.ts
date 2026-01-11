import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, LogLevel, logger, LOG_CONTEXT_COLORS, type LogContextColor } from '../logger';

/**
 * Тесты для Logger - системы логирования
 */
describe('Logger', () => {
  // Моки для console методов
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Мок для import.meta.env
  const originalImportMeta = (globalThis as { import?: { meta?: unknown } }).import?.meta;

  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    vi.clearAllMocks();

    // Мокаем import.meta.env по умолчанию для dev режима
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: false,
        },
      },
    } as { meta: { env: { PROD: boolean } } });
  });

  afterEach(() => {
    // Восстанавливаем оригинальный import.meta
    if (originalImportMeta) {
      (globalThis as { import?: { meta?: unknown } }).import = { meta: originalImportMeta };
    } else {
      delete (globalThis as { import?: { meta?: unknown } }).import;
    }
  });

  describe('LogLevel enum', () => {
    it('должен содержать все необходимые уровни логирования', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.NONE).toBe(4);
    });

    it('должен иметь правильную последовательность уровней', () => {
      const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.NONE];
      expect(levels).toEqual([0, 1, 2, 3, 4]);
    });

    it('должен позволять сравнивать уровни', () => {
      expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true);
      expect(LogLevel.INFO < LogLevel.WARN).toBe(true);
      expect(LogLevel.WARN < LogLevel.ERROR).toBe(true);
      expect(LogLevel.ERROR < LogLevel.NONE).toBe(true);
    });
  });

  describe('LOG_CONTEXT_COLORS', () => {
    it('должен содержать 15 цветов', () => {
      expect(LOG_CONTEXT_COLORS).toHaveLength(15);
    });

    it('все цвета должны быть валидными hex значениями', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;

      LOG_CONTEXT_COLORS.forEach((color: LogContextColor) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it('все цвета должны быть уникальными', () => {
      const uniqueColors = new Set(LOG_CONTEXT_COLORS);
      expect(uniqueColors.size).toBe(LOG_CONTEXT_COLORS.length);
    });
  });

  describe('Инициализация Logger', () => {
    it('должен инициализироваться с правильными значениями по умолчанию', () => {
      const testLogger = Logger.create('TestContext');

      expect(testLogger).toBeInstanceOf(Logger);
      // Проверяем уровень по умолчанию (DEBUG в dev режиме)
      expect(testLogger['level']).toBe(LogLevel.DEBUG);
      expect(testLogger['context']).toBe('TestContext');
      expect(testLogger['contextColor']).toBe('#ff6b6b'); // красный по умолчанию
    });

    it('должен позволять устанавливать начальный уровень', () => {
      // Создаем логгер через create, затем устанавливаем уровень
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.ERROR);

      expect(testLogger['level']).toBe(LogLevel.ERROR);
      expect(testLogger['context']).toBe('Test');
      expect(testLogger['contextColor']).toBe('#ff6b6b'); // красный по умолчанию
    });

    it('должен использовать контекст по умолчанию "App"', () => {
      const testLogger = Logger.create('App');

      expect(testLogger['context']).toBe('App');
    });
  });

  describe('getDefaultLevel()', () => {
    it('должен возвращать DEBUG в dev режиме', () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            PROD: false,
          },
        },
      });

      const testLogger = Logger.create('Test');
      expect(testLogger['level']).toBe(LogLevel.DEBUG);
    });

    it('должен возвращать ERROR в prod режиме', () => {
      // Мокаем import.meta.env.PROD
      const originalProd = import.meta.env.PROD;
      import.meta.env.PROD = true;

      try {
        const testLogger = Logger.create('Test');
        expect(testLogger['level']).toBe(LogLevel.ERROR);
      } finally {
        // Восстанавливаем оригинальное значение
        import.meta.env.PROD = originalProd;
      }
    });
  });

  describe('Singleton паттерн - getInstance()', () => {
    beforeEach(() => {
      // Сбрасываем singleton instance для этих тестов
      // @ts-ignore - доступ к private static полю для тестирования
      Logger.instance = undefined;
    });

    it('должен возвращать один и тот же инстанс', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();

      expect(logger1).toBe(logger2);
      expect(logger1).toBeInstanceOf(Logger);
    });

    it('должен использовать первый вызов для установки контекста и уровня', () => {
      const logger1 = Logger.getInstance('FirstContext', LogLevel.WARN);
      const logger2 = Logger.getInstance('SecondContext', LogLevel.DEBUG);

      expect(logger1).toBe(logger2);
      expect(logger1['context']).toBe('FirstContext');
      expect(logger1['level']).toBe(LogLevel.WARN);
    });

    it('должен использовать значения по умолчанию если не указаны', () => {
      const singletonLogger = Logger.getInstance();

      expect(singletonLogger['context']).toBe('App');
      expect(singletonLogger['level']).toBe(LogLevel.DEBUG);
    });
  });

  describe('create() - фабричный метод', () => {
    it('должен создавать новый инстанс логгера', () => {
      const logger1 = Logger.create('Context1');
      const logger2 = Logger.create('Context2');

      expect(logger1).not.toBe(logger2);
      expect(logger1['context']).toBe('Context1');
      expect(logger2['context']).toBe('Context2');
      expect(logger1['contextColor']).toBe('#ff6b6b'); // красный по умолчанию
      expect(logger2['contextColor']).toBe('#ff6b6b'); // красный по умолчанию
    });

    it('должен использовать уровень по умолчанию для новых инстансов', () => {
      const testLogger = Logger.create('Test');

      expect(testLogger['level']).toBe(LogLevel.DEBUG);
      expect(testLogger['contextColor']).toBe('#ff6b6b'); // красный по умолчанию
    });

    it('должен позволять устанавливать цвет контекста', () => {
      const testLogger = Logger.create('Test', '#4ecdc4'); // бирюзовый

      expect(testLogger['context']).toBe('Test');
      expect(testLogger['contextColor']).toBe('#4ecdc4');
    });

    it('должен использовать все доступные цвета из LOG_CONTEXT_COLORS', () => {
      LOG_CONTEXT_COLORS.forEach((color: LogContextColor, index: number) => {
        const testLogger = Logger.create(`Test${index}`, color);
        expect(testLogger['contextColor']).toBe(color);
      });
    });
  });

  describe('setLevel()', () => {
    it('должен устанавливать новый уровень логирования', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.ERROR);
      expect(testLogger['level']).toBe(LogLevel.ERROR);

      testLogger.setLevel(LogLevel.DEBUG);
      expect(testLogger['level']).toBe(LogLevel.DEBUG);
    });

    it('должен влиять на фильтрацию сообщений', () => {
      const testLogger = Logger.create('Test');

      // На уровне DEBUG должны логироваться все сообщения
      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug и info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error

      // Очищаем моки
      vi.clearAllMocks();

      // На уровне ERROR должны логироваться только ошибки
      testLogger.setLevel(LogLevel.ERROR);
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context color management', () => {
    it('должен возвращать цвет контекста через getContextColor', () => {
      const testLogger = Logger.create('Test', '#4ecdc4'); // бирюзовый

      expect(testLogger.getContextColor()).toBe('#4ecdc4');
    });

    it('должен устанавливать цвет контекста через setContextColor', () => {
      const testLogger = Logger.create('Test');

      expect(testLogger.getContextColor()).toBe('#ff6b6b'); // красный по умолчанию

      testLogger.setContextColor('#45b7d1'); // голубой
      expect(testLogger.getContextColor()).toBe('#45b7d1');
    });

    it('должен использовать новый цвет контекста в логах', () => {
      const testLogger = Logger.create('Test');

      testLogger.setContextColor('#4ecdc4'); // бирюзовый
      testLogger.setLevel(LogLevel.INFO);
      testLogger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%cℹ️ %c[INFO]%c [Test] Test message',
        'color: #10b981; font-weight: 500;', // emoji
        'color: #10b981; font-weight: 500;', // [INFO]
        'color: #4ecdc4; font-weight: 500;', // [Test] message - новый цвет
      );
    });
  });

  describe('debug()', () => {
    it('должен логировать debug сообщения на подходящем уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug('Test debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%c🐛 %c[DEBUG]%c [Test] Test debug message',
        'color: #6b7280; font-weight: 400;', // emoji
        'color: #6b7280; font-weight: 400;', // [DEBUG]
        'color: #ff6b6b; font-weight: 500;', // [Test] message - красный по умолчанию
      );
    });

    it('должен передавать дополнительные аргументы', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug('Message', 'arg1', 42, { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%c🐛 %c[DEBUG]%c [Test] Message',
        'color: #6b7280; font-weight: 400;', // emoji
        'color: #6b7280; font-weight: 400;', // [DEBUG]
        'color: #ff6b6b; font-weight: 500;', // [Test] message
        'arg1',
        42,
        { key: 'value' },
      );
    });

    it('не должен логировать debug сообщения на более высоком уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.INFO);
      testLogger.debug('Debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info()', () => {
    it('должен логировать info сообщения на подходящем уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.INFO);
      testLogger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%cℹ️ %c[INFO]%c [Test] Test info message',
        'color: #10b981; font-weight: 500;', // emoji
        'color: #10b981; font-weight: 500;', // [INFO]
        'color: #ff6b6b; font-weight: 500;', // [Test] message
      );
    });

    it('должен логировать info на DEBUG уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('не должен логировать info на WARN уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.WARN);
      testLogger.info('Info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn()', () => {
    it('должен логировать warning сообщения на подходящем уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.WARN);
      testLogger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '%c⚠️ %c[WARN]%c [Test] Test warning message',
        'color: #f59e0b; font-weight: 500;', // emoji
        'color: #f59e0b; font-weight: 500;', // [WARN]
        'color: #ff6b6b; font-weight: 500;', // [Test] message
      );
    });

    it('должен логировать warn на более низких уровнях', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('не должен логировать warn на ERROR уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.ERROR);
      testLogger.warn('Warning message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error()', () => {
    it('должен логировать error сообщения на подходящем уровне', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.ERROR);
      testLogger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '%c❌ %c[ERROR]%c [Test] Test error message',
        'color: #ef4444; font-weight: 600;', // emoji
        'color: #ef4444; font-weight: 600;', // [ERROR]
        'color: #ff6b6b; font-weight: 600;', // [Test] message
        undefined,
      );
    });

    it('должен логировать error с объектом ошибки', () => {
      const testLogger = Logger.create('Test');
      const testError = new Error('Test error');

      testLogger.setLevel(LogLevel.ERROR);
      testLogger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '%c❌ %c[ERROR]%c [Test] Error occurred',
        'color: #ef4444; font-weight: 600;', // emoji
        'color: #ef4444; font-weight: 600;', // [ERROR]
        'color: #ff6b6b; font-weight: 600;', // [Test] message
        testError,
      );
    });

    it('должен передавать дополнительные аргументы', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.ERROR);
      testLogger.error('Error message', new Error('test'), 'extra', 123);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '%c❌ %c[ERROR]%c [Test] Error message',
        'color: #ef4444; font-weight: 600;', // emoji
        'color: #ef4444; font-weight: 600;', // [ERROR]
        'color: #ff6b6b; font-weight: 600;', // [Test] message
        expect.any(Error),
        'extra',
        123,
      );
    });

    it('должен логировать error на всех уровнях кроме NONE', () => {
      const testLogger = Logger.create('Test');

      // На уровне NONE не должно логироваться ничего
      testLogger.setLevel(LogLevel.NONE);
      testLogger.error('Error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // На ERROR уровне должно логироваться
      testLogger.setLevel(LogLevel.ERROR);
      testLogger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Фильтрация сообщений по уровню', () => {
    it('должен правильно фильтровать сообщения на DEBUG уровне', () => {
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.DEBUG);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug и info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('должен правильно фильтровать сообщения на INFO уровне', () => {
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.INFO);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // только info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('должен правильно фильтровать сообщения на WARN уровне', () => {
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.WARN);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error
    });

    it('должен правильно фильтровать сообщения на ERROR уровне', () => {
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.ERROR);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // только error
    });

    it('не должен логировать ничего на NONE уровне', () => {
      const testLogger = Logger.create('Test');
      testLogger.setLevel(LogLevel.NONE);

      testLogger.debug('debug');
      testLogger.info('info');
      testLogger.warn('warn');
      testLogger.error('error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Форматирование сообщений', () => {
    it('должен правильно форматировать debug сообщения', () => {
      const testLogger = Logger.create('MyContext');
      testLogger.setLevel(LogLevel.DEBUG);

      testLogger.debug('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%c🐛 %c[DEBUG]%c [MyContext] Test message',
        'color: #6b7280; font-weight: 400;', // emoji
        'color: #6b7280; font-weight: 400;', // [DEBUG]
        'color: #ff6b6b; font-weight: 500;', // [MyContext] message
      );
    });

    it('должен правильно форматировать info сообщения', () => {
      const testLogger = Logger.create('MyContext');
      testLogger.setLevel(LogLevel.INFO);

      testLogger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%cℹ️ %c[INFO]%c [MyContext] Test message',
        'color: #10b981; font-weight: 500;', // emoji
        'color: #10b981; font-weight: 500;', // [INFO]
        'color: #ff6b6b; font-weight: 500;', // [MyContext] message
      );
    });

    it('должен правильно форматировать warn сообщения', () => {
      const testLogger = Logger.create('MyContext');
      testLogger.setLevel(LogLevel.WARN);

      testLogger.warn('Test message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '%c⚠️ %c[WARN]%c [MyContext] Test message',
        'color: #f59e0b; font-weight: 500;', // emoji
        'color: #f59e0b; font-weight: 500;', // [WARN]
        'color: #ff6b6b; font-weight: 500;', // [MyContext] message
      );
    });

    it('должен правильно форматировать error сообщения', () => {
      const testLogger = Logger.create('MyContext');
      testLogger.setLevel(LogLevel.ERROR);

      testLogger.error('Test message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '%c❌ %c[ERROR]%c [MyContext] Test message',
        'color: #ef4444; font-weight: 600;', // emoji
        'color: #ef4444; font-weight: 600;', // [ERROR]
        'color: #ff6b6b; font-weight: 600;', // [MyContext] message
        undefined,
      );
    });
  });

  describe('Экспортированный singleton logger', () => {
    it('должен быть инстансом Logger', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('должен иметь правильный контекст и уровень', () => {
      expect(logger['context']).toBe('App');
      expect(logger['level']).toBe(LogLevel.DEBUG);
    });

    it('должен позволять логирование', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.info('Test message from exported logger');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '%cℹ️ %c[INFO]%c [App] Test message from exported logger',
        'color: #10b981; font-weight: 500;', // emoji
        'color: #10b981; font-weight: 500;', // [INFO]
        'color: #ff6b6b; font-weight: 500;', // [App] message
      );
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должен поддерживать создание логгера для разных компонентов', () => {
      const ecsLogger = Logger.create('ECS');
      const uiLogger = Logger.create('UI');
      const apiLogger = Logger.create('API');

      expect(ecsLogger['context']).toBe('ECS');
      expect(uiLogger['context']).toBe('UI');
      expect(apiLogger['context']).toBe('API');

      expect(ecsLogger).not.toBe(uiLogger);
      expect(uiLogger).not.toBe(apiLogger);
      expect(ecsLogger).not.toBe(apiLogger);
    });

    it('должен корректно работать с разными уровнями в разных логгерах', () => {
      const debugLogger = Logger.create('DebugLogger');
      const errorLogger = Logger.create('ErrorLogger');

      debugLogger.setLevel(LogLevel.DEBUG);
      errorLogger.setLevel(LogLevel.ERROR);

      debugLogger.debug('Debug message');
      errorLogger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // только от debugLogger

      vi.clearAllMocks();

      debugLogger.error('Error message');
      errorLogger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // оба должны залогировать
    });

    it('должен сохранять состояние уровня между вызовами', () => {
      const testLogger = Logger.create('Test');

      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug('Message 1');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      testLogger.setLevel(LogLevel.ERROR);
      testLogger.debug('Message 2'); // не должно логироваться
      testLogger.error('Message 3'); // должно логироваться
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // без изменений
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
