import { ECSManager } from '../ecs/ecs_manager';
import { EntityFactory } from '../ecs/entities';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { LogicTickData } from '../tick/types';
import { Events } from '../event_bus/events';
import { Gender } from '../ecs/components/population';
import { CommercialType } from '../ecs/components/buildings';

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
    for (let i = 0; i < 5; i++) {
      this.entityFactory.buildings.createSimpleShop({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    for (let i = 0; i < 3; i++) {
      this.entityFactory.buildings.createSimpleOffice({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }

    // Создаем рабочие места (8 штук)
    for (let i = 0; i < 8; i++) {
      this.entityFactory.jobs.createJob({
        title: 'Office Job',
        salary: 2000 + Math.random() * 3000,
        requirements: [],
        available: true,
      });
    }

    // Создаем жителей (20 человек) и распределяем их по домам
    for (let i = 0; i < 20; i++) {
      const homeIndex = Math.floor(Math.random() * houses.length);

      this.entityFactory.persons.create(
        {
          age: 25 + Math.random() * 30,
          gender: Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE,
          name: `Person ${i}`,
        }, // возраст 25-55
        {
          happiness: 50,
          home: homeIndex, // ID дома
          workplace: undefined, // Будет назначено системой
          money: 1000 + Math.random() * 4000,
          energy: 30 + Math.random() * 20, // Начинаем со средней/низкой энергией (спят)
        },
        houses[homeIndex], // позиция дома
      );
    }

    console.log('Initial entities created: 20 citizens, 10 houses, 5 shops, 3 offices, 8 jobs');
  }
}
