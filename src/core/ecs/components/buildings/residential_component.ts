import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Жилое здание (дом)
 * Предоставляет жилье для граждан
 */
export const Residential = createSimpleComponent('Residential', {
  /** Максимальная вместимость (количество жителей) */
  capacity: 4,
  /** Текущие жители (количество) */
  occupied: 0,
  /** Качество жилья (0-100, влияет на счастье жителей) */
  quality: 50,
  /** ID здания */
  buildingId: 0,
  /** Стоимость аренды */
  rent: 100.0,
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
