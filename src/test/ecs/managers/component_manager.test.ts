import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentManager } from '../../../core/ecs/components/managers/component_manager';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { EducationLevel, Gender, HousingType } from '../../../core/ecs/components';

describe('ComponentManager', () => {
  let componentManager: ComponentManager;
  let world: any;
  let eid: number;

  beforeEach(() => {
    const setup = BitECSTestHelper.createTestSetup();
    world = setup.world;
    componentManager = new ComponentManager(world);
    eid = setup.entities[0];
  });

  describe('Person component', () => {
    it('должен получать данные человека по умолчанию для пустой сущности', () => {
      const person = componentManager.getPerson(eid);
      expect(person).toEqual({
        age: 0,
        gender: 0,
        name: '',
        education: 0,
      });
    });

    it('должен устанавливать и получать данные человека', () => {
      const personData = {
        age: 25,
        gender: Gender.MALE,
        name: 'Александр',
        education: EducationLevel.UNIVERSITY,
      };

      componentManager.setPerson(eid, personData);
      const retrieved = componentManager.getPerson(eid);

      expect(retrieved).toEqual(personData);
    });

    it('должен частично обновлять данные человека', () => {
      componentManager.setPerson(eid, { age: 30, name: 'Тест' });
      componentManager.setPerson(eid, { age: 35 }); // Обновляем только возраст

      const person = componentManager.getPerson(eid);
      expect(person.age).toBe(35);
      expect(person.name).toBe('Тест');
      expect(person.gender).toBe(0); // Не изменилось
    });
  });

  describe('Citizen component', () => {
    it('должен получать данные жителя по умолчанию для пустой сущности', () => {
      const citizen = componentManager.getCitizen(eid);
      expect(citizen).toEqual({
        happiness: 0,
        home: 0,
        workplace: 0,
        money: 0,
        energy: 0,
        housingType: 0,
        minimumExpenses: 0,
        salary: 0,
        isLookingForJob: false,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
        lastExpenseDay: 0,
      });
    });

    it('должен устанавливать и получать данные жителя', () => {
      const citizenData = {
        happiness: 80,
        home: 42,
        workplace: 123,
        money: 5000,
        energy: 90,
        housingType: HousingType.OWNED,
        minimumExpenses: 2000,
        salary: 3000,
        isLookingForJob: false,
        jobSearchAttempts: 5,
        lastJobSearchDay: 10,
        lastExpenseDay: 15,
      };

      componentManager.setCitizen(eid, citizenData);
      const retrieved = componentManager.getCitizen(eid);

      expect(retrieved).toEqual(citizenData);
    });

    it('should partially update citizen data', () => {
      componentManager.setCitizen(eid, { money: 1000, happiness: 50 });
      componentManager.setCitizen(eid, { money: 2000 }); // Обновляем только деньги

      const citizen = componentManager.getCitizen(eid);
      expect(citizen.money).toBe(2000);
      expect(citizen.happiness).toBe(50);
      expect(citizen.energy).toBe(0); // Не изменилось
    });
  });

  describe('Needs component', () => {
    it('должен получать данные потребностей по умолчанию для пустой сущности', () => {
      const needs = componentManager.getNeeds(eid);
      expect(needs).toEqual({
        food: 0,
        shopping: 0,
        work: 0,
        sleep: 0,
      });
    });

    it('должен устанавливать и получать данные потребностей', () => {
      const needsData = {
        food: 75,
        shopping: 45,
        work: 30,
        sleep: 60,
      };

      componentManager.setNeeds(eid, needsData);
      const retrieved = componentManager.getNeeds(eid);

      expect(retrieved).toEqual(needsData);
    });

    it('should partially update needs data', () => {
      componentManager.setNeeds(eid, { food: 50, work: 20 });
      componentManager.setNeeds(eid, { food: 80 }); // Обновляем только еду

      const needs = componentManager.getNeeds(eid);
      expect(needs.food).toBe(80);
      expect(needs.work).toBe(20);
      expect(needs.shopping).toBe(0); // Не изменилось
    });
  });

  describe('Position component', () => {
    it('должен получать данные позиции по умолчанию для пустой сущности', () => {
      const position = componentManager.getPosition(eid);
      expect(position).toEqual({
        x: 0,
        y: 0,
      });
    });

    it('должен устанавливать и получать данные позиции', () => {
      const positionData = {
        x: 10.5,
        y: 20.3,
      };

      componentManager.setPosition(eid, positionData);
      const retrieved = componentManager.getPosition(eid);

      expect(retrieved).toEqual(positionData);
    });

    it('should partially update position data', () => {
      componentManager.setPosition(eid, { x: 5, y: 10 });
      componentManager.setPosition(eid, { x: 15 }); // Обновляем только X

      const position = componentManager.getPosition(eid);
      expect(position.x).toBe(15);
      expect(position.y).toBe(10);
    });
  });

  describe('Prices component', () => {
    it('should get default prices data for empty entity', () => {
      const prices = componentManager.getPrices(eid);
      expect(prices).toEqual({
        rentPrice: 0,
        foodPrice: 0,
        lastUpdateDay: 0,
      });
    });

    it('should set and get prices data', () => {
      const pricesData = {
        rentPrice: 1500,
        foodPrice: 200,
        lastUpdateDay: 30,
      };

      componentManager.setPrices(eid, pricesData);
      const retrieved = componentManager.getPrices(eid);

      expect(retrieved).toEqual(pricesData);
    });

    it('should partially update prices data', () => {
      componentManager.setPrices(eid, { rentPrice: 1000, foodPrice: 150 });
      componentManager.setPrices(eid, { rentPrice: 1200 }); // Обновляем только аренду

      const prices = componentManager.getPrices(eid);
      expect(prices.rentPrice).toBe(1200);
      expect(prices.foodPrice).toBe(150);
      expect(prices.lastUpdateDay).toBe(0); // Не изменилось
    });
  });

  describe('Workplace component', () => {
    it('should get default workplace data for empty entity', () => {
      const workplace = componentManager.getWorkplace(eid);
      expect(workplace).toEqual({
        jobType: '',
        salary: 0,
        worker: undefined,
        building: 0,
        minEducationLevel: 0,
      });
    });

    it('should set and get workplace data', () => {
      const workplaceData = {
        jobType: 'Программист',
        salary: 5000,
        worker: 123,
        building: 456,
        minEducationLevel: EducationLevel.UNIVERSITY,
      };

      componentManager.setWorkplace(eid, workplaceData);
      const retrieved = componentManager.getWorkplace(eid);

      expect(retrieved).toEqual(workplaceData);
    });

    it('should partially update workplace data', () => {
      componentManager.setWorkplace(eid, { salary: 3000, jobType: 'Уборщик' });
      componentManager.setWorkplace(eid, { salary: 4000 }); // Обновляем только зарплату

      const workplace = componentManager.getWorkplace(eid);
      expect(workplace.salary).toBe(4000);
      expect(workplace.jobType).toBe('Уборщик');
      expect(workplace.worker).toBeUndefined(); // Не изменилось
    });
  });

  describe('utility methods', () => {
    it('should correctly determine employment status', () => {
      // По умолчанию не работает
      expect(componentManager.isEmployed(eid)).toBe(false);
      expect(componentManager.isUnemployed(eid)).toBe(true);

      // Устанавливаем работу
      componentManager.setCitizen(eid, { workplace: 123 });
      expect(componentManager.isEmployed(eid)).toBe(true);
      expect(componentManager.isUnemployed(eid)).toBe(false);

      // Убираем работу
      componentManager.setCitizen(eid, { workplace: 0 });
      expect(componentManager.isEmployed(eid)).toBe(false);
      expect(componentManager.isUnemployed(eid)).toBe(true);
    });

    it('should check if citizen can afford job', () => {
      componentManager.setCitizen(eid, { minimumExpenses: 2000 });

      expect(componentManager.canAffordJob(eid, 1500)).toBe(false); // Ниже минимума
      expect(componentManager.canAffordJob(eid, 2000)).toBe(true);  // Равно минимуму
      expect(componentManager.canAffordJob(eid, 2500)).toBe(true);  // Выше минимума
    });

    it('should check education requirements', () => {
      componentManager.setPerson(eid, { education: EducationLevel.SECONDARY });

      expect(componentManager.meetsEducationRequirement(eid, EducationLevel.PRIMARY)).toBe(true);
      expect(componentManager.meetsEducationRequirement(eid, EducationLevel.SECONDARY)).toBe(true);
      expect(componentManager.meetsEducationRequirement(eid, EducationLevel.UNIVERSITY)).toBe(false);
    });
  });
});
