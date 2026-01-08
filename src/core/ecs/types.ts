/**
 * Данные обновления игрового времени
 */
export interface GameTimeUpdateData {
  /** Общее время в минутах */
  totalMinutes: number;
  /** Время дня в формате HH:MM */
  timeOfDay: string;
  /** Полная дата в формате DD.MM.YYYY */
  date: string;
  /** Номер дня (общий) */
  day: number;
  /** Год */
  year: number;
  /** Месяц (1-12) */
  month: number;
  /** День месяца (1-31) */
  dayOfMonth: number;
  /** Час дня (0-23) */
  hour: number;
  /** Минута часа (0-59) */
  minute: number;
  /** Время дня в минутах от начала дня */
  minutesOfDay: number;
}
