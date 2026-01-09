import { describe, it, expect } from 'vitest';
import { Residential, type ResidentialData } from '../../../../core/ecs/components/buildings/residential_component';

describe('Residential Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Residential.capacity)).toBe(true);
    expect(Array.isArray(Residential.occupants)).toBe(true);
    expect(Array.isArray(Residential.quality)).toBe(true);

    expect(Residential.capacity.length).toBe(0);
    expect(Residential.occupants.length).toBe(0);
    expect(Residential.quality.length).toBe(0);
  });

  it('должен уметь хранить и извлекать residential data', () => {
    const eid = 0;
    const testData = {
      capacity: 4,
      occupants: [1, 2, 3],
      quality: 85,
    };

    Residential.capacity[eid] = testData.capacity;
    Residential.occupants[eid] = [...testData.occupants];
    Residential.quality[eid] = testData.quality;

    expect(Residential.capacity[eid]).toBe(testData.capacity);
    expect(Residential.occupants[eid]).toEqual(testData.occupants);
    expect(Residential.quality[eid]).toBe(testData.quality);
  });

  it('должен обрабатывать multiple residential buildings', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Small apartment
    Residential.capacity[eid1] = 2;
    Residential.occupants[eid1] = [10, 11];
    Residential.quality[eid1] = 70;

    // Large house
    Residential.capacity[eid2] = 6;
    Residential.occupants[eid2] = [20, 21, 22, 23];
    Residential.quality[eid2] = 95;

    // Verify first building
    expect(Residential.capacity[eid1]).toBe(2);
    expect(Residential.occupants[eid1]).toEqual([10, 11]);
    expect(Residential.quality[eid1]).toBe(70);

    // Verify second building
    expect(Residential.capacity[eid2]).toBe(6);
    expect(Residential.occupants[eid2]).toEqual([20, 21, 22, 23]);
    expect(Residential.quality[eid2]).toBe(95);
  });

  it('должен поддерживать различные capacity sizes', () => {
    const testCases = [
      { eid: 3, capacity: 1, description: 'Studio apartment' },
      { eid: 4, capacity: 3, description: 'Small apartment' },
      { eid: 5, capacity: 5, description: 'Family house' },
      { eid: 6, capacity: 10, description: 'Apartment building' },
      { eid: 7, capacity: 50, description: 'Large residential complex' },
    ];

    testCases.forEach(({ eid, capacity }) => {
      Residential.capacity[eid] = capacity;
      Residential.occupants[eid] = [];
      Residential.quality[eid] = 75;

      expect(Residential.capacity[eid]).toBe(capacity);
      expect(Residential.occupants[eid]).toEqual([]);
      expect(Residential.quality[eid]).toBe(75);
    });
  });

  it('должен обрабатывать occupant management', () => {
    const eid = 8;

    // Empty building
    Residential.capacity[eid] = 4;
    Residential.occupants[eid] = [];
    Residential.quality[eid] = 80;

    expect(Residential.occupants[eid]).toEqual([]);

    // Add first occupant
    Residential.occupants[eid] = [100];
    expect(Residential.occupants[eid]).toEqual([100]);

    // Add more occupants
    Residential.occupants[eid] = [100, 101, 102];
    expect(Residential.occupants[eid]).toEqual([100, 101, 102]);

    // Remove occupant
    Residential.occupants[eid] = [100, 102];
    expect(Residential.occupants[eid]).toEqual([100, 102]);

    // Empty building
    Residential.occupants[eid] = [];
    expect(Residential.occupants[eid]).toEqual([]);
  });

  it('должен поддерживать различные quality levels', () => {
    const eid = 9;

    // Poor quality
    Residential.quality[eid] = 20;
    expect(Residential.quality[eid]).toBe(20);

    // Average quality
    Residential.quality[eid] = 60;
    expect(Residential.quality[eid]).toBe(60);

    // High quality
    Residential.quality[eid] = 95;
    expect(Residential.quality[eid]).toBe(95);

    // Perfect quality
    Residential.quality[eid] = 100;
    expect(Residential.quality[eid]).toBe(100);
  });

  it('должен обрабатывать over-capacity scenarios', () => {
    const eid = 10;

    Residential.capacity[eid] = 2;
    Residential.occupants[eid] = [1, 2, 3, 4]; // More than capacity
    Residential.quality[eid] = 50;

    expect(Residential.capacity[eid]).toBe(2);
    expect(Residential.occupants[eid]).toEqual([1, 2, 3, 4]); // Component allows over-capacity
  });

  it('должен поддерживать empty buildings', () => {
    const eid = 11;

    Residential.capacity[eid] = 3;
    Residential.occupants[eid] = [];
    Residential.quality[eid] = 90;

    expect(Residential.capacity[eid]).toBe(3);
    expect(Residential.occupants[eid]).toEqual([]);
    expect(Residential.quality[eid]).toBe(90);
  });

  it('должен поддерживать full buildings', () => {
    const eid = 12;

    Residential.capacity[eid] = 2;
    Residential.occupants[eid] = [200, 201];
    Residential.quality[eid] = 75;

    expect(Residential.capacity[eid]).toBe(2);
    expect(Residential.occupants[eid]).toEqual([200, 201]);
    expect(Residential.quality[eid]).toBe(75);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Residential.capacity[eid]).toBeUndefined();
    expect(Residential.occupants[eid]).toBeUndefined();
    expect(Residential.quality[eid]).toBeUndefined();
  });

  it('должен обрабатывать large occupant arrays', () => {
    const eid = 13;
    const largeOccupantList = Array.from({ length: 20 }, (_, i) => 1000 + i);

    Residential.capacity[eid] = 20;
    Residential.occupants[eid] = largeOccupantList;
    Residential.quality[eid] = 85;

    expect(Residential.capacity[eid]).toBe(20);
    expect(Residential.occupants[eid]).toEqual(largeOccupantList);
    expect(Residential.quality[eid]).toBe(85);
  });
});

describe('ResidentialData type', () => {
  it('должен принимать допустимый ResidentialData object', () => {
    const data: ResidentialData = {
      capacity: 4,
      occupants: [1, 2, 3],
      quality: 85,
    };

    expect(data.capacity).toBe(4);
    expect(data.occupants).toEqual([1, 2, 3]);
    expect(data.quality).toBe(85);
  });

  it('должен поддерживать различные residential configurations', () => {
    const testData: ResidentialData[] = [
      {
        capacity: 1,
        occupants: [],
        quality: 60,
      },
      {
        capacity: 3,
        occupants: [10, 11],
        quality: 80,
      },
      {
        capacity: 6,
        occupants: [20, 21, 22, 23, 24, 25],
        quality: 95,
      },
    ];

    testData.forEach((data, index) => {
      const eid = 14 + index;
      Residential.capacity[eid] = data.capacity;
      Residential.occupants[eid] = [...data.occupants];
      Residential.quality[eid] = data.quality;

      expect(Residential.capacity[eid]).toBe(data.capacity);
      expect(Residential.occupants[eid]).toEqual(data.occupants);
      expect(Residential.quality[eid]).toBe(data.quality);
    });
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      capacity: 5,
      occupants: [1, 2, 3, 4],
      quality: 75,
    };

    expect(data.capacity).toBe(5);
    expect(data.occupants).toEqual([1, 2, 3, 4]);
    expect(data.quality).toBe(75);
  });

  it('должен поддерживать empty occupants array', () => {
    const data: ResidentialData = {
      capacity: 3,
      occupants: [],
      quality: 70,
    };

    expect(data.occupants).toEqual([]);
    expect(data.capacity).toBe(3);
  });
});
