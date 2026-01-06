import { World } from 'bitecs';
import { PersonFactory } from './person_factory';
import { BuildingFactory } from './building_factory';
import { JobFactory } from './job_factory';

/**
 * Главный класс фабрик сущностей
 * Предоставляет унифицированный интерфейс для создания всех типов сущностей
 */
export class EntityFactory {
  public readonly persons: PersonFactory;
  public readonly buildings: BuildingFactory;
  public readonly jobs: JobFactory;

  constructor(world: World) {
    this.persons = new PersonFactory(world);
    this.buildings = new BuildingFactory(world);
    this.jobs = new JobFactory(world);
  }

  /**
   * Создает начальное состояние MVP симуляции
   * - 1 дом на 15 человек
   * - 2 магазина (еда, товары)
   * - 5 рабочих мест
   */
  createMVPSetup() {
    const entities = {
      house: this.buildings.createSimpleHouse({ x: 100, y: 100 }),
      shop1: this.buildings.createSimpleShop({ x: 200, y: 100 }),
      shop2: this.buildings.createSimpleShop({ x: 300, y: 100 }),
      office1: this.buildings.createSimpleOffice({ x: 150, y: 200 }, 400),
      office2: this.buildings.createSimpleOffice({ x: 250, y: 200 }, 450),
      office3: this.buildings.createSimpleOffice({ x: 350, y: 200 }, 500),
      office4: this.buildings.createSimpleOffice({ x: 150, y: 300 }, 550),
      office5: this.buildings.createSimpleOffice({ x: 250, y: 300 }, 600),
    };

    return entities;
  }
}

// Экспортируем отдельные фабрики
export { PersonFactory } from './person_factory';
export { BuildingFactory } from './building_factory';
export { JobFactory } from './job_factory';
