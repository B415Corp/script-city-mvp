import { ECSManager } from '../ecs/ecs_manager';
import { EntityFactory } from '../ecs/entities';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { LogicTickData } from '../tick/types';
import { Events } from '../event_bus/events';
import { Gender, EducationLevel, HousingType } from '../ecs/components/population';
import { Citizen, Workplace, Person } from '../ecs/components';

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
    console.log('Creating initial entities for simplified simulation...');

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
            name: `Citizen ${houseIndex}-${citizenInHouse}`,
            education,
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
            isLookingForJob: false, // Уже имеет работу
            jobSearchAttempts: 0,
            lastJobSearchDay: 0,
            lastExpenseDay: 0,
          },
          houses[houseIndex],
        );

        citizens.push(citizenId);
        workplaceCounter++;
      }
    }

    console.log('Initial entities created: 100 citizens, 10 houses, 100 workplaces');
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
