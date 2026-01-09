/**
 * Компонент расписания для управления поведением сущностей по времени суток
 * Позволяет задавать активности для разных фаз дня и модификаторы поведения
 */

export type DayPhase = 'dawn' | 'morning' | 'day' | 'evening' | 'night';

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

export const Schedule = {
  /** Расписание по фазам дня */
  phaseSchedule: [] as Record<DayPhase, Activity>[],
  /** Текущая активность */
  currentActivity: [] as string[],
  /** Текущая фаза дня */
  currentPhase: [] as string[],
  /** Флаг, показывающий, была ли активность выполнена в текущей фазе */
  activityExecuted: [] as boolean[],
  /** Время следующей активности (минуты от начала дня) */
  nextActivityTime: [] as number[],
  /** Модификаторы расписания */
  modifiers: [] as ScheduleModifier[][],
  /** Тип сущности для выбора подходящего расписания */
  entityType: [] as string[],
} as const;

/**
 * Типы расписаний для разных сущностей
 */
export type EntityType = 'citizen';

/**
 * Предустановленные расписания для разных типов сущностей
 */
export const DEFAULT_SCHEDULES: Record<EntityType, Record<DayPhase, Activity>> = {
  citizen: {
    dawn: { activity: 'idle', duration: 360, system: 'MovementSystem' },
    morning: { activity: 'idle', duration: 60, system: 'MovementSystem' },
    day: { activity: 'work', duration: 480, system: 'WorkSystem' },
    evening: { activity: 'idle', duration: 60, system: 'MovementSystem' },
    night: { activity: 'idle', duration: 480, system: 'MovementSystem' },
  },
};

/**
 * Тип для данных расписания
 */
export type ScheduleData = {
  phaseSchedule: Record<DayPhase, Activity>;
  modifiers?: ScheduleModifier[];
  entityType: EntityType;
  currentPhase?: DayPhase;
  activityExecuted?: boolean;
};
