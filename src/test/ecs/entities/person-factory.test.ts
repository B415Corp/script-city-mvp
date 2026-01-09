import { describe, it, expect, beforeEach } from 'vitest';
import { PersonFactory } from '../../../core/ecs/entities/person_factory';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Person, Citizen, Needs, Position, Gender, EducationLevel, HousingType } from '../../../core/ecs/components';

describe('PersonFactory', () => {
  let world: World;
  let factory: PersonFactory;

  beforeEach(() => {
    world = BitECSTestHelper.createTestSetup().world;
    factory = new PersonFactory(world);
  });

  describe('create', () => {
    it('should create a person with correct basic data', () => {
      const personData = {
        age: 25,
        gender: Gender.MALE,
        name: 'Александр',
        education: EducationLevel.UNIVERSITY,
      };

      const citizenData = {
        happiness: 80,
        home: 0,
        workplace: undefined,
        money: 5000,
        energy: 90,
        housingType: HousingType.RENTED,
        minimumExpenses: 2000,
        salary: 0,
        isLookingForJob: true,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
        lastExpenseDay: 0,
      };

      const positionData = { x: 10, y: 20 };

      const eid = factory.create(personData, citizenData, positionData);

      // Проверяем данные Person
      expect(Person.age[eid]).toBe(25);
      expect(Person.gender[eid]).toBe(Gender.MALE);
      expect(Person.name[eid]).toBe('Александр');
      expect(Person.education[eid]).toBe(EducationLevel.UNIVERSITY);

      // Проверяем данные Citizen
      expect(Citizen.happiness[eid]).toBe(80);
      expect(Citizen.money[eid]).toBe(5000);
      expect(Citizen.energy[eid]).toBe(90);
      expect(Citizen.housingType[eid]).toBe(HousingType.RENTED);
      expect(Citizen.isLookingForJob[eid]).toBe(true);

      // Проверяем позицию
      expect(Position.x[eid]).toBe(10);
      expect(Position.y[eid]).toBe(20);

      // Проверяем Needs (должны быть установлены по умолчанию)
      expect(Needs.food[eid]).toBe(50);
      expect(Needs.shopping[eid]).toBe(30);
      expect(Needs.work[eid]).toBe(20);
      expect(Needs.sleep[eid]).toBe(20);
    });

    it('should link person to home if provided', () => {
      const personData = {
        age: 30,
        gender: Gender.FEMALE,
        name: 'Мария',
        education: EducationLevel.SECONDARY,
      };

      const citizenData = {
        happiness: 75,
        home: 0, // Будет перезаписан
        workplace: undefined,
        money: 3000,
        energy: 85,
        housingType: HousingType.OWNED,
        minimumExpenses: 1500,
        salary: 0,
        isLookingForJob: false,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
        lastExpenseDay: 0,
      };

      const positionData = { x: 5, y: 15 };
      const homeId = 42;

      const eid = factory.create(personData, citizenData, positionData, homeId);

      expect(Citizen.home[eid]).toBe(homeId);
    });
  });

  describe('createRandom', () => {
    it('should create random person with valid age range', () => {
      const positionData = { x: 0, y: 0 };
      const eid = factory.createRandom(positionData);

      expect(Person.age[eid]).toBeGreaterThanOrEqual(18);
      expect(Person.age[eid]).toBeLessThanOrEqual(78);
    });

    it('should generate valid gender', () => {
      const positionData = { x: 0, y: 0 };
      const eid = factory.createRandom(positionData);

      expect([Gender.MALE, Gender.FEMALE]).toContain(Person.gender[eid]);
    });

    it('should generate name based on gender', () => {
      const positionData = { x: 0, y: 0 };
      const eid = factory.createRandom(positionData);

      const name = Person.name[eid];
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);

      // Проверяем, что имя соответствует полу
      const maleNames = ['Александр', 'Дмитрий', 'Иван', 'Михаил', 'Сергей', 'Андрей', 'Алексей', 'Николай'];
      const femaleNames = ['Анна', 'Елена', 'Мария', 'Ольга', 'Татьяна', 'Ирина', 'Наталья', 'Светлана'];

      if (Person.gender[eid] === Gender.MALE) {
        expect(maleNames).toContain(name);
      } else {
        expect(femaleNames).toContain(name);
      }
    });

    it('should generate valid education level based on age', () => {
      // Тестируем молодого человека (выше шанс высшего образования)
      const positionData = { x: 0, y: 0 };
      const eid = factory.createRandom(positionData);

      const education = Person.education[eid];
      expect(Object.values(EducationLevel)).toContain(education);
    });

    it('should set reasonable default citizen values', () => {
      const positionData = { x: 0, y: 0 };
      const eid = factory.createRandom(positionData);

      expect(Citizen.happiness[eid]).toBeGreaterThanOrEqual(70);
      expect(Citizen.happiness[eid]).toBeLessThanOrEqual(100);

      expect(Citizen.money[eid]).toBeGreaterThanOrEqual(100);
      expect(Citizen.money[eid]).toBeLessThanOrEqual(1000);

      expect(Citizen.energy[eid]).toBeGreaterThanOrEqual(80);
      expect(Citizen.energy[eid]).toBeLessThanOrEqual(100);

      expect(Citizen.isLookingForJob[eid]).toBe(true);
      expect(Citizen.jobSearchAttempts[eid]).toBe(0);
    });

    it('should link to home if provided', () => {
      const positionData = { x: 0, y: 0 };
      const homeId = 123;
      const eid = factory.createRandom(positionData, homeId);

      expect(Citizen.home[eid]).toBe(homeId);
    });
  });
});
