import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Компонент расписания для управления поведением сущностей по времени суток
 */

export type DayPhase = 'dawn' | 'morning' | 'day' | 'evening' | 'night';

// Старые типы для совместимости
export interface Activity {
  /** Название активности */
  activity: string;
  /** Длительность в минутах */
  duration: number;
  /** Система, которая должна быть вызвана */
  system?: string;
  /** Дополнительные параметры */
  params?: Record<string, unknown>;
}

export interface ScheduleModifier {
  /** Тип модификации */
  type: 'delay' | 'speed_up' | 'skip' | 'repeat';
  /** Условие применения модификатора */
  condition: string; // Название условия для проверки
  /** Значение модификации (минуты для delay, множитель для speed_up) */
  value: number;
  /** Приоритет модификатора (выше = важнее) */
  priority?: number;
}

export const DAY_PHASES = {
  dawn: 0,
  morning: 1,
  day: 2,
  evening: 3,
  night: 4,
} as const;

export const ACTIVITIES = {
  idle: 0,
  work: 1,
  sleep: 2,
  eat: 3,
  shop: 4,
} as const;

export type DayPhaseIndex = (typeof DAY_PHASES)[keyof typeof DAY_PHASES];
export type ActivityIndex = (typeof ACTIVITIES)[keyof typeof ACTIVITIES];

export const Schedule = defineComponent('Schedule', {
  /** Текущая фаза дня (индекс из DAY_PHASES) */
  currentPhase: { type: 'ui8', default: 0 },
  /** Текущая активность (индекс из ACTIVITIES) */
  currentActivity: { type: 'ui8', default: 0 },
  /** Флаг, показывающий, была ли активность выполнена в текущей фазе */
  activityExecuted: { type: 'ui8', default: 0 },
  /** Время следующей активности (минуты от начала дня) */
  nextActivityTime: { type: 'ui16', default: 0 },
  /** Тип сущности для выбора подходящего расписания */
  entityType: { type: 'ui8', default: 0 },
});

/**
 * Типы расписаний для разных сущностей
 */
export type EntityType = 'citizen';

/**
 * Тип для данных расписания
 */
export type ScheduleData = {
  currentPhase: number;
  currentActivity: number;
  activityExecuted: number;
  nextActivityTime: number;
  entityType: number;
};

/**
 * Предустановленные расписания для разных типов сущностей
 * Совместимый формат для существующего кода
 */
export const DEFAULT_SCHEDULES: Record<EntityType, Record<DayPhase, Activity>> = {
  citizen: {
    dawn: { activity: 'idle', duration: 360, system: 'Movement' },
    morning: { activity: 'idle', duration: 60, system: 'Movement' },
    day: { activity: 'work', duration: 480, system: 'Work' },
    evening: { activity: 'idle', duration: 60, system: 'Movement' },
    night: { activity: 'idle', duration: 480, system: 'Movement' },
  },
};
