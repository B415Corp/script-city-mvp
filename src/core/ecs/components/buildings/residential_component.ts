import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Жилое здание (дом)
 * Предоставляет жилье для граждан
 */
export const Residential = defineComponent('Residential', {
  /** Максимальная вместимость (количество жителей) */
  capacity: { type: 'ui8', default: 4, min: 1 },
  /** Текущие жители (количество) */
  occupied: { type: 'ui8', default: 0, min: 0 },
  /** Качество жилья (0-100, влияет на счастье жителей) */
  quality: { type: 'ui8', default: 50, min: 0, max: 100 },
  /** ID здания */
  buildingId: { type: 'ui32', default: 0 },
  /** Стоимость аренды */
  rent: { type: 'f32', default: 100, min: 0 },
});

/**
 * Тип для данных жилого здания
 */
export type ResidentialData = {
  capacity: number;
  occupied: number;
  quality: number;
  buildingId: number;
  rent: number;
};
