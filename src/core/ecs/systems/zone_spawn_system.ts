import { addEntity, type World } from 'bitecs';

import { Events } from '../../event_bus/events';
import type { ZonePlacedPayload } from '../../event_bus/types';
import { createSystem } from '../core/smart_constructors';
import { MoneyComponent } from '../components/citizen_components';
import {
  HouseComponent,
  PositionComponent,
  ZoneComponent,
  zoneKindFromString,
} from '../components/zone_components';

export const MAX_SPAWN_TILES_PER_EVENT = 50;

export interface NormalizedRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function normalizeRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): NormalizedRect {
  return {
    minX: Math.min(start.x, end.x),
    minY: Math.min(start.y, end.y),
    maxX: Math.max(start.x, end.x),
    maxY: Math.max(start.y, end.y),
  };
}

function isZonePlacedPayload(payload: unknown): payload is ZonePlacedPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    (p['kind'] === 'living' || p['kind'] === 'commercial') &&
    typeof p['start'] === 'object' &&
    typeof p['end'] === 'object'
  );
}

function spawnForTile(world: World, tileX: number, tileY: number, kind: number): number[] {
  const created: number[] = [];
  const zoneId = addEntity(world);
  ZoneComponent.create(world, zoneId, { kind, tileX, tileY });
  PositionComponent.create(world, zoneId, { tileX, tileY });
  created.push(zoneId);

  // Жилая зона: каждый 4-й тайл получает дом с жителем (детерминировано по координатам).
  if (kind === 0 && (tileX + tileY) % 4 === 0) {
    const houseId = addEntity(world);
    HouseComponent.create(world, houseId, { capacity: 4, occupancy: 1 });
    PositionComponent.create(world, houseId, { tileX, tileY });
    created.push(houseId);

    const citizenId = addEntity(world);
    MoneyComponent.create(world, citizenId, { money: 100 });
    PositionComponent.create(world, citizenId, { tileX, tileY });
    created.push(citizenId);
  }

  return created;
}

export function spawnSettlementForPayload(world: World, payload: unknown): number[] {
  if (!isZonePlacedPayload(payload)) return [];
  const kind = zoneKindFromString(payload.kind);
  const rect = normalizeRect(payload.start, payload.end);
  const created: number[] = [];
  let count = 0;

  for (let y = rect.minY; y <= rect.maxY && count < MAX_SPAWN_TILES_PER_EVENT; y++) {
    for (let x = rect.minX; x <= rect.maxX && count < MAX_SPAWN_TILES_PER_EVENT; x++) {
      created.push(...spawnForTile(world, x, y, kind));
      count++;
    }
  }

  return created;
}

/**
 * Event-driven система заселения: по ZonePlaced создаёт zone/house/citizen сущности
 * с Position. Логика только здесь, модули лишь эмитят событие.
 */
export const ZoneSpawnSystem = createSystem(
  'zone_spawn',
  [],
  (world, _entities, _delta, payload) => {
    spawnSettlementForPayload(world, payload);
  },
  {
    eventTriggers: [Events.ZonePlaced],
    enabled: true,
  },
);
