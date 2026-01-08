/**
 * Данные события LogicTick
 * Содержит только техническую информацию о тике
 */
export interface LogicTickData {
  /** Время тика в миллисекундах */
  delta: number;
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
export type SetSpeedPayload = { speed: 10 | 30 | 60 };
