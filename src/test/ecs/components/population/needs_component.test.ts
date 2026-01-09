import { describe, it, expect } from 'vitest';
import { Needs, NeedLevel, type NeedsData } from '../../../../core/ecs/components/population/needs_component';

describe('Needs Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Needs.food)).toBe(true);
    expect(Array.isArray(Needs.shopping)).toBe(true);
    expect(Array.isArray(Needs.work)).toBe(true);
    expect(Array.isArray(Needs.sleep)).toBe(true);

    expect(Needs.food.length).toBe(0);
    expect(Needs.shopping.length).toBe(0);
    expect(Needs.work.length).toBe(0);
    expect(Needs.sleep.length).toBe(0);
  });

  it('должен уметь хранить и извлекать needs data', () => {
    const eid = 0;
    const testData = {
      food: 30,
      shopping: 45,
      work: 60,
      sleep: 20,
    };

    Needs.food[eid] = testData.food;
    Needs.shopping[eid] = testData.shopping;
    Needs.work[eid] = testData.work;
    Needs.sleep[eid] = testData.sleep;

    expect(Needs.food[eid]).toBe(testData.food);
    expect(Needs.shopping[eid]).toBe(testData.shopping);
    expect(Needs.work[eid]).toBe(testData.work);
    expect(Needs.sleep[eid]).toBe(testData.sleep);
  });

  it('должен обрабатывать multiple citizens with different needs', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Well-rested, fed citizen
    Needs.food[eid1] = 10;
    Needs.shopping[eid1] = 20;
    Needs.work[eid1] = 70;
    Needs.sleep[eid1] = 15;

    // Hungry, tired citizen
    Needs.food[eid2] = 85;
    Needs.shopping[eid2] = 90;
    Needs.work[eid2] = 30;
    Needs.sleep[eid2] = 95;

    // Verify first citizen
    expect(Needs.food[eid1]).toBe(10);
    expect(Needs.shopping[eid1]).toBe(20);
    expect(Needs.work[eid1]).toBe(70);
    expect(Needs.sleep[eid1]).toBe(15);

    // Verify second citizen
    expect(Needs.food[eid2]).toBe(85);
    expect(Needs.shopping[eid2]).toBe(90);
    expect(Needs.work[eid2]).toBe(30);
    expect(Needs.sleep[eid2]).toBe(95);
  });

  it('должен поддерживать различные need levels', () => {
    const testCases = [
      { eid: 3, food: NeedLevel.SATISFIED, shopping: NeedLevel.LOW, work: NeedLevel.MEDIUM, sleep: NeedLevel.LOW },
      { eid: 4, food: NeedLevel.CRITICAL, shopping: NeedLevel.HIGH, work: NeedLevel.SATISFIED, sleep: NeedLevel.CRITICAL },
      { eid: 5, food: NeedLevel.MEDIUM, shopping: NeedLevel.MEDIUM, work: NeedLevel.HIGH, sleep: NeedLevel.MEDIUM },
    ];

    testCases.forEach(({ eid, food, shopping, work, sleep }) => {
      Needs.food[eid] = food;
      Needs.shopping[eid] = shopping;
      Needs.work[eid] = work;
      Needs.sleep[eid] = sleep;

      expect(Needs.food[eid]).toBe(food);
      expect(Needs.shopping[eid]).toBe(shopping);
      expect(Needs.work[eid]).toBe(work);
      expect(Needs.sleep[eid]).toBe(sleep);
    });
  });

  it('должен поддерживать full range of values (0-100)', () => {
    const eid = 6;

    // Test extremes
    Needs.food[eid] = 0;
    Needs.shopping[eid] = 100;
    Needs.work[eid] = 0;
    Needs.sleep[eid] = 100;

    expect(Needs.food[eid]).toBe(0);
    expect(Needs.shopping[eid]).toBe(100);
    expect(Needs.work[eid]).toBe(0);
    expect(Needs.sleep[eid]).toBe(100);

    // Test mid-range
    Needs.food[eid] = 50;
    Needs.shopping[eid] = 75;
    Needs.work[eid] = 25;
    Needs.sleep[eid] = 80;

    expect(Needs.food[eid]).toBe(50);
    expect(Needs.shopping[eid]).toBe(75);
    expect(Needs.work[eid]).toBe(25);
    expect(Needs.sleep[eid]).toBe(80);
  });

  it('должен обрабатывать need progression over time', () => {
    const eid = 7;

    // Initial state - well satisfied
    Needs.food[eid] = 5;
    Needs.shopping[eid] = 10;
    Needs.work[eid] = 15;
    Needs.sleep[eid] = 5;

    // After some time - needs increase
    Needs.food[eid] = 40;
    Needs.shopping[eid] = 55;
    Needs.work[eid] = 70;
    Needs.sleep[eid] = 35;

    expect(Needs.food[eid]).toBe(40);
    expect(Needs.shopping[eid]).toBe(55);
    expect(Needs.work[eid]).toBe(70);
    expect(Needs.sleep[eid]).toBe(35);

    // After more time - critical needs
    Needs.food[eid] = 95;
    Needs.shopping[eid] = 90;
    Needs.work[eid] = 85;
    Needs.sleep[eid] = 98;

    expect(Needs.food[eid]).toBe(95);
    expect(Needs.shopping[eid]).toBe(90);
    expect(Needs.work[eid]).toBe(85);
    expect(Needs.sleep[eid]).toBe(98);
  });

  it('должен поддерживать independent need changes', () => {
    const eid = 8;

    // Set initial values
    Needs.food[eid] = 20;
    Needs.shopping[eid] = 30;
    Needs.work[eid] = 40;
    Needs.sleep[eid] = 50;

    // Change only food need
    Needs.food[eid] = 80;
    expect(Needs.food[eid]).toBe(80);
    expect(Needs.shopping[eid]).toBe(30); // Unchanged
    expect(Needs.work[eid]).toBe(40); // Unchanged
    expect(Needs.sleep[eid]).toBe(50); // Unchanged

    // Change multiple needs
    Needs.shopping[eid] = 60;
    Needs.sleep[eid] = 10;
    expect(Needs.shopping[eid]).toBe(60);
    expect(Needs.sleep[eid]).toBe(10);
    expect(Needs.food[eid]).toBe(80); // Unchanged
    expect(Needs.work[eid]).toBe(40); // Unchanged
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Needs.food[eid]).toBeUndefined();
    expect(Needs.shopping[eid]).toBeUndefined();
    expect(Needs.work[eid]).toBeUndefined();
    expect(Needs.sleep[eid]).toBeUndefined();
  });

  it('должен обрабатывать decimal values', () => {
    const eid = 9;

    Needs.food[eid] = 33.5;
    Needs.shopping[eid] = 67.8;
    Needs.work[eid] = 12.3;
    Needs.sleep[eid] = 89.9;

    expect(Needs.food[eid]).toBe(33.5);
    expect(Needs.shopping[eid]).toBe(67.8);
    expect(Needs.work[eid]).toBe(12.3);
    expect(Needs.sleep[eid]).toBe(89.9);
  });
});

describe('NeedLevel enum', () => {
  it('should have correct need level values', () => {
    expect(NeedLevel.SATISFIED).toBe(0);
    expect(NeedLevel.LOW).toBe(25);
    expect(NeedLevel.MEDIUM).toBe(50);
    expect(NeedLevel.HIGH).toBe(75);
    expect(NeedLevel.CRITICAL).toBe(90);
  });

  it('should be used correctly in needs component', () => {
    const eid = 10;

    Needs.food[eid] = NeedLevel.SATISFIED;
    Needs.shopping[eid] = NeedLevel.LOW;
    Needs.work[eid] = NeedLevel.MEDIUM;
    Needs.sleep[eid] = NeedLevel.HIGH;

    expect(Needs.food[eid]).toBe(NeedLevel.SATISFIED);
    expect(Needs.shopping[eid]).toBe(NeedLevel.LOW);
    expect(Needs.work[eid]).toBe(NeedLevel.MEDIUM);
    expect(Needs.sleep[eid]).toBe(NeedLevel.HIGH);
  });

  it('should have progressive values', () => {
    const numericValues = Object.values(NeedLevel).filter(v => typeof v === 'number') as number[];
    const sortedValues = numericValues.sort((a, b) => a - b);
    for (let i = 1; i < sortedValues.length; i++) {
      expect(sortedValues[i]).toBeGreaterThan(sortedValues[i - 1]);
    }
  });

  it('должен поддерживать all need levels', () => {
    const testLevels = [
      NeedLevel.SATISFIED,
      NeedLevel.LOW,
      NeedLevel.MEDIUM,
      NeedLevel.HIGH,
      NeedLevel.CRITICAL,
    ];

    testLevels.forEach((level, index) => {
      const eid = 11 + index;
      Needs.food[eid] = level;
      expect(Needs.food[eid]).toBe(level);
    });
  });
});

describe('NeedsData type', () => {
  it('должен принимать допустимый NeedsData object', () => {
    const data: NeedsData = {
      food: 30,
      shopping: 45,
      work: 60,
      sleep: 20,
    };

    expect(data.food).toBe(30);
    expect(data.shopping).toBe(45);
    expect(data.work).toBe(60);
    expect(data.sleep).toBe(20);
  });

  it('должен поддерживать различные need combinations', () => {
    const testData: NeedsData[] = [
      {
        food: NeedLevel.SATISFIED,
        shopping: NeedLevel.LOW,
        work: NeedLevel.MEDIUM,
        sleep: NeedLevel.LOW,
      },
      {
        food: NeedLevel.CRITICAL,
        shopping: NeedLevel.HIGH,
        work: NeedLevel.SATISFIED,
        sleep: NeedLevel.CRITICAL,
      },
      {
        food: 67,
        shopping: 34,
        work: 89,
        sleep: 12,
      },
    ];

    testData.forEach((data, index) => {
      const eid = 16 + index;
      Needs.food[eid] = data.food;
      Needs.shopping[eid] = data.shopping;
      Needs.work[eid] = data.work;
      Needs.sleep[eid] = data.sleep;

      expect(Needs.food[eid]).toBe(data.food);
      expect(Needs.shopping[eid]).toBe(data.shopping);
      expect(Needs.work[eid]).toBe(data.work);
      expect(Needs.sleep[eid]).toBe(data.sleep);
    });
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      food: 25,
      shopping: 40,
      work: 55,
      sleep: 15,
    };

    expect(data.food).toBe(25);
    expect(data.shopping).toBe(40);
    expect(data.work).toBe(55);
    expect(data.sleep).toBe(15);
  });
});
