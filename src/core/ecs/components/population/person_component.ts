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
  name: [] as string[]
} as const;

/**
 * Пол человека
 */
export enum Gender {
  MALE = 0,
  FEMALE = 1
}

/**
 * Тип для данных человека
 */
export type PersonData = {
  age: number;
  gender: Gender;
  name: string;
};
