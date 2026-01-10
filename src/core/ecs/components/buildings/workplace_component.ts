import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Рабочее место
 * Определяет доступные вакансии и условия работы
 */
export const Workplace = defineComponent('Workplace', {
  /** Максимальная вместимость (количество работников) */
  capacity: { type: 'ui16', default: 10, min: 1 },
  /** Текущие работники (количество) */
  occupied: { type: 'ui16', default: 0, min: 0 },
  /** ID здания */
  buildingId: { type: 'ui32', default: 0 },
  /** Зарплата за рабочий день */
  salary: { type: 'f32', default: 50, min: 0 },
  /** Тип работы (индекс) */
  type: { type: 'ui8', default: 0 },
  /** Минимальный уровень образования для работы */
  minEducationLevel: { type: 'ui8', default: 0, min: 0, max: 5 },
});

/**
 * Типы работ
 */
export enum JobType {
  CASHIER = 'cashier', // Кассир в магазине
  MANAGER = 'manager', // Менеджер
  WORKER = 'worker', // Рабочий
  CLERK = 'clerk', // Клерк
}

/**
 * Тип для данных рабочего места
 */
export type WorkplaceData = {
  capacity: number;
  occupied: number;
  buildingId: number;
  salary: number;
  type: number;
  minEducationLevel: number;
};
