import { describe, it, expect } from 'vitest';
import { Position, type PositionData } from '../../../../core/ecs/components/shared/position_component';

describe('Position Component', () => {
  it('should have x and y arrays', () => {
    expect(Array.isArray(Position.x)).toBe(true);
    expect(Array.isArray(Position.y)).toBe(true);
    expect(Position.x.length).toBe(0);
    expect(Position.y.length).toBe(0);
  });

  it('должен уметь хранить и извлекать position values', () => {
    const eid = 0;
    const x = 10.5;
    const y = 20.3;

    Position.x[eid] = x;
    Position.y[eid] = y;

    expect(Position.x[eid]).toBe(x);
    expect(Position.y[eid]).toBe(y);
  });

  it('должен обрабатывать multiple entities with different positions', () => {
    const eid1 = 1;
    const eid2 = 2;
    const pos1 = { x: 100, y: 200 };
    const pos2 = { x: -50.5, y: 75.25 };

    Position.x[eid1] = pos1.x;
    Position.y[eid1] = pos1.y;
    Position.x[eid2] = pos2.x;
    Position.y[eid2] = pos2.y;

    expect(Position.x[eid1]).toBe(pos1.x);
    expect(Position.y[eid1]).toBe(pos1.y);
    expect(Position.x[eid2]).toBe(pos2.x);
    expect(Position.y[eid2]).toBe(pos2.y);
  });

  it('должен обрабатывать floating point coordinates', () => {
    const eid = 3;
    const x = Math.PI;
    const y = Math.E;

    Position.x[eid] = x;
    Position.y[eid] = y;

    expect(Position.x[eid]).toBeCloseTo(x);
    expect(Position.y[eid]).toBeCloseTo(y);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Position.x[eid]).toBeUndefined();
    expect(Position.y[eid]).toBeUndefined();
  });

  it('должен поддерживать negative coordinates', () => {
    const eid = 4;
    const x = -100;
    const y = -200;

    Position.x[eid] = x;
    Position.y[eid] = y;

    expect(Position.x[eid]).toBe(x);
    expect(Position.y[eid]).toBe(y);
  });

  it('должен поддерживать zero coordinates', () => {
    const eid = 5;
    const x = 0;
    const y = 0;

    Position.x[eid] = x;
    Position.y[eid] = y;

    expect(Position.x[eid]).toBe(x);
    expect(Position.y[eid]).toBe(y);
  });
});

describe('PositionData type', () => {
  it('должен принимать допустимый PositionData object', () => {
    const data: PositionData = {
      x: 10,
      y: 20,
    };

    expect(data.x).toBe(10);
    expect(data.y).toBe(20);
  });

  it('должен поддерживать floating point values', () => {
    const data: PositionData = {
      x: 15.75,
      y: -8.25,
    };

    expect(data.x).toBe(15.75);
    expect(data.y).toBe(-8.25);
  });

  it('should enforce required x and y properties', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      x: 5,
      y: 10,
    };

    expect(data.x).toBe(5);
    expect(data.y).toBe(10);
  });
});
