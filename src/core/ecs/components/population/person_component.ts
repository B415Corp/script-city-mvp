import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Базовые данные человека
 * Содержит фундаментальную информацию о жителе
 */
export const Person = defineComponent('Person', {
  /** Возраст в годах */
  age: { type: 'ui8', default: 25, min: 0, max: 120 },
  /** Пол: 0 = мужской, 1 = женский */
  gender: { type: 'ui8', default: 0 },
  /** Имя человека (индекс в массиве имен) */
  firstName: { type: 'ui16', default: 0 },
  /** Фамилия человека (индекс в массиве фамилий) */
  lastName: { type: 'ui16', default: 0 },
});

/**
 * Пол человека
 */
export enum Gender {
  MALE = 0,
  FEMALE = 1,
}

/**
 * Уровни образования
 */
export enum EducationLevel {
  NONE = 1, // Без образования
  PRIMARY = 2, // Начальное
  SECONDARY = 3, // Среднее
  COLLEGE = 4, // Колледж
  UNIVERSITY = 5, // Высшее
}

/**
 * Тип для данных человека
 */
export type PersonData = {
  age: number;
  gender: Gender;
  firstName: number;
  lastName: number;
};
