import { ECSManager } from '../ecs/ecs_manager';
import { EntityFactory } from '../ecs/entities';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { LogicTickData } from '../tick/types';
import { Events } from '../event_bus/events';
import { Gender } from '../ecs/components/population';

export class EntrySimulation {
  private entityFactory: EntityFactory;

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

    console.log('Simulation systems activated');
  }

  private createInitialEntities(): void {
    // Создаем несколько жителей
    for (let i = 0; i < 5; i++) {
      this.entityFactory.persons.create(
        {
          age: 25 + Math.random() * 30,
          gender: Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE,
          name: `Person ${i}`,
        }, // возраст 25-55
        {
          happiness: 50,
          home: 0,
          workplace: undefined,
          money: 100 + Math.random() * 900,
          energy: 80 + Math.random() * 20,
        },
        { x: Math.random() * 100, y: Math.random() * 100 }, // случайная позиция
      );
    }

    console.log('Initial entities created');
  }
}
