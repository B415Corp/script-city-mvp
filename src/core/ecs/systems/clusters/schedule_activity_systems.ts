import { World, EntityId } from 'bitecs';
import { System } from '../types';
import { Person, Citizen, Needs, Schedule, DEFAULT_SCHEDULES, DayPhase } from '../../components';

/**
 * Система пробуждения жителей
 */
export const WakeUpSystem: System = {
  name: 'WakeUp',
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    console.log(`🌅 WakeUpSystem: Processing ${entities.length} entities`);

    for (const eid of entities) {
      // Логика пробуждения - частичное восстановление энергии
      Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 30);
      // После сна немного хочется есть
      Needs.food[eid] = Math.min(100, Needs.food[eid] + 15);

      console.log(
        `Entity ${eid} woke up! Energy: ${Citizen.energy[eid]}, Hunger: ${Needs.food[eid]}`,
      );
    }
  },
};

/**
 * Система работы жителей
 */
export const WorkSystem: System = {
  name: 'Work',
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    console.log(`💼 WorkSystem: Processing ${entities.length} entities`);

    for (const eid of entities) {
      // Логика работы - тратим энергию, получаем зарплату
      Citizen.energy[eid] = Math.max(0, Citizen.energy[eid] - 8);
      Citizen.money[eid] += 75; // Зарплата за работу

      // Во время работы немного хочется есть
      Needs.food[eid] = Math.min(100, Needs.food[eid] + 5);

      console.log(
        `Entity ${eid} worked! Energy: ${Citizen.energy[eid]}, Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
      );
    }
  },
};

/**
 * Система кормления жителей (покупка и потребление еды)
 */
export const FeedingSystem: System = {
  name: 'Feeding',
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    console.log(`🍽️ FeedingSystem: Processing ${entities.length} entities`);

    for (const eid of entities) {
      // Проверяем, есть ли деньги на еду (30 монет за прием пищи)
      const foodCost = 30;
      if (Citizen.money[eid] >= foodCost) {
        // Покупаем еду и едим
        Citizen.money[eid] -= foodCost;
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 50); // Хорошо поели

        // После еды немного восстанавливается энергия
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 10);

        console.log(
          `Entity ${eid} ate well! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
        );
      } else {
        // Не хватает денег - только частичное утоление голода
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 20);
        console.log(
          `Entity ${eid} ate little (no money)! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
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
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    console.log(`🛒 ShoppingDecisionSystem: Processing ${entities.length} entities`);

    for (const eid of entities) {
      const money = Citizen.money[eid];
      const hunger = Needs.food[eid];

      // Логика принятия решения:
      // Если мало денег (меньше 50) ИЛИ голод не слишком сильный (< 70) -> едим дома
      // Если достаточно денег (>= 50) И голод сильный (>= 70) -> идем в магазин

      if (money >= 50 && hunger >= 70) {
        // Идем в магазин - тратим деньги, хорошо едим
        Citizen.money[eid] -= 50; // Покупка продуктов
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 80); // Отличный ужин
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 15); // Энергия от хорошей еды

        console.log(
          `Entity ${eid} went shopping! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
        );
      } else {
        // Едим дома - если хватает денег
        if (money >= 30) {
          Citizen.money[eid] -= 30;
          Needs.food[eid] = Math.max(0, Needs.food[eid] - 60); // Нормальный ужин
          Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 10);

          console.log(
            `Entity ${eid} ate at home! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}, Energy: ${Citizen.energy[eid]}`,
          );
        } else {
          // Не хватает денег даже на домашнюю еду
          Needs.food[eid] = Math.max(0, Needs.food[eid] - 30); // Едим что есть
          console.log(
            `Entity ${eid} ate little (poor)! Money: ${Citizen.money[eid]}, Hunger: ${Needs.food[eid]}`,
          );
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
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    console.log(`😴 SleepSystem: Processing ${entities.length} entities`);

    for (const eid of entities) {
      // Логика сна - полное восстановление энергии
      Citizen.energy[eid] = 100; // Полный отдых

      // Во время сна немного хочется есть утром
      Needs.food[eid] = Math.min(100, Needs.food[eid] + 10);

      console.log(
        `Entity ${eid} slept! Energy: ${Citizen.energy[eid]}, Hunger: ${Needs.food[eid]}`,
      );
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

    // Для каждого жителя проверяем расписание и вызываем нужные системы
    for (const eid of entities) {
      const entityType = Schedule.entityType[eid] as 'citizen';
      const schedule = DEFAULT_SCHEDULES[entityType];

      if (schedule && schedule[currentPhase]) {
        const activity = schedule[currentPhase];
        executeScheduledActivity(world, eid, activity, currentPhase);
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

  console.log(`🏃 Entity ${eid} performing ${activity.activity} (${phase})`);

  // Имитируем вызов соответствующих систем
  switch (systemName) {
    case 'WakeUpSystem':
      // Пробуждение - частичное восстановление энергии
      Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 30);
      Needs.food[eid] = Math.min(100, Needs.food[eid] + 15);
      console.log(`🌅 Entity ${eid} woke up!`);
      break;

    case 'WorkSystem':
      // Работа - тратим энергию, получаем зарплату
      if (Citizen.energy[eid] > 20) {
        Citizen.energy[eid] = Math.max(0, Citizen.energy[eid] - 8);
        Citizen.money[eid] += 75; // Зарплата за работу
        Needs.food[eid] = Math.min(100, Needs.food[eid] + 5);
        console.log(`💼 Entity ${eid} worked! Money: ${Citizen.money[eid]}`);
      }
      break;

    case 'ShoppingDecisionSystem':
      // Решение о покупках или еде
      const money = Citizen.money[eid];
      const hunger = Needs.food[eid];

      if (money >= 50 && hunger >= 70) {
        // Идем в магазин
        Citizen.money[eid] -= 50;
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 80);
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 15);
        console.log(`🛒 Entity ${eid} went shopping!`);
      } else if (money >= 30) {
        // Едим дома
        Citizen.money[eid] -= 30;
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 60);
        Citizen.energy[eid] = Math.min(100, Citizen.energy[eid] + 10);
        console.log(`🍽️ Entity ${eid} ate at home!`);
      } else {
        // Едим что есть
        Needs.food[eid] = Math.max(0, Needs.food[eid] - 30);
        console.log(`🍽️ Entity ${eid} ate little (poor)!`);
      }
      break;

    case 'SleepSystem':
      // Сон - полное восстановление энергии
      Citizen.energy[eid] = 100;
      Needs.food[eid] = Math.min(100, Needs.food[eid] + 10);
      console.log(`😴 Entity ${eid} slept!`);
      break;

    default:
      console.log(`❓ Entity ${eid} - unknown activity: ${systemName}`);
  }
}
