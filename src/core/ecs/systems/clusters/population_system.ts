import { World, query } from 'bitecs';
import { Person, Citizen, Needs } from '../../components';
import { System } from '../types';

/**
 * Система управления населением
 * Обрабатывает базовую демографию: старение, рождение, смерть
 */
export const PopulationSystem: System = {
  name: 'Population',
  components: ['Person'], // Запрашиваем только Person компонент

  update(world: World, entities: readonly number[], delta?: number) {
    const deltaTime = delta || 1;

    for (const eid of entities) {
      // Старение (1 год каждые 365 игровых дней)
      const currentAge = Person.age[eid];
      Person.age[eid] = currentAge + deltaTime / 365;

      // Простая модель смертности (после 80 лет шанс смерти растет)
      if (currentAge > 80) {
        const deathChance = (currentAge - 80) * 0.01; // 1% дополнительного шанса на год
        if (Math.random() < deathChance) {
          // TODO: Обработать смерть (удалить сущность, обновить статистику)
          console.log(`Citizen ${eid} died at age ${currentAge.toFixed(1)}`);
        }
      }
    }
  },
};

/**
 * Система управления потребностями
 * Увеличивает уровни потребностей со временем
 */
export const NeedsSystem: System = {
  name: 'Needs',
  components: ['Needs'],

  update(world: World, entities: readonly number[], delta?: number) {
    const deltaTime = delta || 1;
    const increaseRate = deltaTime * 0.1; // Рост потребностей за тик

    for (const eid of entities) {
      // Увеличиваем все потребности
      Needs.food[eid] = Math.min(100, Needs.food[eid] + increaseRate);
      Needs.shopping[eid] = Math.min(100, Needs.shopping[eid] + increaseRate * 0.5);
      Needs.work[eid] = Math.min(100, Needs.work[eid] + increaseRate * 0.3);
      Needs.sleep[eid] = Math.min(100, Needs.sleep[eid] + increaseRate * 0.8);

      // Если потребности слишком высокие, уменьшаем счастье
      const avgNeeds = (Needs.food[eid] + Needs.shopping[eid] + Needs.sleep[eid]) / 3;
      if (avgNeeds > 70 && Citizen.happiness[eid] !== undefined) {
        Citizen.happiness[eid] = Math.max(0, Citizen.happiness[eid] - increaseRate * 0.5);
      }
    }
  },
};

/**
 * Система суточных рутин
 * Управляет поведением жителей в зависимости от времени суток
 */
export const DailyRoutineSystem: System = {
  name: 'DailyRoutine',
  components: ['Person', 'Citizen', 'Needs'],

  update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
    const gameTime = extraData as number | undefined;
    // Определяем время суток (предполагаем gameTime в минутах)
    const hourOfDay = gameTime ? (gameTime / 60) % 24 : 8; // По умолчанию утро

    for (const eid of entities) {
      const energy = Citizen.energy[eid];
      const sleepNeed = Needs.sleep[eid];

      // Логика сна
      if (hourOfDay >= 22 || hourOfDay < 6) {
        // Ночь
        if (sleepNeed > 50) {
          // Восстанавливаем энергию во сне
          Citizen.energy[eid] = Math.min(100, energy + (delta || 1) * 2);
          Needs.sleep[eid] = Math.max(0, sleepNeed - (delta || 1) * 3);
        }
      } else {
        // День - тратим энергию
        Citizen.energy[eid] = Math.max(0, energy - (delta || 1) * 0.5);
        Needs.sleep[eid] = Math.min(100, sleepNeed + (delta || 1) * 0.3);
      }

      // Генерируем действия на основе потребностей
      generateActions(eid, hourOfDay);
    }
  },
};

/**
 * Генерирует действия жителя на основе его потребностей и времени
 */
function generateActions(eid: number, hourOfDay: number) {
  // Утро (6:00-9:00): завтрак, подготовка к работе
  if (hourOfDay >= 6 && hourOfDay < 9) {
    if (Needs.food[eid] > 60) {
      // TODO: Пойти на кухню поесть
      console.log(`Citizen ${eid} is having breakfast`);
      Needs.food[eid] = Math.max(0, Needs.food[eid] - 40);
    }
  }

  // День (9:00-18:00): работа
  else if (hourOfDay >= 9 && hourOfDay < 18) {
    if (Citizen.workplace[eid] && Citizen.energy[eid] > 20) {
      // TODO: Пойти на работу
      console.log(`Citizen ${eid} is working`);
    }
  }

  // Вечер (18:00-22:00): покупки, отдых
  else if (hourOfDay >= 18 && hourOfDay < 22) {
    if (Needs.shopping[eid] > 70) {
      // TODO: Пойти за покупками
      console.log(`Citizen ${eid} is shopping`);
      Needs.shopping[eid] = Math.max(0, Needs.shopping[eid] - 50);
    }
  }
}
