import { World, EntityId, query } from 'bitecs';
import { System } from '../types';
import { Person, Citizen, Needs, Schedule, Position, Residential, Commercial, Workplace, DEFAULT_SCHEDULES, DayPhase } from '../../components';

/**
 * Система пробуждения жителей
 */
export const WakeUpSystem: System = {
  name: 'WakeUp',
  components: ['Person', 'Citizen', 'Needs', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Выполняем только если текущая активность - wake_up
      if (Schedule.currentActivity[eid] === 'wake_up') {
        // Логика пробуждения - частичное восстановление энергии
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 30 * deltaTime);
        Needs.food[eid] = Math.min(100, Needs.food[eid] + 15 * deltaTime);

        console.log(
          `Entity ${eid} waking up! Energy: ${Citizen.energy[eid]}, Hunger: ${Needs.food[eid]}`,
        );
      }
    }
  },
};

/**
 * Система работы жителей
 */
export const WorkSystem: System = {
  name: 'Work',
  components: ['Person', 'Citizen', 'Needs', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Выполняем только если текущая активность - work
      if (Schedule.currentActivity[eid] === 'work') {
        // Логика работы - тратим энергию, получаем зарплату
        Citizen.energy[eid] = Math.max(0, Citizen.energy[eid] - 8 * deltaTime);
        Citizen.money[eid] += 75 * deltaTime; // Зарплата за работу

        // Во время работы немного хочется есть
        Needs.food[eid] = Math.min(100, Needs.food[eid] + 5 * deltaTime);

        console.log(
          `Entity ${eid} working! Energy: ${Citizen.energy[eid]}, Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
        );
      }
    }
  },
};

/**
 * Система кормления жителей (покупка и потребление еды)
 */
export const FeedingSystem: System = {
  name: 'Feeding',
  components: ['Person', 'Citizen', 'Needs', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Выполняем только если текущая активность - feeding (еда)
      // Пока оставим как есть, но это можно изменить в будущем
      // Проверяем, есть ли деньги на еду (30 монет за прием пищи)
      const foodCost = 30;
      if (Citizen.money[eid] >= foodCost) {
        // Покупаем еду и едим
        Citizen.money[eid] -= foodCost * deltaTime;
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 50 * deltaTime); // Хорошо поели

        // После еды немного восстанавливается энергия
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 10 * deltaTime);

        console.log(
          `Entity ${eid} eating! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
        );
      } else {
        // Не хватает денег - только частичное утоление голода
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 20 * deltaTime);
        console.log(
          `Entity ${eid} eating little (no money)! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
        );
      }
    }
  },
};

/**
 * Система принятия решения о покупках или еде
 */
export const ShoppingDecisionSystem: System = {
  name: 'ShoppingDecision',
  components: ['Person', 'Citizen', 'Needs', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Выполняем только если текущая активность - shopping_or_eat
      if (Schedule.currentActivity[eid] === 'shopping_or_eat') {
        const money = Citizen.money[eid];
        const hunger = Needs.food[eid];

        // Логика принятия решения:
        // Если мало денег (меньше 50) ИЛИ голод не слишком сильный (< 70) -> едим дома
        // Если достаточно денег (>= 50) И голод сильный (>= 70) -> идем в магазин

        if (money >= 50 && hunger >= 70) {
          // Идем в магазин - тратим деньги, хорошо едим
          Citizen.money[eid] -= 50 * deltaTime;
          Needs.food[eid] = Math.max(0, Needs.food[eid] - 80 * deltaTime); // Отличный ужин
          Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 15 * deltaTime); // Энергия от хорошей еды

          console.log(
            `Entity ${eid} shopping! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
          );
        } else {
          // Едим дома - если хватает денег
          if (money >= 30) {
            Citizen.money[eid] -= 30 * deltaTime;
            Needs.food[eid] = Math.max(0, Needs.food[eid] - 60 * deltaTime); // Нормальный ужин
            Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 10 * deltaTime);

            console.log(
              `Entity ${eid} eating at home! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
            );
          } else {
            // Не хватает денег даже на домашнюю еду
            Needs.food[eid] = Math.max(0, Needs.food[eid] - 30 * deltaTime); // Едим что есть
            console.log(
              `Entity ${eid} eating little (poor)! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
            );
          }
        }
      }
    }
  },
};

/**
 * Система сна жителей
 */
export const SleepSystem: System = {
  name: 'Sleep',
  components: ['Person', 'Citizen', 'Needs', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Выполняем только если текущая активность - sleep
      if (Schedule.currentActivity[eid] === 'sleep') {
        // Логика сна - полное восстановление энергии
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 50 * deltaTime); // Полный отдых

        // Во время сна немного хочется есть утром
        Needs.food[eid] = Math.min(100, Needs.food[eid] + 10 * deltaTime);

        console.log(
          `Entity ${eid} sleeping! Energy: ${Citizen.energy[eid]}, Hunger: ${Needs.food[eid]}`,
        );
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
    const gameTime = extraData as number | undefined;
    if (!gameTime) return;

    // Определяем время суток (в минутах от начала дня)
    const minutesOfDay = gameTime % (24 * 60);
    const currentPhase = getCurrentDayPhase(minutesOfDay);

    console.log(`📅 ScheduleManager: Time ${Math.floor(minutesOfDay / 60)}:${String(minutesOfDay % 60).padStart(2, '0')}, Phase: ${currentPhase}`);

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

        console.log(`🔄 Entity ${eid} changed phase: ${previousPhase} → ${currentPhase}, activity: ${activity.activity}`);
      }
      // Если фаза не изменилась, но активность еще не выполнялась (на случай перезапуска), выполняем
      else if (previousPhase === currentPhase && !Schedule.activityExecuted[eid] && schedule && schedule[currentPhase]) {
        const activity = schedule[currentPhase];
        Schedule.currentActivity[eid] = activity.activity;
        Schedule.activityExecuted[eid] = true;
        executeScheduledActivity(world, eid, activity, currentPhase);

        console.log(`🔄 Entity ${eid} executing activity for current phase: ${currentPhase}, activity: ${activity.activity}`);
      }
    }
  },
};

/**
 * Определяет текущую фазу дня по времени в минутах
 */
function getCurrentDayPhase(minutesOfDay: number): DayPhase {
  const hour = minutesOfDay / 60;

  if (hour >= 22 || hour < 6) return 'night';      // 22:00 - 6:00
  if (hour >= 18) return 'evening';                // 18:00 - 22:00
  if (hour >= 12) return 'day';                    // 12:00 - 18:00
  if (hour >= 6) return 'morning';                 // 6:00 - 12:00
  return 'dawn';                                   // 0:00 - 6:00 (резерв)
}

/**
 * Выполняет запланированную активность для жителя
 */
function executeScheduledActivity(world: World, eid: EntityId, activity: any, phase: DayPhase): void {
  const systemName = activity.system;

  console.log(`🏃 Entity ${eid} started ${activity.activity} (${phase})`);

  // Обновляем позицию жителя в зависимости от активности
  updateCitizenPosition(world, eid, activity.activity);

  // Здесь только логируем начало активности
  // Фактические действия выполняются отдельными системами каждый тик
  switch (systemName) {
    case 'WakeUpSystem':
      console.log(`🌅 Entity ${eid} is waking up!`);
      break;

    case 'WorkSystem':
      console.log(`💼 Entity ${eid} started working!`);
      break;

    case 'ShoppingDecisionSystem':
      console.log(`🛒 Entity ${eid} is deciding about shopping/eating!`);
      break;

    case 'SleepSystem':
      console.log(`😴 Entity ${eid} went to sleep!`);
      break;

    default:
      console.log(`❓ Entity ${eid} - unknown activity: ${systemName}`);
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
    // Система работает через executeScheduledActivity, которая вызывается при изменении фазы
    // Здесь можно добавить дополнительную логику перемещения если нужно
  },
};

/**
 * Обновляет позицию жителя в зависимости от его активности
 */
function updateCitizenPosition(world: World, eid: EntityId, activity: string): void {
  const homeId = Citizen.home[eid];
  const workplaceId = Citizen.workplace[eid];

  switch (activity) {
    case 'sleep':
    case 'wake_up':
      // Дома
      if (homeId !== undefined) {
        // Ищем позицию дома
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

    case 'work':
      // На работе
      if (workplaceId !== undefined) {
        try {
          const workplaceEntities = query(world, [Workplace, Position]);
          const workEntity = workplaceEntities.find((entityId: number) => entityId === workplaceId);
          if (workEntity !== undefined) {
            Position.x[eid] = Position.x[workEntity];
            Position.y[eid] = Position.y[workEntity];
            console.log(`💼 Citizen ${eid} moved to work at (${Position.x[eid]}, ${Position.y[eid]})`);
          }
        } catch (error) {
          console.warn(`Could not find workplace position for citizen ${eid}`);
        }
      }
      break;

    case 'shopping_or_eat':
      // В магазине (выбираем случайный магазин)
      try {
        const shopEntities = query(world, [Commercial, Position]);
        if (shopEntities.length > 0) {
          const randomShop = shopEntities[Math.floor(Math.random() * shopEntities.length)];
          Position.x[eid] = Position.x[randomShop];
          Position.y[eid] = Position.y[randomShop];
          console.log(`🛒 Citizen ${eid} moved shopping to (${Position.x[eid]}, ${Position.y[eid]})`);
        }
      } catch (error) {
        console.warn(`Could not find shop position for citizen ${eid}`);
      }
      break;

    default:
      console.log(`📍 Citizen ${eid} stays at current position for activity: ${activity}`);
  }
}
