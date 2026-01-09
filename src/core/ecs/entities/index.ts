import { World } from 'bitecs';
import { PersonFactory } from './person_factory';
import { BuildingFactory } from './building_factory';

/**
 * Главный класс фабрик сущностей
 * Предоставляет унифицированный интерфейс для создания всех типов сущностей
 */
export class EntityFactory {
  public readonly persons: PersonFactory;
  public readonly buildings: BuildingFactory;

  constructor(world: World) {
    this.persons = new PersonFactory(world);
    this.buildings = new BuildingFactory(world);
  }
}

// Экспортируем отдельные фабрики
export { PersonFactory } from './person_factory';
export { BuildingFactory } from './building_factory';
