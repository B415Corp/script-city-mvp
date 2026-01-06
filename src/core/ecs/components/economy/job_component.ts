/**
 * Вакансия/работа
 * Определяет доступные рабочие места в городе
 */
export const Job = {
  /** Название должности */
  title: [] as string[],
  /** Зарплата */
  salary: [] as number[],
  /** Требуемые навыки/требования */
  requirements: [] as string[][],
  /** Доступна ли вакансия */
  available: [] as boolean[]
} as const;

/**
 * Тип для данных вакансии
 */
export type JobData = {
  title: string;
  salary: number;
  requirements: string[];
  available: boolean;
};
