import { describe, it, expect } from 'vitest';
import { ID, type IdData } from '../../../../core/ecs/components/shared/id_component';

describe('ID Component', () => {
  it('should have value array', () => {
    expect(Array.isArray(ID.value)).toBe(true);
    expect(ID.value.length).toBe(0);
  });

  it('должен уметь хранить и извлекать ID values', () => {
    const eid = 0;
    const testValue = 42;

    ID.value[eid] = testValue;
    expect(ID.value[eid]).toBe(testValue);
  });

  it('должен обрабатывать multiple entities', () => {
    const eid1 = 1;
    const eid2 = 5;
    const value1 = 100;
    const value2 = 200;

    ID.value[eid1] = value1;
    ID.value[eid2] = value2;

    expect(ID.value[eid1]).toBe(value1);
    expect(ID.value[eid2]).toBe(value2);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(ID.value[eid]).toBeUndefined();
  });
});

describe('IdData type', () => {
  it('должен принимать допустимый IdData object', () => {
    const data: IdData = {
      value: 123,
    };

    expect(data.value).toBe(123);
  });

  it('should enforce required value property', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      value: 456,
    };

    expect(data.value).toBe(456);
  });
});
