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
}

// Экспортируем отдельные фабрики
export { PersonFactory } from './person_factory';
export { BuildingFactory } from './building_factory';
export { JobFactory } from './job_factory';
