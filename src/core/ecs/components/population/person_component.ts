import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Базовые данные человека
 * Содержит фундаментальную информацию о жителе
 */
export const Person = createSimpleComponent('Person', {
  /** Возраст в годах */
  age: 25,
  /** Пол: 0 = мужской, 1 = женский */
  gender: 0,
  /** Имя человека (индекс в массиве имен) */
  firstName: 0,
  /** Фамилия человека (индекс в массиве фамилий) */
  lastName: 0,
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
