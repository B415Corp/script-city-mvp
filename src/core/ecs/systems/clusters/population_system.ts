import { World, query } from 'bitecs';
import { Person, Citizen, Needs, Prices } from '../../components';
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
 * Система колебаний цен
 * Обновляет рыночные цены на товары и услуги
 */
export const PriceFluctuationSystem: System = {
  name: 'PriceFluctuation',
  components: ['Person'], // Dummy component requirement for global system

  update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
    const gameTime = extraData as number | undefined;
    if (!gameTime) return;

    // Обновляем цены раз в 7 игровых дней
    const currentDay = Math.floor(gameTime / (24 * 60));
    const pricesEntity = 99999; // Специальная сущность для хранения глобальных цен

    // Инициализируем цены, если они еще не установлены
    if (Prices.rentPrice[pricesEntity] === undefined) {
      Prices.rentPrice[pricesEntity] = 300; // Базовая цена аренды
      Prices.foodPrice[pricesEntity] = 250; // Базовая цена еды
      Prices.lastUpdateDay[pricesEntity] = currentDay;
    }

    // Проверяем, нужно ли обновлять цены
    const lastUpdateDay = Prices.lastUpdateDay[pricesEntity] || 0;
    if (currentDay - lastUpdateDay < 7) return; // Обновляем раз в 7 дней

    // Обновляем цены с небольшими колебаниями
    const rentFluctuation = (Math.random() - 0.5) * 0.2; // ±10%
    const foodFluctuation = (Math.random() - 0.5) * 0.15; // ±7.5%

    const currentRentPrice = Prices.rentPrice[pricesEntity];
    const currentFoodPrice = Prices.foodPrice[pricesEntity];

    Prices.rentPrice[pricesEntity] = Math.max(
      200,
      Math.min(600, currentRentPrice * (1 + rentFluctuation)),
    );
    Prices.foodPrice[pricesEntity] = Math.max(
      150,
      Math.min(450, currentFoodPrice * (1 + foodFluctuation)),
    );
    Prices.lastUpdateDay[pricesEntity] = currentDay;

    console.log(
      `Prices updated: Rent: ${Prices.rentPrice[pricesEntity].toFixed(0)}, Food: ${Prices.foodPrice[pricesEntity].toFixed(0)}`,
    );
  },
};

/**
 * Система обновления минимальных расходов
 * Пересчитывает минимальные расходы жителей на основе текущих цен
 */
export const MinimumExpensesUpdateSystem: System = {
  name: 'MinimumExpensesUpdate',
  components: ['Citizen'],

  update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
    const pricesEntity = 99999; // Сущность с глобальными ценами

    if (Prices.rentPrice[pricesEntity] === undefined) return;

    const currentRentPrice = Prices.rentPrice[pricesEntity];
    const currentFoodPrice = Prices.foodPrice[pricesEntity];

    // Обновляем минимальные расходы для всех жителей
    for (const citizenId of entities) {
      const housingType = Citizen.housingType[citizenId] || 0;
      const rentCost = housingType === 1 ? currentRentPrice : 0; // Арендное жилье

      Citizen.minimumExpenses[citizenId] = rentCost + currentFoodPrice;
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
 * Система ежемесячного списания расходов
 * Списывает деньги за аренду и еду каждый месяц
 */
export const MonthlyExpensesSystem: System = {
  name: 'MonthlyExpenses',
  components: ['Citizen'],

  update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
    const gameTime = extraData as number | undefined;
    if (!gameTime) return;

    // Рассчитываем текущий день симуляции
    const currentDay = Math.floor(gameTime / (24 * 60));

    for (const citizenId of entities) {
      // Получаем дату последнего списания для этого жителя
      const lastExpenseDay = Citizen.lastExpenseDay[citizenId] || 0;

      // Списываем расходы раз в месяц (каждые 30 дней)
      if (currentDay - lastExpenseDay >= 30) {
        const minExpenses = Citizen.minimumExpenses[citizenId] || 0;
        const currentMoney = Citizen.money[citizenId] || 0;

        if (currentMoney >= minExpenses) {
          // Достаточно денег - списываем полную сумму
          Citizen.money[citizenId] = currentMoney - minExpenses;
          console.log(`Citizen ${citizenId} paid monthly expenses: $${minExpenses}`);
        } else {
          // Недостаточно денег - списываем все что есть, житель в долгах
          Citizen.money[citizenId] = 0;
          console.log(`Citizen ${citizenId} couldn't afford monthly expenses: $${minExpenses}, only had $${currentMoney}`);

          // Снижаем счастье из-за долгов
          Citizen.happiness[citizenId] = Math.max(0, Citizen.happiness[citizenId] - 15);
        }

        // Обновляем дату последнего списания
        Citizen.lastExpenseDay[citizenId] = currentDay;
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
