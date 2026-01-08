import { World, EntityId } from 'bitecs';
import { System } from '../types';
import { Person, Citizen, Needs } from '../../components';

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
