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
/**
 * Создает систему колебаний цен с поддержкой dependency injection
 */
export function createPriceFluctuationSystem(deps?: import('../services/interfaces').ISystemDependencies) {
  console.log('createPriceFluctuationSystem called with deps:', !!deps);

  const system = {
    name: 'PriceFluctuation',
    components: ['Prices'] as const, // Global system working with Prices component
    dependencies: deps,

    update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
      console.log('=== PriceFluctuationSystem: update START ===');
      console.log('deps in closure:', deps);
      // deps доступны через замыкание
      const systemDeps = deps;
      const gameTime = extraData as number | undefined;
      if (!gameTime) return;

      // Используем инжектированные зависимости или дефолтные
      const timeProvider = systemDeps?.timeProvider || {
        getCurrentDay: () => Math.floor(gameTime / (24 * 60)) + 1 // соответствует TimeController.getDay()
      };
      const currentDay = timeProvider.getCurrentDay();
      const randomProvider = systemDeps?.randomProvider || Math;
      const logger = systemDeps?.logger || console;
      const gameConfig = systemDeps?.gameConfig || {
        pricesEntityId: 99999,
        initialRentPrice: 300,
        initialFoodPrice: 250,
        priceUpdateIntervalDays: 7
      };

      // Обновляем цены раз в заданное количество дней
      const pricesEntity = gameConfig.pricesEntityId;

      // Инициализируем цены, если они еще не установлены
      console.log('Checking prices at entity', pricesEntity, ':', {
        rentPrice: Prices.rentPrice[pricesEntity],
        foodPrice: Prices.foodPrice[pricesEntity],
        lastUpdateDay: Prices.lastUpdateDay[pricesEntity],
      });

      if (Prices.rentPrice[pricesEntity] === undefined || Prices.rentPrice[pricesEntity] === 0) {
        console.log('Initializing prices...');
        Prices.rentPrice[pricesEntity] = gameConfig.initialRentPrice;
        Prices.foodPrice[pricesEntity] = gameConfig.initialFoodPrice;
        Prices.lastUpdateDay[pricesEntity] = currentDay;

        console.log('Prices after init:', {
          rentPrice: Prices.rentPrice[pricesEntity],
          foodPrice: Prices.foodPrice[pricesEntity],
          lastUpdateDay: Prices.lastUpdateDay[pricesEntity],
        });

        logger.info(
          `Prices initialized: Rent ${gameConfig.initialRentPrice}, Food ${gameConfig.initialFoodPrice}`,
        );
      } else {
        console.log('Prices already initialized, skipping');
      }

      // Проверяем, нужно ли обновлять цены
      const lastUpdateDay = Prices.lastUpdateDay[pricesEntity] || 0;
      if (currentDay - lastUpdateDay < gameConfig.priceUpdateIntervalDays) return;

      // Обновляем цены с небольшими колебаниями
      const rentFluctuation = (randomProvider.random() - 0.5) * 0.2; // ±10%
      const foodFluctuation = (randomProvider.random() - 0.5) * 0.15; // ±7.5%

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

      logger.info(
        `Prices updated: Rent: ${Prices.rentPrice[pricesEntity].toFixed(0)}, Food: ${Prices.foodPrice[pricesEntity].toFixed(0)}`,
      );

      // Отправляем событие об обновлении цен
      systemDeps?.eventBus?.emit('pricesUpdated', {
        rentPrice: Math.round(Prices.rentPrice[pricesEntity]),
        foodPrice: Math.round(Prices.foodPrice[pricesEntity]),
      });
    },
  };

  console.log('createPriceFluctuationSystem returning system with update:', typeof system.update);
  return system;
}

/**
 * Устаревшая версия системы для обратной совместимости
 * @deprecated Используйте createPriceFluctuationSystem() с dependency injection
 */
export const PriceFluctuationSystem = createPriceFluctuationSystem();

/**
 * Система обновления минимальных расходов
 * Пересчитывает минимальные расходы жителей на основе текущих цен за неделю
 */
export const MinimumExpensesUpdateSystem: System = {
  name: 'MinimumExpensesUpdate',
  components: ['Citizen'],

  update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
    const pricesEntity = 99999; // Сущность с глобальными ценами

    if (Prices.rentPrice[pricesEntity] === undefined) return;

    const monthlyRentPrice = Prices.rentPrice[pricesEntity];
    const monthlyFoodPrice = Prices.foodPrice[pricesEntity];

    // Рассчитываем недельные расходы (30 дней / 7 дней ≈ 4.28, используем 4.3 для точности)
    const weeklyRentPrice = monthlyRentPrice / 4.3;
    const weeklyFoodPrice = monthlyFoodPrice / 4.3;

    // Обновляем минимальные расходы для всех жителей (за неделю)
    for (const citizenId of entities) {
      const housingType = Citizen.housingType[citizenId] || 0;
      const weeklyRentCost = housingType === 1 ? weeklyRentPrice : 0; // Арендное жилье

      Citizen.minimumExpenses[citizenId] = weeklyRentCost + weeklyFoodPrice;
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
    const deltaTime = delta || 0; // Используем 0 если delta не указан
    if (deltaTime <= 0) return; // Не обновляем при нулевом или отрицательном времени

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
 * Создает систему еженедельных расходов с поддержкой dependency injection
 */
export function createWeeklyExpensesSystem(deps?: import('../services/interfaces').ISystemDependencies) {
  console.log('createWeeklyExpensesSystem called with deps:', !!deps);

  return {
    name: 'WeeklyExpenses',
    components: ['Citizen'],
    dependencies: deps,

    update(world: World, entities: readonly number[], delta?: number, extraData?: unknown) {
      console.log('=== WeeklyExpensesSystem: update START ===');
      console.log('deps in closure:', deps);

      // deps доступны через замыкание
      const systemDeps = deps;

      // Используем gameTime из extraData если deps не переданы, иначе используем timeProvider
      const gameTime = systemDeps?.timeProvider ? systemDeps.timeProvider.getCurrentTime() : (extraData as number | undefined);

      console.log('WeeklyExpensesSystem: gameTime =', gameTime, 'systemDeps exists:', !!systemDeps);

      if (!gameTime) {
        console.log('WeeklyExpensesSystem: No gameTime, returning');
        return;
      }

      console.log('WeeklyExpensesSystem: Starting update with gameTime:', gameTime);

    // Рассчитываем текущий день симуляции
    // currentDay = Math.floor(gameTime / (24 * 60)) + 1 (соответствует TimeController.getDay())
    const currentDay = Math.floor(gameTime / (24 * 60)) + 1;

    for (const citizenId of entities) {
      // Получаем дату последнего списания для этого жителя
      const lastExpenseDay = Citizen.lastExpenseDay[citizenId] || 0;

      // Списываем расходы раз в неделю (каждые 7 дней)
      if (currentDay - lastExpenseDay >= 7) {
        const minExpenses = Citizen.minimumExpenses[citizenId] || 0;
        const currentMoney = Citizen.money[citizenId] || 0;

        if (currentMoney >= minExpenses) {
          // Достаточно денег - списываем полную сумму
          Citizen.money[citizenId] = currentMoney - minExpenses;
          console.log(`Citizen ${citizenId} paid weekly expenses: $${minExpenses.toFixed(2)}`);
        } else {
          // Недостаточно денег - списываем все что есть, житель в долгах
          Citizen.money[citizenId] = 0;
          console.log(`Citizen ${citizenId} couldn't afford weekly expenses: $${minExpenses.toFixed(2)}, only had $${currentMoney}`);

          // Снижаем счастье из-за долгов
          Citizen.happiness[citizenId] = Math.max(0, Citizen.happiness[citizenId] - 15);
        }

        // Обновляем дату последнего списания
        Citizen.lastExpenseDay[citizenId] = currentDay;
      }
    }
  },
  };

  console.log('createWeeklyExpensesSystem returning system with update:', typeof system.update);
  return system;
}

/**
 * Устаревшая версия системы для обратной совместимости
 * @deprecated Используйте createWeeklyExpensesSystem() с dependency injection
 */
export const WeeklyExpensesSystem = createWeeklyExpensesSystem();

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
