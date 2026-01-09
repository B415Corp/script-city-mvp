import { EntityId } from 'bitecs';
import { EducationLevel } from '../population/person_component';

/**
 * Рабочее место
 * Определяет доступные вакансии и условия работы
 */
export const Workplace = {
  /** Тип работы */
  jobType: [] as string[],
  /** Зарплата за рабочий день */
  salary: [] as number[],
  /** Текущий работник (может быть undefined) */
  worker: [] as (EntityId | undefined)[],
  /** Здание, где находится рабочее место */
  building: [] as EntityId[],
  /** Минимальный уровень образования для работы */
  minEducationLevel: [] as number[],
} as const;

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
  jobType: string;
  salary: number;
  worker?: EntityId;
  building: EntityId;
  minEducationLevel: EducationLevel;
};
