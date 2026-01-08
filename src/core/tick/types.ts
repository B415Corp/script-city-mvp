/**
 * Данные события LogicTick
 * Содержит информацию о тике и игровом времени
 */
export interface LogicTickData {
  /** Время тика в миллисекундах */
  delta: number;
  /** Общее игровое время в минутах */
  gameTime: number;
  /** Время дня в минутах от начала дня */
  gameTimeOfDay: number;
  /** Текущий день */
  day: number;
  /** Количество выполненных тиков в этом обновлении */
  ticksExecuted: number;
}

/**
 * Данные события TickStarted
 * Содержит информацию о начале тика
 */
export interface TickStartedPayload {
  /** Время тика в миллисекундах */
  time: number;
  /** Дельта времени с предыдущего тика */
  delta: number;
}

/**
 * Типы для контроллеров
 */
export type SetSpeedPayload = { speed: number };
