import { ECSManager } from '../ecs/ecs_manager';
import { EntityFactory } from '../ecs/entities';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { LogicTickData } from '../tick/types';
import { Events } from '../event_bus/events';
import { Gender, EducationLevel, HousingType } from '../ecs/components/population';
import { Citizen, Workplace, Person } from '../ecs/components';
import { Logger } from '../utils/logger';

export class EntrySimulation {
  private entityFactory: EntityFactory;
  private simulationStartTime: number = 0;
  private isSimulationRunning: boolean = false;
  private rafId: number | null = null;
  private logger: Logger;

  constructor(
    private ecsManager: ECSManager,
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('EntrySimulation');
    this.entityFactory = new EntityFactory(this.ecsManager.getWorld());
    this.logger.info('EntrySimulation initialized with dependencies');
  }

  public start(): void {
    this.logger.info('EntrySimulation started');

    // Создаем начальные сущности
    this.createInitialEntities();

    // Запускаем ECS системы
    this.startECSSystems();

    // Запускаем тиковый цикл
    this.startTickLoop();

    this.isSimulationRunning = true;
    this.logger.info('Simulation systems activated and running');
  }

  private startECSSystems(): void {
    // ECS системы запускаются автоматически через кластеры
    // Основная логика теперь в ScheduleManager, который управляет расписанием
    this.logger.info('ECS systems are active via ScheduleManager');
  }

  private startTickLoop(): void {
    // TickManager уже инициализирован и подписан на события
    // Запускаем обновление времени в браузере
    this.startTimeUpdates();
    this.logger.info('Tick loop started');
  }

  // ← ДОБАВИТЬ метод stop
  public stop(): void {
    this.isSimulationRunning = false;

    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.logger.info('Simulation stopped');
  }

  private startTimeUpdates(): void {
    // Функция обновления времени (в реальном приложении это будет в game loop)
    const updateTime = (timestamp: number): void => {
      if (this.isSimulationRunning) {
        const delta = timestamp - this.simulationStartTime;
        this.simulationStartTime = timestamp;

        // Обновляем TickManager
        this.tickManager.update(timestamp, delta);

        this.rafId = window.requestAnimationFrame(updateTime); // ← ИЗМЕНИТЬ
      }
    };

    this.simulationStartTime = window.performance.now();
    this.rafId = window.requestAnimationFrame(updateTime); // ← ИЗМЕНИТЬ
  }

  private createInitialEntities(): void {
    this.logger.info('Creating initial entities for simplified simulation...');

    // Создаем жилые дома (10 штук)
    const houses: { x: number; y: number }[] = [];
    const houseIds: number[] = [];
    for (let i = 0; i < 10; i++) {
      const position = { x: Math.random() * 100, y: Math.random() * 100 };
      houses.push(position);
      const houseId = this.entityFactory.buildings.createSimpleHouse(position);
      houseIds.push(houseId);
    }

    // Создаем 100 жителей - по 10 на каждый дом
    const citizens: number[] = [];
    let workplaceCounter = 0;

    for (let houseIndex = 0; houseIndex < houses.length; houseIndex++) {
      for (let citizenInHouse = 0; citizenInHouse < 10; citizenInHouse++) {
        const age = 25 + Math.random() * 30;
        const education = this.generateRandomEducation(age);

        // Создаем рабочее место для каждого жителя
        const workplaceId = this.entityFactory.buildings.createSimpleOffice(
          {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          100, // Фиксированная зарплата 100
        );

        const citizenId = this.entityFactory.persons.create(
          {
            age,
            gender: Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE,
            firstName: houseIndex * 10 + citizenInHouse, // Simple numeric ID for first name
            lastName: Math.floor(Math.random() * 100), // Random last name index
          },
          {
            happiness: 50,
            home: houseIds[houseIndex], // ID реального дома
            workplace: workplaceId, // Уже имеет работу
            money: 100, // Стартовые 100 денег
            energy: 30 + Math.random() * 20,
            housingType: HousingType.OWNED, // Все имеют собственное жилье
            minimumExpenses: 0, // Нет расходов в упрощенной симуляции
            salary: 100, // Фиксированная зарплата
            lastWorkDay: 0,
            isLookingForJob: 0, // Уже имеет работу
            jobSearchAttempts: 0,
            lastJobSearchDay: 0,
            lastExpenseDay: 0,
            isHomeless: 0, // Все имеют жилье
            age,
            education,
            experience: 0,
            skills: 0,
          },
          houses[houseIndex],
        );

        citizens.push(citizenId);
        workplaceCounter++;
      }
    }

    this.logger.info('Initial entities created: 100 citizens, 10 houses, 100 workplaces');
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
