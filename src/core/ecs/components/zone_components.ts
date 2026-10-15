import type { EnhancedComponent, ComponentSchema } from '../core/component_schema';
import { createComponent } from '../core/smart_constructors';

/** Позиция сущности на карте в координатах тайлов. */
export const PositionComponent = createComponent('Position', {
  tileX: 0,
  tileY: 0,
});

/** Зона: 0 — жилая, 1 — коммерческая. */
export const ZoneComponent = createComponent('Zone', {
  kind: 0,
  tileX: 0,
  tileY: 0,
});

/** Дом/здание: вместимость и занятость. */
export const HouseComponent = createComponent('House', {
  capacity: 4,
  occupancy: 0,
});

export const ZoneKind = {
  Living: 0,
  Commercial: 1,
} as const;

/** Схема-помощник для маппинга строкового вида зоны в числовой. */
export function zoneKindFromString(kind: 'living' | 'commercial'): number {
  return kind === 'commercial' ? ZoneKind.Commercial : ZoneKind.Living;
}
