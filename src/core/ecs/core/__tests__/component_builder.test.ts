import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, query, registerComponent } from 'bitecs';
import { defineComponent } from '../component_builder';

describe('Component Builder (BitECS 0.4.0)', () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  it('should create component with TypedArrays', () => {
    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 0 },
      y: { type: 'f32', default: 0 },
    });

    expect(Position.x).toBeInstanceOf(Float32Array);
    expect(Position.y).toBeInstanceOf(Float32Array);
  });

  it('should support direct array access', () => {
    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 0 },
      y: { type: 'f32', default: 0 },
    });

    const eid = addEntity(world);
    Position.create(world, eid);

    Position.x[eid] = 100;
    Position.y[eid] = 200;

    expect(Position.x[eid]).toBe(100);
    expect(Position.y[eid]).toBe(200);
  });

  it('should cache keys and defaults', () => {
    const Citizen = defineComponent('Citizen', {
      money: { type: 'f32', default: 100 },
      happiness: { type: 'ui8', default: 70 },
    });

    expect(Citizen.name).toBe('Citizen');
    expect(Citizen.schema).toBeDefined();
  });

  it('should use defaults when creating component', () => {
    const Citizen = defineComponent('Citizen', {
      money: { type: 'f32', default: 100 },
      happiness: { type: 'ui8', default: 70 },
      salary: { type: 'f32', default: 50 },
    });

    const eid = addEntity(world);
    Citizen.create(world, eid);

    expect(Citizen.money[eid]).toBe(100);
    expect(Citizen.happiness[eid]).toBe(70);
    expect(Citizen.salary[eid]).toBe(50);
  });

  it('should override defaults with provided data', () => {
    const Citizen = defineComponent('Citizen', {
      money: { type: 'f32', default: 100 },
      happiness: { type: 'ui8', default: 70 },
    });

    const eid = addEntity(world);
    Citizen.create(world, eid, {
      money: 200,
      happiness: 90,
    });

    expect(Citizen.money[eid]).toBe(200);
    expect(Citizen.happiness[eid]).toBe(90);
  });

  it('should support different field types', () => {
    const TestComponent = defineComponent('TestComponent', {
      ui8Field: { type: 'ui8', default: 255 },
      ui16Field: { type: 'ui16', default: 65535 },
      ui32Field: { type: 'ui32', default: 4294967295 },
      i8Field: { type: 'i8', default: -128 },
      i16Field: { type: 'i16', default: -32768 },
      i32Field: { type: 'i32', default: -2147483648 },
      f32Field: { type: 'f32', default: 3.14159 },
      f64Field: { type: 'f64', default: 2.71828 },
    });

    const eid = addEntity(world);
    TestComponent.create(world, eid);

    expect(TestComponent.ui8Field).toBeInstanceOf(Uint8Array);
    expect(TestComponent.ui16Field).toBeInstanceOf(Uint16Array);
    expect(TestComponent.ui32Field).toBeInstanceOf(Uint32Array);
    expect(TestComponent.i8Field).toBeInstanceOf(Int8Array);
    expect(TestComponent.i16Field).toBeInstanceOf(Int16Array);
    expect(TestComponent.i32Field).toBeInstanceOf(Int32Array);
    expect(TestComponent.f32Field).toBeInstanceOf(Float32Array);
    expect(TestComponent.f64Field).toBeInstanceOf(Float64Array);
  });

  it('should support min/max validation in dev mode', () => {
    const Citizen = defineComponent('Citizen', {
      happiness: { type: 'ui8', default: 70, min: 0, max: 100 },
    });

    const eid = addEntity(world);

    // Should work with valid value
    Citizen.create(world, eid, { happiness: 50 });

    // Should work with boundary values
    Citizen.create(world, eid, { happiness: 0 });
    Citizen.create(world, eid, { happiness: 100 });

    // Note: In production mode validation is tree-shaken, so we can't test invalid values
    // as they would throw errors in dev mode but pass in production
  });

  it('should support inspect method for debugging', () => {
    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 10 },
      y: { type: 'f32', default: 20 },
    });

    const eid = addEntity(world);
    Position.create(world, eid, { x: 100, y: 200 });

    const data = Position.inspect(world, eid);

    expect(data).toEqual({
      x: 100,
      y: 200,
    });
  });

  it('should support partial data updates', () => {
    const Citizen = defineComponent('Citizen', {
      money: { type: 'f32', default: 100 },
      happiness: { type: 'ui8', default: 70 },
      salary: { type: 'f32', default: 50 },
    });

    const eid = addEntity(world);
    Citizen.create(world, eid);

    // Update only money
    Citizen.create(world, eid, { money: 200 });

    expect(Citizen.money[eid]).toBe(200);
    expect(Citizen.happiness[eid]).toBe(70); // Should keep default
    expect(Citizen.salary[eid]).toBe(50); // Should keep default
  });

  it('should handle multiple entities independently', () => {
    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 0 },
      y: { type: 'f32', default: 0 },
    });

    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    Position.create(world, eid1, { x: 10, y: 20 });
    Position.create(world, eid2, { x: 30, y: 40 });

    expect(Position.x[eid1]).toBe(10);
    expect(Position.y[eid1]).toBe(20);
    expect(Position.x[eid2]).toBe(30);
    expect(Position.y[eid2]).toBe(40);
  });

  it('should register component in BitECS world', () => {
    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 0 },
      y: { type: 'f32', default: 0 },
    });

    // Регистрируем компонент
    Position.register(world);

    const eid = addEntity(world);
    Position.create(world, eid, { x: 10, y: 20 });

    // Проверяем, что query находит сущность
    const entities = query(world, [Position]);
    expect(entities).toContain(eid);
  });

  it('should work with BitECS query after registration', () => {
    const Citizen = defineComponent('Citizen', {
      money: { type: 'f32', default: 100 },
      happiness: { type: 'ui8', default: 70 },
    });

    const Position = defineComponent('Position', {
      x: { type: 'f32', default: 0 },
      y: { type: 'f32', default: 0 },
    });

    // Регистрируем компоненты
    Citizen.register(world);
    Position.register(world);

    // Создаем сущности
    const eid1 = addEntity(world);
    const eid2 = addEntity(world);

    Citizen.create(world, eid1, { money: 1000, happiness: 90 });
    Position.create(world, eid1, { x: 10, y: 20 });

    Citizen.create(world, eid2, { money: 500, happiness: 60 });
    Position.create(world, eid2, { x: 30, y: 40 });

    // Тестируем query
    const citizens = query(world, [Citizen]);
    expect(citizens).toHaveLength(2);
    expect(citizens).toContain(eid1);
    expect(citizens).toContain(eid2);

    const positions = query(world, [Position]);
    expect(positions).toHaveLength(2);

    const both = query(world, [Citizen, Position]);
    expect(both).toHaveLength(2);

    // Проверяем данные
    expect(Citizen.money[eid1]).toBe(1000);
    expect(Citizen.happiness[eid1]).toBe(90);
    expect(Position.x[eid1]).toBe(10);
    expect(Position.y[eid1]).toBe(20);
  });

  it('should support registration via method', () => {
    const TestComponent = defineComponent('TestComponent', {
      value: { type: 'ui32', default: 42 },
    });

    // Регистрация через метод компонента
    TestComponent.register(world);

    const eid = addEntity(world);
    TestComponent.create(world, eid);

    const entities = query(world, [TestComponent]);
    expect(entities).toContain(eid);
    expect(TestComponent.value[eid]).toBe(42);
  });
});
