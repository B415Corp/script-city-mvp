/**
 * Данные обновления игрового времени
 */
export interface GameTimeUpdateData {
  /** Общее время в минутах */
  totalMinutes: number;
  /** Время дня в формате HH:MM */
  timeOfDay: string;
  /** Номер дня */
  day: number;
  /** Час дня (0-23) */
  hour: number;
  /** Минута часа (0-59) */
  minute: number;
  /** Время дня в минутах от начала дня */
  minutesOfDay: number;
}
