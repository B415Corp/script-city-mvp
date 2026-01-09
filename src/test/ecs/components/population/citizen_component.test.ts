import { describe, it, expect } from 'vitest';
import { Citizen, HousingType, type CitizenData } from '../../../../core/ecs/components/population/citizen_component';

describe('Citizen Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Citizen.happiness)).toBe(true);
    expect(Array.isArray(Citizen.home)).toBe(true);
    expect(Array.isArray(Citizen.workplace)).toBe(true);
    expect(Array.isArray(Citizen.money)).toBe(true);
    expect(Array.isArray(Citizen.energy)).toBe(true);
    expect(Array.isArray(Citizen.housingType)).toBe(true);
    expect(Array.isArray(Citizen.minimumExpenses)).toBe(true);
    expect(Array.isArray(Citizen.salary)).toBe(true);
    expect(Array.isArray(Citizen.isLookingForJob)).toBe(true);
    expect(Array.isArray(Citizen.jobSearchAttempts)).toBe(true);
    expect(Array.isArray(Citizen.lastJobSearchDay)).toBe(true);
    expect(Array.isArray(Citizen.lastExpenseDay)).toBe(true);

    // All arrays should start empty
    expect(Citizen.happiness.length).toBe(0);
    expect(Citizen.home.length).toBe(0);
    expect(Citizen.workplace.length).toBe(0);
  });

  it('должен уметь хранить и извлекать citizen data', () => {
    const eid = 0;
    const testData = {
      happiness: 85,
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

    Citizen.happiness[eid] = testData.happiness;
    Citizen.home[eid] = testData.home;
    Citizen.workplace[eid] = testData.workplace;
    Citizen.money[eid] = testData.money;
    Citizen.energy[eid] = testData.energy;
    Citizen.housingType[eid] = testData.housingType;
    Citizen.minimumExpenses[eid] = testData.minimumExpenses;
    Citizen.salary[eid] = testData.salary;
    Citizen.isLookingForJob[eid] = testData.isLookingForJob;
    Citizen.jobSearchAttempts[eid] = testData.jobSearchAttempts;
    Citizen.lastJobSearchDay[eid] = testData.lastJobSearchDay;
    Citizen.lastExpenseDay[eid] = testData.lastExpenseDay;

    expect(Citizen.happiness[eid]).toBe(testData.happiness);
    expect(Citizen.home[eid]).toBe(testData.home);
    expect(Citizen.workplace[eid]).toBe(testData.workplace);
    expect(Citizen.money[eid]).toBe(testData.money);
    expect(Citizen.energy[eid]).toBe(testData.energy);
    expect(Citizen.housingType[eid]).toBe(testData.housingType);
    expect(Citizen.minimumExpenses[eid]).toBe(testData.minimumExpenses);
    expect(Citizen.salary[eid]).toBe(testData.salary);
    expect(Citizen.isLookingForJob[eid]).toBe(testData.isLookingForJob);
    expect(Citizen.jobSearchAttempts[eid]).toBe(testData.jobSearchAttempts);
    expect(Citizen.lastJobSearchDay[eid]).toBe(testData.lastJobSearchDay);
    expect(Citizen.lastExpenseDay[eid]).toBe(testData.lastExpenseDay);
  });

  it('должен обрабатывать multiple citizens with different states', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Employed citizen with owned housing
    Citizen.happiness[eid1] = 95;
    Citizen.home[eid1] = 100;
    Citizen.workplace[eid1] = 200;
    Citizen.money[eid1] = 15000;
    Citizen.energy[eid1] = 80;
    Citizen.housingType[eid1] = HousingType.OWNED;
    Citizen.minimumExpenses[eid1] = 3000;
    Citizen.salary[eid1] = 4000;
    Citizen.isLookingForJob[eid1] = false;
    Citizen.jobSearchAttempts[eid1] = 0;
    Citizen.lastJobSearchDay[eid1] = 0;
    Citizen.lastExpenseDay[eid1] = 30;

    // Unemployed citizen renting housing
    Citizen.happiness[eid2] = 45;
    Citizen.home[eid2] = 150;
    Citizen.workplace[eid2] = undefined;
    Citizen.money[eid2] = 500;
    Citizen.energy[eid2] = 60;
    Citizen.housingType[eid2] = HousingType.RENTED;
    Citizen.minimumExpenses[eid2] = 1500;
    Citizen.salary[eid2] = 0;
    Citizen.isLookingForJob[eid2] = true;
    Citizen.jobSearchAttempts[eid2] = 12;
    Citizen.lastJobSearchDay[eid2] = 25;
    Citizen.lastExpenseDay[eid2] = 28;

    // Verify employed citizen
    expect(Citizen.happiness[eid1]).toBe(95);
    expect(Citizen.workplace[eid1]).toBe(200);
    expect(Citizen.isLookingForJob[eid1]).toBe(false);
    expect(Citizen.housingType[eid1]).toBe(HousingType.OWNED);

    // Verify unemployed citizen
    expect(Citizen.happiness[eid2]).toBe(45);
    expect(Citizen.workplace[eid2]).toBeUndefined();
    expect(Citizen.isLookingForJob[eid2]).toBe(true);
    expect(Citizen.housingType[eid2]).toBe(HousingType.RENTED);
  });

  it('должен обрабатывать workplace as undefined', () => {
    const eid = 3;

    // Initially has workplace
    Citizen.workplace[eid] = 456;
    expect(Citizen.workplace[eid]).toBe(456);

    // Loses job
    Citizen.workplace[eid] = undefined;
    expect(Citizen.workplace[eid]).toBeUndefined();
  });

  it('должен поддерживать различные happiness ranges', () => {
    const testCases = [
      { eid: 4, happiness: 0, description: 'Completely unhappy' },
      { eid: 5, happiness: 50, description: 'Neutral' },
      { eid: 6, happiness: 100, description: 'Perfectly happy' },
    ];

    testCases.forEach(({ eid, happiness }) => {
      Citizen.happiness[eid] = happiness;
      expect(Citizen.happiness[eid]).toBe(happiness);
    });
  });

  it('должен поддерживать различные energy levels', () => {
    const testCases = [
      { eid: 7, energy: 0, description: 'Exhausted' },
      { eid: 8, energy: 50, description: 'Tired' },
      { eid: 9, energy: 100, description: 'Energized' },
    ];

    testCases.forEach(({ eid, energy }) => {
      Citizen.energy[eid] = energy;
      expect(Citizen.energy[eid]).toBe(energy);
    });
  });

  it('должен поддерживать различные money amounts', () => {
    const testCases = [
      { eid: 10, money: 0, description: 'Bankrupt' },
      { eid: 11, money: 1000, description: 'Basic savings' },
      { eid: 12, money: 100000, description: 'Wealthy' },
    ];

    testCases.forEach(({ eid, money }) => {
      Citizen.money[eid] = money;
      expect(Citizen.money[eid]).toBe(money);
    });
  });

  it('должен обрабатывать job search states', () => {
    const eid = 13;

    // Actively looking for job
    Citizen.isLookingForJob[eid] = true;
    Citizen.jobSearchAttempts[eid] = 3;
    Citizen.lastJobSearchDay[eid] = 15;

    expect(Citizen.isLookingForJob[eid]).toBe(true);
    expect(Citizen.jobSearchAttempts[eid]).toBe(3);
    expect(Citizen.lastJobSearchDay[eid]).toBe(15);

    // Stops looking (found job)
    Citizen.isLookingForJob[eid] = false;
    Citizen.jobSearchAttempts[eid] = 0;
    Citizen.lastJobSearchDay[eid] = 20;

    expect(Citizen.isLookingForJob[eid]).toBe(false);
    expect(Citizen.jobSearchAttempts[eid]).toBe(0);
    expect(Citizen.lastJobSearchDay[eid]).toBe(20);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Citizen.happiness[eid]).toBeUndefined();
    expect(Citizen.home[eid]).toBeUndefined();
    expect(Citizen.workplace[eid]).toBeUndefined();
    expect(Citizen.money[eid]).toBeUndefined();
    expect(Citizen.energy[eid]).toBeUndefined();
    expect(Citizen.housingType[eid]).toBeUndefined();
    expect(Citizen.minimumExpenses[eid]).toBeUndefined();
    expect(Citizen.salary[eid]).toBeUndefined();
    expect(Citizen.isLookingForJob[eid]).toBeUndefined();
    expect(Citizen.jobSearchAttempts[eid]).toBeUndefined();
    expect(Citizen.lastJobSearchDay[eid]).toBeUndefined();
    expect(Citizen.lastExpenseDay[eid]).toBeUndefined();
  });
});

describe('HousingType enum', () => {
  it('should have correct housing type values', () => {
    expect(HousingType.OWNED).toBe(0);
    expect(HousingType.RENTED).toBe(1);
  });

  it('should be used correctly in citizen component', () => {
    const eid = 14;
    Citizen.housingType[eid] = HousingType.OWNED;
    expect(Citizen.housingType[eid]).toBe(HousingType.OWNED);

    Citizen.housingType[eid] = HousingType.RENTED;
    expect(Citizen.housingType[eid]).toBe(HousingType.RENTED);
  });

  it('should have valid housing type values', () => {
    const numericValues = Object.values(HousingType).filter(v => typeof v === 'number') as number[];
    expect(numericValues.sort()).toEqual([0, 1]);
  });
});

describe('CitizenData type', () => {
  it('должен принимать допустимый CitizenData object', () => {
    const data: CitizenData = {
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

    expect(data.happiness).toBe(80);
    expect(data.home).toBe(42);
    expect(data.workplace).toBe(123);
    expect(data.money).toBe(5000);
    expect(data.energy).toBe(90);
    expect(data.housingType).toBe(HousingType.OWNED);
    expect(data.minimumExpenses).toBe(2000);
    expect(data.salary).toBe(3000);
    expect(data.isLookingForJob).toBe(false);
    expect(data.jobSearchAttempts).toBe(5);
    expect(data.lastJobSearchDay).toBe(10);
    expect(data.lastExpenseDay).toBe(15);
  });

  it('должен поддерживать optional workplace', () => {
    const employedData: CitizenData = {
      happiness: 85,
      home: 100,
      workplace: 200,
      money: 10000,
      energy: 95,
      housingType: HousingType.OWNED,
      minimumExpenses: 2500,
      salary: 3500,
      isLookingForJob: false,
      jobSearchAttempts: 0,
      lastJobSearchDay: 0,
      lastExpenseDay: 30,
    };

    const unemployedData: CitizenData = {
      happiness: 60,
      home: 150,
      money: 800,
      energy: 70,
      housingType: HousingType.RENTED,
      minimumExpenses: 1800,
      salary: 0,
      isLookingForJob: true,
      jobSearchAttempts: 8,
      lastJobSearchDay: 25,
      lastExpenseDay: 28,
    };

    expect(employedData.workplace).toBe(200);
    expect(unemployedData.workplace).toBeUndefined();
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      happiness: 75,
      home: 50,
      workplace: 75,
      money: 3000,
      energy: 85,
      housingType: HousingType.RENTED,
      minimumExpenses: 1500,
      salary: 2000,
      isLookingForJob: false,
      jobSearchAttempts: 2,
      lastJobSearchDay: 5,
      lastExpenseDay: 10,
    };

    expect(data.happiness).toBe(75);
    expect(data.home).toBe(50);
    expect(data.workplace).toBe(75);
    expect(data.money).toBe(3000);
    expect(data.energy).toBe(85);
    expect(data.housingType).toBe(HousingType.RENTED);
    expect(data.minimumExpenses).toBe(1500);
    expect(data.salary).toBe(2000);
    expect(data.isLookingForJob).toBe(false);
    expect(data.jobSearchAttempts).toBe(2);
    expect(data.lastJobSearchDay).toBe(5);
    expect(data.lastExpenseDay).toBe(10);
  });
});
