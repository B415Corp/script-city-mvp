import { World, EntityId, query } from 'bitecs';
import { System } from '../types';
import {
  Person,
  Citizen,
  Schedule,
  Position,
  Residential,
  Workplace,
  DEFAULT_SCHEDULES,
  // DAY_PHASES,
  // ACTIVITIES,
} from '../../components';
import { Logger } from '../../../utils/logger';
import { DAY_PHASES, ACTIVITIES } from '../../components/shared/schedule_component';

const logger = Logger.create('ScheduleSystems');

/**
 * Система работы жителей
 */
export const WorkSystem: System = {
  name: 'Work',
  components: ['Person', 'Citizen', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const timeService = extraData as import('../../../tick/time_service').TimeService | undefined;
    if (!timeService) {
      logger.warn('WorkSystem: No TimeService');
      return;
    }

    // Начисляем зарплату один раз в день во время работы
    const currentDay = timeService.getDay();

    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS - МАКСИМАЛЬНАЯ ПРОИЗВОДИТЕЛЬНОСТЬ
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Проверяем, что у жителя есть работа
      if (Citizen.workplace[eid] > 0) {
        // Проверяем, что еще не работал сегодня
        if (Citizen.lastWorkDay[eid] < currentDay) {
          // Начисляем дневную зарплату
          const dailySalary = Citizen.salary[eid] / 7; // 7 рабочих дней в неделю

          // ✅ ПРЯМАЯ ЗАПИСЬ В TYPEDARRAY - 0 OVERHEAD
          Citizen.money[eid] += dailySalary;
          Citizen.lastWorkDay[eid] = currentDay;
          Citizen.experience[eid] += 1; // Начисляем опыт работы
        }
      }
    }
  },
};

/**
 * Система управления расписанием жителей
 * Вызывает нужные системы в зависимости от времени суток
 */
export const ScheduleManagerSystem: System = {
  name: 'ScheduleManager',
  components: ['Person', 'Citizen', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const timeService = extraData as import('../../../tick/time_service').TimeService | undefined;
    if (!timeService) return;

    // Определяем время суток (в минутах от начала дня)
    const minutesOfDay = timeService.getMinutesOfDay();
    const currentPhaseIndex = getCurrentDayPhaseIndex(minutesOfDay);

    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Получаем расписание для гражданина (пока только citizen поддерживается)
      const schedule = DEFAULT_SCHEDULES.citizen;
      const previousPhase = Schedule.currentPhase[eid];

      // Если фаза изменилась, выполняем новую активность (только один раз)
      if (previousPhase !== currentPhaseIndex && schedule && schedule[currentPhaseIndex]) {
        const activity = schedule[currentPhaseIndex];
        Schedule.currentPhase[eid] = currentPhaseIndex;
        Schedule.currentActivity[eid] = activity.activity;
        Schedule.activityExecuted[eid] = 1;
        executeScheduledActivity(world, eid, activity, currentPhaseIndex);
      }
      // Если фаза не изменилась, но активность еще не выполнялась (на случай перезапуска), выполняем
      else if (
        previousPhase === currentPhaseIndex &&
        Schedule.activityExecuted[eid] === 0 &&
        schedule &&
        schedule[currentPhaseIndex]
      ) {
        const activity = schedule[currentPhaseIndex];
        Schedule.currentActivity[eid] = activity.activity;
        Schedule.activityExecuted[eid] = 1;
        executeScheduledActivity(world, eid, activity, currentPhaseIndex);
      }
    }
  },
};

/**
 * Определяет текущую фазу дня по времени в минутах (возвращает индекс)
 */
function getCurrentDayPhaseIndex(minutesOfDay: number): number {
  const hour = minutesOfDay / 60;

  if (hour >= 22 || hour < 6) return DAY_PHASES.night; // 22:00 - 6:00
  if (hour >= 18) return DAY_PHASES.evening; // 18:00 - 22:00
  if (hour >= 12) return DAY_PHASES.day; // 12:00 - 18:00
  if (hour >= 6) return DAY_PHASES.morning; // 6:00 - 12:00
  return DAY_PHASES.dawn; // 0:00 - 6:00 (резерв)
}

/**
 * Выполняет запланированную активность для жителя
 */
function executeScheduledActivity(
  world: World,
  eid: EntityId,
  activity: { activity: string; system?: string },
  phaseIndex: number,
): void {
  const systemName = activity.system;

  // Обновляем позицию жителя в зависимости от активности
  updateCitizenPosition(world, eid, activity.activity);

  // Здесь только логируем начало активности
  // Фактические действия выполняются отдельными системами каждый тик
  switch (systemName) {
    case 'WorkSystem':
      break;

    case 'MovementSystem':
      break;

    default:
      break;
  }
}

/**
 * Система перемещения жителей
 * Обновляет позицию жителей в зависимости от их активности
 */
export const MovementSystem: System = {
  name: 'Movement',
  components: ['Person', 'Citizen', 'Schedule', 'Position'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS - МАКСИМАЛЬНАЯ ПРОИЗВОДИТЕЛЬНОСТЬ
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const currentActivity = Schedule.currentActivity[eid];

      if (currentActivity >= 0) {
        // Проверяем, что активность установлена
        updateCitizenPosition(world, eid, currentActivity);
      }
    }
  },
};

/**
 * Обновляет позицию жителя в зависимости от его активности
 */
function updateCitizenPosition(world: World, eid: EntityId, activityIndex: number): void {
  const homeId = Citizen.home[eid];
  const workplaceId = Citizen.workplace[eid];

  switch (activityIndex) {
    case ACTIVITIES.work:
      // На работе
      if (workplaceId > 0) {
        try {
          const workplaceEntities = query(world, [Workplace, Position]);
          const workEntity = workplaceEntities.find((entityId: number) => entityId === workplaceId);
          if (workEntity !== undefined) {
            Position.x[eid] = Position.x[workEntity];
            Position.y[eid] = Position.y[workEntity];
          }
        } catch (error) {
          console.warn(`Could not find workplace position for citizen ${eid}`);
        }
      }
      break;

    case ACTIVITIES.idle:
    case ACTIVITIES.sleep:
    case ACTIVITIES.eat:
    case ACTIVITIES.shop:
    default:
      // Дома (все нерабочие активности)
      if (homeId > 0) {
        try {
          const residentialEntities = query(world, [Residential, Position]);
          const homeEntity = residentialEntities.find((entityId: number) => entityId === homeId);
          if (homeEntity !== undefined) {
            Position.x[eid] = Position.x[homeEntity];
            Position.y[eid] = Position.y[homeEntity];
          }
        } catch (error) {
          console.warn(`Could not find home position for citizen ${eid}`);
        }
      }
      break;
    }
}

// ✅ Функции-фабрики для создания систем согласно плану рефакторинга BitECS 0.4.0
import type { TimeService } from '../../../tick/time_service';

export function createWorkSystem(timeService: TimeService) {
  return function workSystem(world: World, delta?: number) {
    const currentDay = timeService.getDay();
    const entities = query(world, [Citizen, Person]);

    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS - МАКСИМАЛЬНАЯ ПРОИЗВОДИТЕЛЬНОСТЬ
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Проверяем, что у жителя есть работа
      if (Citizen.workplace[eid] > 0) {
        // Проверяем, что еще не работал сегодня
        if (Citizen.lastWorkDay[eid] < currentDay) {
          // Начисляем дневную зарплату
          const dailySalary = Citizen.salary[eid] / 7; // 7 рабочих дней в неделю

          // ✅ ПРЯМАЯ ЗАПИСЬ В TYPEDARRAY - 0 OVERHEAD
          Citizen.money[eid] += dailySalary;
          Citizen.lastWorkDay[eid] = currentDay;
          Citizen.experience[eid] += 1; // Начисляем опыт работы
        }
      }
    }
  };
}

export function createMovementSystem() {
  return function movementSystem(world: World, delta?: number) {
    const entities = query(world, [Position, Citizen, Schedule]);

    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS - МАКСИМАЛЬНАЯ ПРОИЗВОДИТЕЛЬНОСТЬ
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const currentActivity = Schedule.currentActivity[eid];

      if (currentActivity >= 0) {
        // Проверяем, что активность установлена
        updateCitizenPosition(world, eid, currentActivity);
      }
    }
  };
}

export function createHappinessSystem(timeService: TimeService) {
  return function happinessSystem(world: World, delta?: number) {
    const entities = query(world, [Citizen]);

    // ✅ ПРЯМОЙ ДОСТУП К TYPEDARRAYS
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      let happiness = Citizen.happiness[eid];
      const money = Citizen.money[eid];
      const isEmployed = Citizen.workplace[eid] > 0; // Boolean as number
      const isHomeless = Citizen.home[eid] === 0; // Boolean as number

      // Факторы счастья
      if (isHomeless) happiness -= 10;
      if (!isEmployed) happiness -= 5;
      if (money < 50) happiness -= 5;
      else if (money > 500) happiness += 2;

      // Ограничиваем [0, 100]
      happiness = Math.max(0, Math.min(100, happiness));

      // ✅ Прямая запись
      Citizen.happiness[eid] = happiness;
    }
  };
}
