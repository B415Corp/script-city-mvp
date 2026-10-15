import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld } from 'bitecs';

import { normalizeRect, spawnSettlementForPayload } from '../systems/zone_spawn_system';
import { toZoneRect } from '../../modules/base_modules/map_module/rendering/zone_renderer';
import { PositionComponent, ZoneComponent } from '../components/zone_components';

describe('P4 settlement', () => {
  it('normalizeRect упорядочивает координаты', () => {
    expect(normalizeRect({ x: 5, y: 1 }, { x: 2, y: 4 })).toEqual({
      minX: 2,
      minY: 1,
      maxX: 5,
      maxY: 4,
    });
  });

  it('toZoneRect совпадает с normalizeRect', () => {
    expect(toZoneRect({ x: 3, y: 3 }, { x: 1, y: 2 })).toEqual({
      minX: 1,
      minY: 2,
      maxX: 3,
      maxY: 3,
    });
  });

  it('spawnSettlementForPayload создаёт зону с позицией', () => {
    const world = createWorld();
    const created = spawnSettlementForPayload(world, {
      kind: 'living',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
    });

    expect(created.length).toBeGreaterThan(0);
    expect(ZoneComponent.kind[created[0]]).toBe(0);
    expect(PositionComponent.tileX[created[0]]).toBe(0);
    expect(PositionComponent.tileY[created[0]]).toBe(0);
  });

  it('невалидный payload не создаёт сущностей', () => {
    const world = createWorld();
    expect(spawnSettlementForPayload(world, undefined)).toEqual([]);
    expect(spawnSettlementForPayload(world, { kind: 'unknown' })).toEqual([]);
  });

  it('ограничивает спавн большой области', () => {
    const world = createWorld();
    const created = spawnSettlementForPayload(world, {
      kind: 'commercial',
      start: { x: 0, y: 0 },
      end: { x: 99, y: 99 },
    });
    // 50 тайлов максимум, по 1 сущности на коммерческий тайл
    expect(created.length).toBe(50);
  });
});

describe('P4 setup', () => {
  let world: ReturnType<typeof createWorld>;
  beforeEach(() => {
    world = createWorld();
  });

  it('world создаётся для изоляционного теста', () => {
    expect(world).toBeDefined();
  });
});
