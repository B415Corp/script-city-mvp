import { ECSManager } from '../ecs/ecs_manager';
import { EntityFactory } from '../ecs/entities';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { LogicTickData } from '../tick/types';
import { Events } from '../event_bus/events';
import { Gender, EducationLevel, HousingType } from '../ecs/components/population';
import { CommercialType } from '../ecs/components/buildings';
import { Citizen, Workplace, Person, Prices } from '../ecs/components';

export class EntrySimulation {
  private entityFactory: EntityFactory;
  private simulationStartTime: number = 0;
  private simulationDuration: number = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
  private isSimulationRunning: boolean = false;

  constructor(
    private ecsManager: ECSManager,
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.entityFactory = new EntityFactory(this.ecsManager.getWorld());
    console.log('EntrySimulation initialized with dependencies');
  }

  public start(): void {
    console.log('EntrySimulation started');

    // Создаем начальные сущности
    this.createInitialEntities();

    // Запускаем ECS системы
    this.startECSSystems();

    // Запускаем тиковый цикл
    this.startTickLoop();

    this.isSimulationRunning = true;
    console.log('Simulation systems activated and running');
  }

  private startECSSystems(): void {
    // ECS системы запускаются автоматически через кластеры
    // Основная логика теперь в ScheduleManager, который управляет расписанием
    console.log('ECS systems are active via ScheduleManager');
  }

  private startTickLoop(): void {
    // TickManager уже инициализирован и подписан на события
    // Запускаем обновление времени в браузере
    this.startTimeUpdates();
    console.log('Tick loop started');
  }

  private startTimeUpdates(): void {
    // Функция обновления времени (в реальном приложении это будет в game loop)
    const updateTime = (timestamp: number): void => {
      if (this.isSimulationRunning) {
        const delta = timestamp - this.simulationStartTime;
        this.simulationStartTime = timestamp;

        // Обновляем TickManager
        this.tickManager.update(timestamp, delta);

        // Продолжаем цикл
        window.requestAnimationFrame(updateTime);
      }
    };

    this.simulationStartTime = window.performance.now();
    window.requestAnimationFrame(updateTime);
  }

  private createInitialEntities(): void {
    console.log('Creating initial entities for MVP simulation...');

    // Создаем жилые дома (10 штук)
    const houses: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const position = { x: Math.random() * 100, y: Math.random() * 100 };
      houses.push(position);
      this.entityFactory.buildings.createSimpleHouse(position);
    }

    // Создаем коммерческие здания (5 магазинов и 3 офиса)
    const shopIds: number[] = [];
    const officeIds: number[] = [];

    for (let i = 0; i < 5; i++) {
      const shopId = this.entityFactory.buildings.createSimpleShop({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
      shopIds.push(shopId);
    }

    for (let i = 0; i < 3; i++) {
      const officeId = this.entityFactory.buildings.createSimpleOffice({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
      officeIds.push(officeId);
    }

    // Создаем рабочие места для магазинов (кассары и менеджеры)
    const workplaceIds: number[] = [];
    for (const shopId of shopIds) {
      // 2 кассира на магазин
      for (let j = 0; j < 2; j++) {
        const workplaceId = this.entityFactory.buildings.createShopCashier(
          {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          250 + Math.random() * 100,
        ); // Зарплата 250-350
        workplaceIds.push(workplaceId);
      }
      // 1 менеджер на магазин
      const managerId = this.entityFactory.buildings.createShopManager(
        {
          x: Math.random() * 100,
          y: Math.random() * 100,
        },
        400 + Math.random() * 200,
      ); // Зарплата 400-600
      workplaceIds.push(managerId);
    }

    // Создаем рабочие места для офисов
    for (const officeId of officeIds) {
      // 3 рабочих места на офис
      for (let j = 0; j < 3; j++) {
        const workplaceId = this.entityFactory.buildings.createSimpleOffice(
          {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          400 + Math.random() * 300,
        ); // Зарплата 400-700
        workplaceIds.push(workplaceId);
      }
    }

    // Создаем жителей (20 человек) и распределяем их по домам
    const citizens: number[] = [];
    for (let i = 0; i < 50; i++) {
      const homeIndex = Math.floor(Math.random() * houses.length);

      const age = 25 + Math.random() * 30;
      // Генерируем образование в зависимости от возраста
      const education = this.generateRandomEducation(age);

      const housingType = Math.random() < 0.7 ? HousingType.OWNED : HousingType.RENTED;
      const rentCost = housingType === HousingType.RENTED ? 200 + Math.random() * 300 : 0; // Аренда 200-500
      const foodCost = 150 + Math.random() * 200; // Еда 150-350
      const minimumExpenses = rentCost + foodCost;

      const citizenId = this.entityFactory.persons.create(
        {
          age,
          gender: Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE,
          name: `Person ${i}`,
          education,
        }, // возраст 25-55
        {
          happiness: 50,
          home: homeIndex, // ID дома
          workplace: undefined, // Будет назначено системой
          money: 1000 + Math.random() * 4000,
          energy: 30 + Math.random() * 20, // Начинаем со средней/низкой энергией (спят)
          housingType,
          minimumExpenses,
          salary: 0, // Пока нет работы
          isLookingForJob: true, // Начинает с поиска работы
          jobSearchAttempts: 0,
          lastJobSearchDay: 0,
          lastExpenseDay: 0,
        },
        houses[homeIndex], // позиция дома
      );

      citizens.push(citizenId);
    }

    // Назначаем рабочие места жителям
    this.assignWorkplaces(citizens);

    // Инициализируем глобальные цены
    this.initializeGlobalPrices();

    console.log('Initial entities created: 20 citizens, 10 houses, 5 shops, 3 offices, 8 jobs');
  }

  private assignWorkplaces(citizenIds: number[]): void {
    // Получить все доступные рабочие места
    const world = this.ecsManager.getWorld();
    const workplaces: number[] = [];

    // Ищем все сущности с компонентом Workplace
    for (let i = 0; i < 10000; i++) {
      try {
        if (Workplace.jobType[i] !== undefined && Workplace.worker[i] === undefined) {
          workplaces.push(i);
        }
      } catch {
        // Игнорируем ошибки - сущность не существует
      }
    }

    console.log(
      `Found ${workplaces.length} available workplaces, assigning to ${citizenIds.length} citizens`,
    );

    // Назначаем рабочие места жителям с учетом образования
    let assignedCount = 0;
    for (const citizenId of citizenIds) {
      if (assignedCount >= workplaces.length) break;

      // Ищем подходящее рабочее место для жителя
      const citizenEducation = Person.education[citizenId] || 1;

      for (const workplaceId of workplaces) {
        if (Workplace.worker[workplaceId] !== undefined) continue; // Уже занято

        const requiredEducation = Workplace.minEducationLevel[workplaceId] || 1;
        const salary = Workplace.salary[workplaceId] || 0;
        const minExpenses = Citizen.minimumExpenses[citizenId] || 0;

        // Проверяем соответствие образованию и достаточности зарплаты
        if (citizenEducation >= requiredEducation && salary >= minExpenses) {
          // Назначаем работу
          Citizen.workplace[citizenId] = workplaceId;
          Citizen.salary[citizenId] = salary;
          Workplace.worker[workplaceId] = citizenId;

          console.log(
            `Assigned workplace ${workplaceId} (salary: ${salary}) to citizen ${citizenId} (education: ${citizenEducation})`,
          );
          assignedCount++;
          break; // Переходим к следующему жителю
        }
      }
    }

    console.log(`Assigned ${assignedCount} workplaces to citizens`);
  }

  private initializeGlobalPrices(): void {
    const pricesEntity = 99999;

    // Инициализируем базовые цены
    Prices.rentPrice[pricesEntity] = 300; // Базовая месячная аренда
    Prices.foodPrice[pricesEntity] = 250; // Базовая месячная стоимость еды
    Prices.lastUpdateDay[pricesEntity] = 0;

    console.log('Global prices initialized');
  }

  /**
   * Генерирует случайный уровень образования в зависимости от возраста
   */
  private generateRandomEducation(age: number): EducationLevel {
    // Распределение образования по возрастам
    if (age < 25) {
      // Молодежь - чаще имеют высшее образование
      const rand = Math.random();
      if (rand < 0.3) return EducationLevel.NONE;
      if (rand < 0.5) return EducationLevel.PRIMARY;
      if (rand < 0.7) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else if (age < 45) {
      // Средний возраст - смешанное образование
      const rand = Math.random();
      if (rand < 0.2) return EducationLevel.NONE;
      if (rand < 0.4) return EducationLevel.PRIMARY;
      if (rand < 0.6) return EducationLevel.SECONDARY;
      if (rand < 0.8) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else {
      // Старшее поколение - чаще низкое образование
      const rand = Math.random();
      if (rand < 0.4) return EducationLevel.NONE;
      if (rand < 0.6) return EducationLevel.PRIMARY;
      if (rand < 0.8) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    }
  }
}
