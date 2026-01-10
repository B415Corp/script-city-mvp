import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, query } from 'bitecs';
import {
  createSimpleComponent,
  createComponentSchema,
  money,
  percentage,
  entityId,
  count,
  index,
  uint8,
  uint16,
  uint32,
  float32,
} from '../component_schema';

describe('Component Schema (Higher-level API)', () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  describe('createSimpleComponent', () => {
    it('should create component with auto-inferred types', () => {
      const Wallet = createSimpleComponent('Wallet', {
        balance: 100.5, // float → float32
        savings: 500, // int → uint16 (0-65535)
      });

      // Регистрируем компонент
      Wallet.register(world);

      const eid = addEntity(world);
      Wallet.create(world, eid);

      expect(Wallet.balance[eid]).toBe(100.5);
      expect(Wallet.savings[eid]).toBe(500);
    });

    it('should infer correct BitECS types', () => {
      // Проверяем автоматическое определение типов
      expect(createSimpleComponent('Test', { smallInt: 100 })).toBeDefined(); // uint8
      expect(createSimpleComponent('Test', { mediumInt: 1000 })).toBeDefined(); // uint16
      expect(createSimpleComponent('Test', { largeInt: 100000 })).toBeDefined(); // uint32
      expect(createSimpleComponent('Test', { floatVal: 10.5 })).toBeDefined(); // float32
      expect(createSimpleComponent('Test', { negative: -50 })).toBeDefined(); // int16
    });

    it('should work with BitECS query system', () => {
      const Item = createSimpleComponent('Item', {
        price: 29.99, // float32
        quantity: 10, // uint8
        category: 0, // uint8
      });

      Item.register(world);

      const eid1 = addEntity(world);
      const eid2 = addEntity(world);

      Item.create(world, eid1, { price: 29.99, quantity: 5 });
      Item.create(world, eid2, { price: 49.99, quantity: 3 });

      // Проверяем query
      const entities = query(world, [Item]);
      expect(entities).toHaveLength(2);

      // Проверяем данные
      expect(Item.price[eid1]).toBeCloseTo(29.99, 2);
      expect(Item.quantity[eid1]).toBe(5);
      expect(Item.price[eid2]).toBeCloseTo(49.99, 2);
      expect(Item.quantity[eid2]).toBe(3);
    });
  });
});

describe('createComponentSchema (advanced)', () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  it('should create component with semantic field builders', () => {
    const Shop = createComponentSchema('Shop', {
      price: money(10),
      demand: percentage(50),
      stock: percentage(100),
      type: index(0),
    });

    // Регистрируем компонент
    Shop.register(world);

    const eid = addEntity(world);
    Shop.create(world, eid);

    expect(Shop.price[eid]).toBe(10);
    expect(Shop.demand[eid]).toBe(50);
    expect(Shop.stock[eid]).toBe(100);
    expect(Shop.type[eid]).toBe(0);
  });

  it('should support fluent API for field configuration', () => {
    const Citizen = createComponentSchema('Citizen', {
      age: uint8(25).range(0, 120),
      education: uint8(0).range(0, 5),
      money: money(100),
      happiness: percentage(70),
      workplace: entityId(),
    });

    Citizen.register(world);

    const eid = addEntity(world);
    Citizen.create(world, eid);

    expect(Citizen.age[eid]).toBe(25);
    expect(Citizen.education[eid]).toBe(0);
    expect(Citizen.money[eid]).toBe(100);
    expect(Citizen.happiness[eid]).toBe(70);
    expect(Citizen.workplace[eid]).toBe(0);
  });

  it('should work with query system', () => {
    const Building = createComponentSchema('Building', {
      capacity: count(50),
      efficiency: percentage(80),
      owner: entityId(),
    });

    Building.register(world);

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    Building.create(world, eid1, { capacity: 100, efficiency: 90 });
    Building.create(world, eid2, { capacity: 75, efficiency: 85 });

    // Проверяем query
    const entities = query(world, [Building]);
    expect(entities).toHaveLength(2);
    expect(entities).toContain(eid1);
    expect(entities).toContain(eid2);

    // Проверяем данные
    expect(Building.capacity[eid1]).toBe(100);
    expect(Building.efficiency[eid1]).toBe(90);
    expect(Building.capacity[eid2]).toBe(75);
    expect(Building.efficiency[eid2]).toBe(85);
  });

  it('should support different field types', () => {
    const TestComponent = createComponentSchema('TestComponent', {
      ui8Field: uint8(255),
      ui16Field: uint16(65535),
      ui32Field: uint32(4294967295),
      f32Field: float32(3.14159),
      moneyField: money(1000.5),
      percentageField: percentage(75),
      countField: count(42),
    });

    TestComponent.register(world);

    const eid = addEntity(world);
    TestComponent.create(world, eid);

    expect(TestComponent.ui8Field[eid]).toBe(255);
    expect(TestComponent.ui16Field[eid]).toBe(65535);
    expect(TestComponent.ui32Field[eid]).toBe(4294967295);
    expect(TestComponent.f32Field[eid]).toBeCloseTo(3.14159, 5);
    expect(TestComponent.moneyField[eid]).toBeCloseTo(1000.5, 2);
    expect(TestComponent.percentageField[eid]).toBe(75);
    expect(TestComponent.countField[eid]).toBe(42);
  });

  it('should maintain type safety', () => {
    const Person = createComponentSchema('Person', {
      age: uint8(25).range(0, 120),
      height: float32(170.5),
      weight: float32(70.2),
      money: money(1000),
    });

    Person.register(world);

    const eid = addEntity(world);
    Person.create(world, eid, {
      age: 30,
      height: 175.0,
      weight: 75.5,
      money: 1500,
    });

    expect(Person.age[eid]).toBe(30);
    expect(Person.height[eid]).toBe(175.0);
    expect(Person.weight[eid]).toBe(75.5);
    expect(Person.money[eid]).toBe(1500);
  });

  it('should support inspect method', () => {
    const Product = createComponentSchema('Product', {
      price: money(29.99),
      stock: count(100),
      rating: percentage(85),
    });

    Product.register(world);

    const eid = addEntity(world);
    Product.create(world, eid);

    const data = Product.inspect(world, eid);

    expect(data.price).toBeCloseTo(29.99, 2);
    expect(data.stock).toBe(100);
    expect(data.rating).toBe(85);
  });
});
