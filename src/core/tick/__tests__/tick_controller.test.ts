import { describe, it, expect, beforeEach } from 'vitest';
import { TickController } from '../controllers/tick_controller';

/**
 * Тесты для TickController - контроллера fixed timestep логики
 */
describe('TickController', () => {
  let controller: TickController;

  beforeEach(() => {
    controller = new TickController();
  });

  describe('Инициализация', () => {
    it('должен инициализироваться с правильными начальными значениями', () => {
      expect(controller.getTickRate()).toBe(10);
      expect(controller.getFixedStepMs()).toBe(1000 / 10); // 100ms
      expect(controller.isPaused()).toBe(false);
    });

    it('должен позволять устанавливать начальную скорость тиков', () => {
      const customController = new TickController(20);
      expect(customController.getTickRate()).toBe(20);
      expect(customController.getFixedStepMs()).toBe(1000 / 20); // 50ms
    });
  });

  describe('update() - основной метод обновления', () => {
    it('должен возвращать 0 тиков когда на паузе', () => {
      controller.pause();
      expect(controller.update(100)).toBe(0);
      expect(controller.update(200)).toBe(0);
    });

    it('должен накапливать время в accumulator', () => {
      // Первый update с 50ms - меньше fixedStep (100ms)
      expect(controller.update(50)).toBe(0);

      // Второй update с 60ms - всего 110ms, должен выполниться 1 тик
      expect(controller.update(60)).toBe(1);

      // Остаток должен быть 10ms (110 - 100)
      // Следующий update с 90ms должен дать всего 100ms, т.е. 1 тик
      expect(controller.update(90)).toBe(1);
    });

    it('должен правильно рассчитывать количество тиков для выполнения', () => {
      // 250ms должно дать 2 тика (200ms) с остатком 50ms
      expect(controller.update(250)).toBe(2);

      // Следующие 50ms + остаток 50ms = 100ms = 1 тик
      expect(controller.update(50)).toBe(1);
    });

    it('должен ограничивать максимальное накопленное время', () => {
      // Попытка обновить с очень большим delta
      const result = controller.update(1000); // Больше maxAccumulatedMs (250ms)

      // Должен обработать только 250ms = 2 тика
      expect(result).toBe(2);
    });

    it('должен обрабатывать дробные delta значения', () => {
      // 16.67ms * 6 = 100ms = 1 тик
      expect(controller.update(16.67)).toBe(0);
      expect(controller.update(16.67)).toBe(0);
      expect(controller.update(16.67)).toBe(0);
      expect(controller.update(16.67)).toBe(0);
      expect(controller.update(16.67)).toBe(0);
      expect(controller.update(16.67)).toBe(1); // 100ms накоплено
    });
  });

  describe('setSpeed() - установка скорости', () => {
    it('должен устанавливать новую скорость тиков', () => {
      controller.setSpeed(20);
      expect(controller.getTickRate()).toBe(20);
      expect(controller.getFixedStepMs()).toBe(50); // 1000/20
    });

    it('должен рассчитывать правильный fixedStep для разных скоростей', () => {
      const testCases = [
        { speed: 10, expectedStep: 100 },
        { speed: 20, expectedStep: 50 },
        { speed: 60, expectedStep: 1000 / 60 }, // ~16.67
        { speed: 240, expectedStep: 1000 / 240 }, // ~4.17
      ];

      testCases.forEach(({ speed, expectedStep }) => {
        controller.setSpeed(speed);
        expect(controller.getFixedStepMs()).toBe(expectedStep);
      });
    });

    it('должен ставить на паузу при установке невалидной скорости', () => {
      controller.setSpeed(0);
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(-5);
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(NaN);
      expect(controller.isPaused()).toBe(true);
    });

    it('должен сбрасывать паузу при установке валидной скорости', () => {
      controller.pause();
      expect(controller.isPaused()).toBe(true);

      controller.setSpeed(15);
      expect(controller.isPaused()).toBe(false);
      expect(controller.getTickRate()).toBe(15);
    });
  });

  describe('Управление паузой', () => {
    describe('pause()', () => {
      it('должен ставить контроллер на паузу', () => {
        expect(controller.isPaused()).toBe(false);
        controller.pause();
        expect(controller.isPaused()).toBe(true);
      });
    });

    describe('resume()', () => {
      it('должен снимать паузу с контроллера', () => {
        controller.pause();
        expect(controller.isPaused()).toBe(true);

        controller.resume();
        expect(controller.isPaused()).toBe(false);
      });
    });

    describe('togglePause()', () => {
      it('должен переключать состояние паузы', () => {
        expect(controller.isPaused()).toBe(false);

        controller.togglePause();
        expect(controller.isPaused()).toBe(true);

        controller.togglePause();
        expect(controller.isPaused()).toBe(false);

        controller.togglePause();
        expect(controller.isPaused()).toBe(true);
      });
    });
  });

  describe('Геттеры', () => {
    describe('getFixedStepMs()', () => {
      it('должен возвращать текущий fixed step в миллисекундах', () => {
        expect(controller.getFixedStepMs()).toBe(100);

        controller.setSpeed(20);
        expect(controller.getFixedStepMs()).toBe(50);
      });
    });

    describe('getTickRate()', () => {
      it('должен возвращать текущую скорость тиков', () => {
        expect(controller.getTickRate()).toBe(10);

        controller.setSpeed(30);
        expect(controller.getTickRate()).toBe(30);
      });
    });

    describe('isPaused()', () => {
      it('должен возвращать текущее состояние паузы', () => {
        expect(controller.isPaused()).toBe(false);

        controller.pause();
        expect(controller.isPaused()).toBe(true);

        controller.resume();
        expect(controller.isPaused()).toBe(false);
      });
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должен корректно работать полный цикл: пауза -> обновление -> возобновление', () => {
      // Накапливаем время
      controller.update(50);
      controller.pause();

      // На паузе обновление не должно давать тики
      expect(controller.update(100)).toBe(0);

      // После возобновления должен выполнить накопленные тики
      controller.resume();
      expect(controller.update(60)).toBe(1); // 50 + 60 = 110ms = 1 тик
    });

    it('должен корректно обрабатывать смену скорости во время накопления', () => {
      // Накапливаем 50ms
      controller.update(50);

      // Меняем скорость с 10 на 20 тик/сек (fixedStep: 100ms -> 50ms)
      controller.setSpeed(20);

      // Теперь 50ms накопленного времени должно хватить на 1 тик
      expect(controller.update(10)).toBe(1); // 50 + 10 = 60ms > 50ms
    });

    it('должен правильно работать с очень маленькими delta', () => {
      let totalTicks = 0;

      // Много маленьких обновлений
      for (let i = 0; i < 100; i++) {
        totalTicks += controller.update(1); // 1ms каждое обновление
      }

      // 100 * 1ms = 100ms = 1 тик
      expect(totalTicks).toBe(1);
    });

    it('должен правильно работать с очень большими delta', () => {
      // Большой delta должен быть ограничен maxAccumulatedMs
      const ticks = controller.update(1000); // Больше 250ms лимита

      // Должен выполнить только 2 тика (200ms из 250ms)
      expect(ticks).toBe(2);

      // Остаток должен позволить выполнить еще тики
      const moreTicks = controller.update(60); // 50ms остаток + 60ms = 110ms = 1 тик
      expect(moreTicks).toBe(1);
    });
  });
});
