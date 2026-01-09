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
  DayPhase,
} from '../../components';

/**
 * Система работы жителей
 */
export const WorkSystem: System = {
  name: 'Work',
  components: ['Person', 'Citizen', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const timeService = extraData as import('../../../tick/time_service').TimeService | undefined;
    if (!timeService) {
      console.log('WorkSystem: No TimeService');
      return;
    }

    // Начисляем зарплату один раз в день во время работы
    const currentDay = timeService.getDay();
    const minutesOfDay = timeService.getMinutesOfDay();

    // Логируем время каждый час для отладки
    const hour = Math.floor(minutesOfDay / 60);
    if (minutesOfDay % 60 === 0) {
      console.log(`WorkSystem: Day ${currentDay}, Hour ${hour}`);
    }

    // Начисляем зарплату всем работающим жителям один раз в день
    for (const eid of entities) {
      // Проверяем, что у жителя есть работа
      if (Citizen.workplace[eid] && Citizen.workplace[eid] > 0) {
        const lastWorkDay = Citizen.lastWorkDay?.[eid] || 0;

        if (lastWorkDay < currentDay) {
          // Начисляем дневную зарплату
          const salary = Citizen.salary[eid] || 100;
          const dailySalary = salary / 7; // 7 рабочих дней в неделю
          Citizen.money[eid] += dailySalary;
          Citizen.lastWorkDay[eid] = currentDay;

          console.log(
            `Entity ${eid} received daily salary! Money: ${Citizen.money[eid].toFixed(0)} (+${dailySalary.toFixed(0)}), Day: ${currentDay}`,
          );
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
    const currentPhase = getCurrentDayPhase(minutesOfDay);

    console.log(
      `📅 ScheduleManager: Time ${Math.floor(minutesOfDay / 60)}:${String(minutesOfDay % 60).padStart(2, '0')}, Phase: ${currentPhase}`,
    );

    // Для каждого жителя проверяем, изменилась ли фаза, и вызываем активность только при изменении
    for (const eid of entities) {
      const entityType = Schedule.entityType[eid] as 'citizen';
      const schedule = DEFAULT_SCHEDULES[entityType];
      const previousPhase = Schedule.currentPhase[eid] as DayPhase | undefined;

      // Если фаза изменилась, выполняем новую активность (только один раз)
      if (previousPhase !== currentPhase && schedule && schedule[currentPhase]) {
        const activity = schedule[currentPhase];
        Schedule.currentPhase[eid] = currentPhase;
        Schedule.currentActivity[eid] = activity.activity;
        Schedule.activityExecuted[eid] = true;
        executeScheduledActivity(world, eid, activity, currentPhase);

        console.log(
          `🔄 Entity ${eid} changed phase: ${previousPhase} → ${currentPhase}, activity: ${activity.activity}`,
        );
      }
      // Если фаза не изменилась, но активность еще не выполнялась (на случай перезапуска), выполняем
      else if (
        previousPhase === currentPhase &&
        !Schedule.activityExecuted[eid] &&
        schedule &&
        schedule[currentPhase]
      ) {
        const activity = schedule[currentPhase];
        Schedule.currentActivity[eid] = activity.activity;
        Schedule.activityExecuted[eid] = true;
        executeScheduledActivity(world, eid, activity, currentPhase);

        console.log(
          `🔄 Entity ${eid} executing activity for current phase: ${currentPhase}, activity: ${activity.activity}`,
        );
      }
    }
  },
};

/**
 * Определяет текущую фазу дня по времени в минутах
 */
function getCurrentDayPhase(minutesOfDay: number): DayPhase {
  const hour = minutesOfDay / 60;

  if (hour >= 22 || hour < 6) return 'night'; // 22:00 - 6:00
  if (hour >= 18) return 'evening'; // 18:00 - 22:00
  if (hour >= 12) return 'day'; // 12:00 - 18:00
  if (hour >= 6) return 'morning'; // 6:00 - 12:00
  return 'dawn'; // 0:00 - 6:00 (резерв)
}

/**
 * Выполняет запланированную активность для жителя
 */
function executeScheduledActivity(
  world: World,
  eid: EntityId,
  activity: { activity: string; system?: string },
  phase: DayPhase,
): void {
  const systemName = activity.system;

  console.log(`🏃 Entity ${eid} started ${activity.activity} (${phase})`);

  // Обновляем позицию жителя в зависимости от активности
  updateCitizenPosition(world, eid, activity.activity);

  // Здесь только логируем начало активности
  // Фактические действия выполняются отдельными системами каждый тик
  switch (systemName) {
    case 'WorkSystem':
      console.log(`💼 Entity ${eid} started working!`);
      break;

    case 'MovementSystem':
      console.log(`🏠 Entity ${eid} moved home!`);
      break;

    default:
      console.log(`❓ Entity ${eid} - activity: ${activity.activity}`);
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
    for (const eid of entities) {
      const currentActivity = Schedule.currentActivity[eid];
      if (currentActivity) {
        updateCitizenPosition(world, eid, currentActivity);
      }
    }
  },
};

/**
 * Обновляет позицию жителя в зависимости от его активности
 */
function updateCitizenPosition(world: World, eid: EntityId, activity: string): void {
  const homeId = Citizen.home[eid];
  const workplaceId = Citizen.workplace[eid];

  switch (activity) {
    case 'work':
      // На работе
      if (workplaceId !== undefined) {
        try {
          const workplaceEntities = query(world, [Workplace, Position]);
          const workEntity = workplaceEntities.find((entityId: number) => entityId === workplaceId);
          if (workEntity !== undefined) {
            Position.x[eid] = Position.x[workEntity];
            Position.y[eid] = Position.y[workEntity];
            console.log(
              `💼 Citizen ${eid} moved to work at (${Position.x[eid]}, ${Position.y[eid]})`,
            );
          }
        } catch (error) {
          console.warn(`Could not find workplace position for citizen ${eid}`);
        }
      }
      break;

    case 'idle':
    default:
      // Дома (все нерабочие активности)
      if (homeId !== undefined) {
        try {
          const residentialEntities = query(world, [Residential, Position]);
          const homeEntity = residentialEntities.find((entityId: number) => entityId === homeId);
          if (homeEntity !== undefined) {
            Position.x[eid] = Position.x[homeEntity];
            Position.y[eid] = Position.y[homeEntity];
            console.log(`🏠 Citizen ${eid} moved home to (${Position.x[eid]}, ${Position.y[eid]})`);
          }
        } catch (error) {
          console.warn(`Could not find home position for citizen ${eid}`);
        }
      }
      break;
  }
}
