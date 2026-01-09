/**
 * Базовые данные человека
 * Содержит фундаментальную информацию о жителе
 */
export const Person = {
  /** Возраст в годах */
  age: [] as number[],
  /** Пол: 0 = мужской, 1 = женский */
  gender: [] as number[],
  /** Имя человека */
  name: [] as string[],
  /** Уровень образования (1-5: Без образования, Начальное, Среднее, Колледж, Высшее) */
  education: [] as number[],
} as const;

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
  name: string;
  education: EducationLevel;
};
