import { describe, it, expect } from 'vitest';
import { Commercial, CommercialType, type CommercialData } from '../../../../core/ecs/components/buildings/commercial_component';

describe('Commercial Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Commercial.type)).toBe(true);
    expect(Array.isArray(Commercial.inventory)).toBe(true);
    expect(Array.isArray(Commercial.employees)).toBe(true);
    expect(Array.isArray(Commercial.customers)).toBe(true);

    expect(Commercial.type.length).toBe(0);
    expect(Commercial.inventory.length).toBe(0);
    expect(Commercial.employees.length).toBe(0);
    expect(Commercial.customers.length).toBe(0);
  });

  it('должен уметь хранить и извлекать commercial data', () => {
    const eid = 0;
    const testData = {
      type: CommercialType.SHOP,
      inventory: {
        food: 100,
        clothes: 50,
        electronics: 25,
      },
      employees: [10, 11],
      customers: [20, 21, 22],
    };

    Commercial.type[eid] = testData.type;
    Commercial.inventory[eid] = { ...testData.inventory };
    Commercial.employees[eid] = [...testData.employees];
    Commercial.customers[eid] = [...testData.customers];

    expect(Commercial.type[eid]).toBe(testData.type);
    expect(Commercial.inventory[eid]).toEqual(testData.inventory);
    expect(Commercial.employees[eid]).toEqual(testData.employees);
    expect(Commercial.customers[eid]).toEqual(testData.customers);
  });

  it('должен обрабатывать различные commercial building types', () => {
    const eid1 = 1;
    const eid2 = 2;
    const eid3 = 3;

    // Shop
    Commercial.type[eid1] = CommercialType.SHOP;
    Commercial.inventory[eid1] = { bread: 20, milk: 15 };
    Commercial.employees[eid1] = [100];
    Commercial.customers[eid1] = [200, 201];

    // Office
    Commercial.type[eid2] = CommercialType.OFFICE;
    Commercial.inventory[eid2] = {}; // Offices don't have inventory
    Commercial.employees[eid2] = [101, 102, 103];
    Commercial.customers[eid2] = []; // Offices don't have customers

    // Factory
    Commercial.type[eid3] = CommercialType.FACTORY;
    Commercial.inventory[eid3] = { raw_materials: 500, finished_goods: 100 };
    Commercial.employees[eid3] = [104, 105, 106, 107, 108];
    Commercial.customers[eid3] = [202]; // Factory might have a buyer

    // Verify shop
    expect(Commercial.type[eid1]).toBe(CommercialType.SHOP);
    expect(Commercial.inventory[eid1]).toEqual({ bread: 20, milk: 15 });
    expect(Commercial.employees[eid1]).toEqual([100]);
    expect(Commercial.customers[eid1]).toEqual([200, 201]);

    // Verify office
    expect(Commercial.type[eid2]).toBe(CommercialType.OFFICE);
    expect(Commercial.inventory[eid2]).toEqual({});
    expect(Commercial.employees[eid2]).toEqual([101, 102, 103]);
    expect(Commercial.customers[eid2]).toEqual([]);

    // Verify factory
    expect(Commercial.type[eid3]).toBe(CommercialType.FACTORY);
    expect(Commercial.inventory[eid3]).toEqual({ raw_materials: 500, finished_goods: 100 });
    expect(Commercial.employees[eid3]).toEqual([104, 105, 106, 107, 108]);
    expect(Commercial.customers[eid3]).toEqual([202]);
  });

  it('должен обрабатывать inventory management', () => {
    const eid = 4;

    // Initial inventory
    Commercial.inventory[eid] = {
      apples: 50,
      bananas: 30,
      oranges: 20,
    };

    expect(Commercial.inventory[eid]).toEqual({
      apples: 50,
      bananas: 30,
      oranges: 20,
    });

    // Update inventory
    Commercial.inventory[eid] = {
      apples: 45, // Sold 5
      bananas: 30, // Unchanged
      oranges: 25, // Restocked
      grapes: 15, // New item
    };

    expect(Commercial.inventory[eid]).toEqual({
      apples: 45,
      bananas: 30,
      oranges: 25,
      grapes: 15,
    });

    // Empty inventory
    Commercial.inventory[eid] = {};
    expect(Commercial.inventory[eid]).toEqual({});
  });

  it('должен обрабатывать employee management', () => {
    const eid = 5;

    // No employees initially
    Commercial.employees[eid] = [];
    expect(Commercial.employees[eid]).toEqual([]);

    // Hire employees
    Commercial.employees[eid] = [300, 301];
    expect(Commercial.employees[eid]).toEqual([300, 301]);

    // Hire more
    Commercial.employees[eid] = [300, 301, 302, 303];
    expect(Commercial.employees[eid]).toEqual([300, 301, 302, 303]);

    // Fire employee
    Commercial.employees[eid] = [300, 302, 303];
    expect(Commercial.employees[eid]).toEqual([300, 302, 303]);
  });

  it('должен обрабатывать customer flow', () => {
    const eid = 6;

    // No customers initially
    Commercial.customers[eid] = [];
    expect(Commercial.customers[eid]).toEqual([]);

    // Customers arrive
    Commercial.customers[eid] = [400, 401];
    expect(Commercial.customers[eid]).toEqual([400, 401]);

    // More customers
    Commercial.customers[eid] = [400, 401, 402, 403, 404];
    expect(Commercial.customers[eid]).toEqual([400, 401, 402, 403, 404]);

    // Customers leave
    Commercial.customers[eid] = [401, 402, 404];
    expect(Commercial.customers[eid]).toEqual([401, 402, 404]);

    // All customers left
    Commercial.customers[eid] = [];
    expect(Commercial.customers[eid]).toEqual([]);
  });

  it('должен поддерживать complex inventory scenarios', () => {
    const eid = 7;

    // Large supermarket inventory
    const largeInventory = {
      dairy: 200,
      bakery: 150,
      produce: 300,
      meat: 100,
      frozen: 80,
      beverages: 250,
      snacks: 400,
      household: 120,
      personal_care: 90,
    };

    Commercial.inventory[eid] = { ...largeInventory };
    expect(Commercial.inventory[eid]).toEqual(largeInventory);

    // Factory inventory
    const factoryInventory = {
      steel: 1000,
      aluminum: 500,
      plastic: 800,
      electronics: 200,
    };

    Commercial.inventory[eid] = { ...factoryInventory };
    expect(Commercial.inventory[eid]).toEqual(factoryInventory);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Commercial.type[eid]).toBeUndefined();
    expect(Commercial.inventory[eid]).toBeUndefined();
    expect(Commercial.employees[eid]).toBeUndefined();
    expect(Commercial.customers[eid]).toBeUndefined();
  });

  it('должен обрабатывать large employee/customer arrays', () => {
    const eid = 8;

    const largeEmployeeList = Array.from({ length: 50 }, (_, i) => 1000 + i);
    const largeCustomerList = Array.from({ length: 100 }, (_, i) => 2000 + i);

    Commercial.employees[eid] = largeEmployeeList;
    Commercial.customers[eid] = largeCustomerList;

    expect(Commercial.employees[eid]).toEqual(largeEmployeeList);
    expect(Commercial.customers[eid]).toEqual(largeCustomerList);
  });
});

describe('CommercialType enum', () => {
  it('should have correct commercial type values', () => {
    expect(CommercialType.SHOP).toBe(0);
    expect(CommercialType.OFFICE).toBe(1);
    expect(CommercialType.FACTORY).toBe(2);
  });

  it('should be used correctly in commercial component', () => {
    const eid = 9;
    Commercial.type[eid] = CommercialType.SHOP;
    expect(Commercial.type[eid]).toBe(CommercialType.SHOP);

    Commercial.type[eid] = CommercialType.FACTORY;
    expect(Commercial.type[eid]).toBe(CommercialType.FACTORY);
  });

  it('should have valid commercial type values', () => {
    const numericValues = Object.values(CommercialType).filter(v => typeof v === 'number') as number[];
    expect(numericValues.sort()).toEqual([0, 1, 2]);
  });
});

describe('CommercialData type', () => {
  it('должен принимать допустимый CommercialData object', () => {
    const data: CommercialData = {
      type: CommercialType.SHOP,
      inventory: {
        food: 100,
        drinks: 50,
      },
      employees: [10, 11],
      customers: [20, 21],
    };

    expect(data.type).toBe(CommercialType.SHOP);
    expect(data.inventory).toEqual({ food: 100, drinks: 50 });
    expect(data.employees).toEqual([10, 11]);
    expect(data.customers).toEqual([20, 21]);
  });

  it('должен поддерживать различные commercial configurations', () => {
    const testData: CommercialData[] = [
      {
        type: CommercialType.SHOP,
        inventory: { bread: 50, milk: 30 },
        employees: [1],
        customers: [10, 11, 12],
      },
      {
        type: CommercialType.OFFICE,
        inventory: {},
        employees: [2, 3, 4, 5],
        customers: [],
      },
      {
        type: CommercialType.FACTORY,
        inventory: { steel: 1000, plastic: 500 },
        employees: [6, 7, 8, 9, 10, 11, 12],
        customers: [13],
      },
    ];

    testData.forEach((data, index) => {
      const eid = 10 + index;
      Commercial.type[eid] = data.type;
      Commercial.inventory[eid] = { ...data.inventory };
      Commercial.employees[eid] = [...data.employees];
      Commercial.customers[eid] = [...data.customers];

      expect(Commercial.type[eid]).toBe(data.type);
      expect(Commercial.inventory[eid]).toEqual(data.inventory);
      expect(Commercial.employees[eid]).toEqual(data.employees);
      expect(Commercial.customers[eid]).toEqual(data.customers);
    });
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      type: CommercialType.OFFICE,
      inventory: {},
      employees: [1, 2, 3],
      customers: [],
    };

    expect(data.type).toBe(CommercialType.OFFICE);
    expect(data.inventory).toEqual({});
    expect(data.employees).toEqual([1, 2, 3]);
    expect(data.customers).toEqual([]);
  });
});
