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
export type SetSpeedPayload = { speed: 10 | 60 | 240 };

/**
 * Условия времени для проверок
 */
export enum TimeConditions {
  MORNING = 'morning', // 6:00-12:00
  AFTERNOON = 'afternoon', // 12:00-18:00
  EVENING = 'evening', // 18:00-22:00
  NIGHT = 'night', // 22:00-6:00
  WORK_HOURS = 'work_hours', // 9:00-17:00
  FIRING_TIME = 'firing_time', // 18:00-20:00
}

/**
 * Интерфейс для зависимостей TimeService
 */
export interface ITimeServiceDependencies {
  getTimeData(): import('../ecs/types').GameTimeUpdateData;
  setTime?(minutes: number): void;
}

/**
 * Данные отладки времени
 */
export interface TimeDebugInfo {
  totalMinutes: number;
  timeOfDay: string;
  date: string;
  day: number;
  hour: number;
  minute: number;
  condition: TimeConditions;
  isWorkHours: boolean;
  isWeekend: boolean;
}
