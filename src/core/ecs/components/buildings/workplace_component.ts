import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Рабочее место
 * Определяет доступные вакансии и условия работы
 */
export const Workplace = createSimpleComponent('Workplace', {
  /** Максимальная вместимость (количество работников) */
  capacity: 10,
  /** Текущие работники (количество) */
  occupied: 0,
  /** ID здания */
  buildingId: 0,
  /** Зарплата за рабочий день */
  salary: 50.0,
  /** Тип работы (индекс) */
  type: 0,
  /** Минимальный уровень образования для работы */
  minEducationLevel: 0,
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
