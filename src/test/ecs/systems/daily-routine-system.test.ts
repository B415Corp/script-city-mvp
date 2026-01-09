import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyRoutineSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Person, Citizen, Needs } from '../../../core/ecs/components';

describe('Система суточных рутин (DailyRoutineSystem)', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(2));
  });

  describe('базовая функциональность', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(DailyRoutineSystem).toBeDefined();
      expect(DailyRoutineSystem.name).toBe('DailyRoutine');
      expect(DailyRoutineSystem.components).toEqual(['Person', 'Citizen', 'Needs']);
      expect(typeof DailyRoutineSystem.update).toBe('function');
    });

    it('должен обрабатывать пустой список сущностей', () => {
      expect(() => {
        DailyRoutineSystem.update(world, [], 1, 480); // 8:00
      }).not.toThrow();
    });
  });

  describe('управление энергией и потребностями сна', () => {
    it('должен восстанавливать энергию ночью при высокой потребности сна', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем начальные значения
      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 80 });

      // Ночь (23:00)
      const gameTime = 23 * 60; // 23:00 в минутах

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      // Энергия должна увеличиться, потребность сна уменьшиться
      expect(Citizen.energy[eid]).toBe(52); // 50 + 1 * 2
      expect(Needs.sleep[eid]).toBe(77); // 80 - 1 * 3
    });

    it('не должен восстанавливать энергию ночью при низкой потребности сна', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем начальные значения
      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 30 }); // Ниже 50

      // Ночь (23:00)
      const gameTime = 23 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      // Энергия и потребность сна не должны измениться
      expect(Citizen.energy[eid]).toBe(50);
      expect(Needs.sleep[eid]).toBe(30);
    });

    it('должен тратить энергию днем', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем начальные значения
      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 20 });

      // День (12:00)
      const gameTime = 12 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      // Энергия должна уменьшиться, потребность сна увеличиться
      expect(Citizen.energy[eid]).toBe(49.5); // 50 - 1 * 0.5
      expect(Needs.sleep[eid]).toBe(20.3); // 20 + 1 * 0.3
    });

    it('должен ограничивать энергию максимальным значением 100', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 99 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 80 });

      // Ночь
      const gameTime = 23 * 60;

      DailyRoutineSystem.update(world, [eid], 5, gameTime); // Большой delta

      expect(Citizen.energy[eid]).toBe(100); // Не больше 100
    });

    it('должен ограничивать энергию минимальным значением 0', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 1 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 20 });

      // День
      const gameTime = 12 * 60;

      DailyRoutineSystem.update(world, [eid], 5, gameTime); // Большой delta

      expect(Citizen.energy[eid]).toBe(0); // Не меньше 0
    });
  });

  describe('генерация действий по времени суток', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('должен генерировать завтрак утром при высоком голоде', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setNeedsData(eid, { food: 80 }); // Высокий голод

      // Утро (7:00)
      const gameTime = 7 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).toHaveBeenCalledWith(`Citizen ${eid} is having breakfast`);
      expect(Needs.food[eid]).toBe(40); // 80 - 40
    });

    it('не должен генерировать завтрак утром при низком голоде', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setNeedsData(eid, { food: 40 }); // Низкий голод

      // Утро (7:00)
      const gameTime = 7 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).not.toHaveBeenCalledWith(`Citizen ${eid} is having breakfast`);
      expect(Needs.food[eid]).toBe(40); // Не изменился
    });

    it('должен генерировать работу днем при наличии работы и энергии', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      BitECSTestHelper.setCitizenData(eid, {
        workplace: workplaceEid,
        energy: 50 // Выше 20
      });

      // День (14:00)
      const gameTime = 14 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).toHaveBeenCalledWith(`Citizen ${eid} is working`);
    });

    it('не должен генерировать работу днем без достаточной энергии', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      BitECSTestHelper.setCitizenData(eid, {
        workplace: workplaceEid,
        energy: 10 // Ниже 20
      });

      // День (14:00)
      const gameTime = 14 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).not.toHaveBeenCalledWith(`Citizen ${eid} is working`);
    });

    it('должен генерировать покупки вечером при высоких покупательских потребностях', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setNeedsData(eid, { shopping: 80 }); // Высокие потребности

      // Вечер (20:00)
      const gameTime = 20 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).toHaveBeenCalledWith(`Citizen ${eid} is shopping`);
      expect(Needs.shopping[eid]).toBe(30); // 80 - 50
    });

    it('не должен генерировать покупки вечером при низких потребностях', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setNeedsData(eid, { shopping: 40 }); // Низкие потребности

      // Вечер (20:00)
      const gameTime = 20 * 60;

      DailyRoutineSystem.update(world, [eid], 1, gameTime);

      expect(consoleSpy).not.toHaveBeenCalledWith(`Citizen ${eid} is shopping`);
      expect(Needs.shopping[eid]).toBe(40); // Не изменился
    });
  });

  describe('обработка нескольких сущностей', () => {
    it('должен корректно обрабатывать несколько жителей одновременно', () => {
      const eid1 = BitECSTestHelper.createCitizenEntity(world);
      const eid2 = BitECSTestHelper.createCitizenEntity(world);

      // Разные начальные состояния
      BitECSTestHelper.setCitizenData(eid1, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid1, { sleep: 80 });

      BitECSTestHelper.setCitizenData(eid2, { energy: 30 });
      BitECSTestHelper.setNeedsData(eid2, { sleep: 20 });

      // Ночь
      const gameTime = 23 * 60;

      DailyRoutineSystem.update(world, [eid1, eid2], 1, gameTime);

      // Первый житель должен восстановить энергию (высокая потребность сна)
      expect(Citizen.energy[eid1]).toBe(52);
      expect(Needs.sleep[eid1]).toBe(77);

      // Второй житель не должен (низкая потребность сна)
      expect(Citizen.energy[eid2]).toBe(30);
      expect(Needs.sleep[eid2]).toBe(20);
    });
  });

  describe('обработка различных значений времени', () => {
    it('должен использовать время по умолчанию при отсутствии gameTime', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 20 });

      DailyRoutineSystem.update(world, [eid], 1, undefined);

      // Должен использовать 8:00 (день), тратить энергию
      expect(Citizen.energy[eid]).toBe(49.5);
      expect(Needs.sleep[eid]).toBe(20.3);
    });

    it('должен корректно обрабатывать различные значения delta', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { sleep: 20 });

      // День
      const gameTime = 12 * 60;

      DailyRoutineSystem.update(world, [eid], 2, gameTime);

      // Энергия должна уменьшиться в 2 раза больше
      expect(Citizen.energy[eid]).toBe(49); // 50 - 2 * 0.5
      expect(Needs.sleep[eid]).toBe(20.6); // 20 + 2 * 0.3
    });
  });
});
