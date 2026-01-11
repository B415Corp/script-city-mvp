import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TickManager } from '../tick_manager';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';
import { SetSpeedPayload } from '../types';

/**
 * Тесты для TickManager - оркестратора управления тиками и временем
 */
describe('TickManager', () => {
  let mockEventBus: EventBus;
  let tickManager: TickManager;

  beforeEach(() => {
    // Создаем мок EventBus
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(() => () => {}),
      off: vi.fn(),
      once: vi.fn(() => () => {}),
      clear: vi.fn(),
      getListenerCount: vi.fn(() => 0),
      emitLegacy: vi.fn(),
      onLegacy: vi.fn(() => ({ unsubscribe: () => {} })),
      clearEvents: vi.fn(),
    } as unknown as EventBus;

    tickManager = new TickManager(mockEventBus);
  });

  describe('Инициализация', () => {
    it('должен инициализироваться с правильными начальными значениями', () => {
      expect(tickManager.getTickRate()).toBe(10);
      expect(tickManager.getFixedStepMs()).toBe(100);
      expect(tickManager.isPaused()).toBe(false);
    });

    it('должен позволять устанавливать начальную скорость тиков', () => {
      const customManager = new TickManager(mockEventBus, 20);
      expect(customManager.getTickRate()).toBe(20);
      expect(customManager.getFixedStepMs()).toBe(50);
    });

    it('должен подписываться на события управления в конструкторе', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(Events.GamePauseToggle, expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith(Events.SetGameSpeed, expect.any(Function));
    });
  });

  describe('update() - основной метод обновления', () => {
    it('должен эмитить TickStarted событие при каждом обновлении', () => {
      tickManager.update(1000, 16.67);

      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.TickStarted, {
        time: 1000,
        delta: 16.67,
      });
    });

    it('должен выполнять тики и эмитить соответствующие события', () => {
      // Mock для TickController.update возвращает 1 тик
      const mockTickController = tickManager.getTickController();
      vi.spyOn(mockTickController, 'update').mockReturnValue(1);

      tickManager.update(1000, 100);

      // Должен эмитить LogicTick событие
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, {
        delta: 100, // fixedStepMs
        ticksExecuted: 1,
      });

      // TimeService.tick() должен быть вызван 1 раз
      const timeService = tickManager.getTimeService();
      expect(timeService.getTick()).toBe(1);
    });

    it('должен выполнять несколько тиков за одно обновление', () => {
      const mockTickController = tickManager.getTickController();
      vi.spyOn(mockTickController, 'update').mockReturnValue(3);

      tickManager.update(1000, 300);

      // Должен эмитить LogicTick с ticksExecuted: 3
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, {
        delta: 100,
        ticksExecuted: 3,
      });

      // TimeService.tick() должен быть вызван 3 раза
      const timeService = tickManager.getTimeService();
      expect(timeService.getTick()).toBe(3);
    });

    it('не должен выполнять тики если TickController вернул 0', () => {
      const mockTickController = tickManager.getTickController();
      vi.spyOn(mockTickController, 'update').mockReturnValue(0);

      tickManager.update(1000, 50);

      // LogicTick не должен эмититься
      expect(mockEventBus.emit).not.toHaveBeenCalledWith(
        Events.LogicTick,
        expect.any(Object)
      );

      // TimeService.tick() не должен вызываться
      const timeService = tickManager.getTimeService();
      expect(timeService.getTick()).toBe(0);
    });
  });

  describe('Обработка событий управления', () => {
    describe('GamePauseToggle', () => {
      it('должен переключать паузу при получении события', () => {
        expect(tickManager.isPaused()).toBe(false);

        // Имитируем получение события
        const pauseCallback = (mockEventBus.on as any).mock.calls.find(
          ([event]) => event === Events.GamePauseToggle
        )[1];

        pauseCallback();
        expect(tickManager.isPaused()).toBe(true);

        pauseCallback();
        expect(tickManager.isPaused()).toBe(false);
      });
    });

    describe('SetGameSpeed', () => {
      it('должен устанавливать скорость при получении события', () => {
        const speedCallback = (mockEventBus.on as any).mock.calls.find(
          ([event]) => event === Events.SetGameSpeed
        )[1];

        const payload: SetSpeedPayload = { speed: 60 };
        speedCallback(payload);

        expect(tickManager.getTickRate()).toBe(60);
        expect(tickManager.getFixedStepMs()).toBe(1000 / 60);
      });

      it('должен поддерживать все допустимые скорости', () => {
        const speedCallback = (mockEventBus.on as any).mock.calls.find(
          ([event]) => event === Events.SetGameSpeed
        )[1];

        const speeds: SetSpeedPayload['speed'][] = [10, 60, 240];

        speeds.forEach(speed => {
          const payload: SetSpeedPayload = { speed };
          speedCallback(payload);
          expect(tickManager.getTickRate()).toBe(speed);
        });
      });
    });
  });

  describe('Управление паузой', () => {
    it('pause() должен ставить на паузу', () => {
      tickManager.pause();
      expect(tickManager.isPaused()).toBe(true);
    });

    it('resume() должен снимать с паузы', () => {
      tickManager.pause();
      tickManager.resume();
      expect(tickManager.isPaused()).toBe(false);
    });

    it('togglePause() должен переключать паузу', () => {
      expect(tickManager.isPaused()).toBe(false);
      tickManager.togglePause();
      expect(tickManager.isPaused()).toBe(true);
      tickManager.togglePause();
      expect(tickManager.isPaused()).toBe(false);
    });
  });

  describe('Доступ к контроллерам и сервисам', () => {
    it('getTickController() должен возвращать TickController', () => {
      const controller = tickManager.getTickController();
      expect(controller).toBeDefined();
      expect(controller.getTickRate).toBeDefined();
      expect(controller.update).toBeDefined();
    });

    it('getTimeService() должен возвращать TimeService', () => {
      const service = tickManager.getTimeService();
      expect(service).toBeDefined();
      expect(service.tick).toBeDefined();
      expect(service.getTimeData).toBeDefined();
    });
  });

  describe('Геттеры для обратной совместимости', () => {
    it('getFixedStepMs() должен возвращать fixed step из TickController', () => {
      expect(tickManager.getFixedStepMs()).toBe(100);

      tickManager.getTickController().setSpeed(20);
      expect(tickManager.getFixedStepMs()).toBe(50);
    });

    it('getTickRate() должен возвращать tick rate из TickController', () => {
      expect(tickManager.getTickRate()).toBe(10);

      tickManager.getTickController().setSpeed(30);
      expect(tickManager.getTickRate()).toBe(30);
    });

    it('isPaused() должен возвращать состояние паузы из TickController', () => {
      expect(tickManager.isPaused()).toBe(false);

      tickManager.pause();
      expect(tickManager.isPaused()).toBe(true);
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должен корректно работать полный игровой цикл', () => {
      // Начинаем с нормальной работы
      tickManager.update(0, 100); // 1 тик

      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.TickStarted, { time: 0, delta: 100 });
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, { delta: 100, ticksExecuted: 1 });

      // Ставим на паузу
      tickManager.pause();
      tickManager.update(100, 100); // На паузе не должно быть тиков

      // Проверяем что LogicTick не эмитился второй раз
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, { delta: 100, ticksExecuted: 1 });
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.TickStarted, { time: 100, delta: 100 });

      // Снимаем с паузы и меняем скорость
      tickManager.resume();
      const speedCallback = (mockEventBus.on as any).mock.calls.find(
        ([event]) => event === Events.SetGameSpeed
      )[1];
      speedCallback({ speed: 20 });

      // Очищаем моки для чистоты
      mockEventBus.emit.mockClear();

      // Следующее обновление должно работать с новой скоростью
      tickManager.update(200, 50); // 50ms при 20 тик/сек = 1 тик (50ms fixed step)
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, { delta: 50, ticksExecuted: 1 });
    });

    it('должен правильно обрабатывать несколько тиков в одном обновлении', () => {
      // Имитируем накопление времени для нескольких тиков
      const mockTickController = tickManager.getTickController();
      vi.spyOn(mockTickController, 'update').mockReturnValue(5);

      tickManager.update(1000, 500);

      // Должен эмитить только один LogicTick с ticksExecuted: 5
      expect(mockEventBus.emit).toHaveBeenCalledWith(Events.LogicTick, {
        delta: 100,
        ticksExecuted: 5,
      });

      // TimeService.tick() должен быть вызван 5 раз
      const timeService = tickManager.getTimeService();
      expect(timeService.getTick()).toBe(5);
    });

    it('должен корректно работать с событиями паузы через EventBus', () => {
      const pauseCallback = (mockEventBus.on as any).mock.calls.find(
        ([event]) => event === Events.GamePauseToggle
      )[1];

      // Имитируем клик по кнопке паузы
      pauseCallback();
      expect(tickManager.isPaused()).toBe(true);

      // Проверяем что тики не выполняются
      tickManager.update(100, 100);
      expect(mockEventBus.emit).not.toHaveBeenCalledWith(
        Events.LogicTick,
        expect.any(Object)
      );

      // Имитируем повторный клик (снятие паузы)
      pauseCallback();
      expect(tickManager.isPaused()).toBe(false);

      // Теперь тики должны выполняться
      tickManager.update(200, 100);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        Events.LogicTick,
        expect.objectContaining({ ticksExecuted: 1 })
      );
    });
  });
});
