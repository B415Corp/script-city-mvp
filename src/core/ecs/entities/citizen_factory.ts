import { addEntity } from 'bitecs';
import { createEntityFactory } from '../core/smart_constructors';
import {
  FactoryComponent,
  MoneyComponent,
  WorkplaceComponent,
} from '../components/citizen_components';

// создаёт жителя с начальной суммой денег
export const createCitizen = createEntityFactory(
  'citizen_entity',
  (world) => {
    const citizenId = addEntity(world);
    MoneyComponent.create(world, citizenId, { money: 100 });
    return citizenId;
  },
  'Создает сущность жителя с начальной суммой денег',
);

// Создаёт завод с заданным количеством рабочих мест
export const createFactory = createEntityFactory(
  'factory_entity',
  (world) => {
    const factoryId = addEntity(world);
    FactoryComponent.create(world, factoryId, { workplace: 5 });
    return factoryId;
  },
  'Создает сущность завода с начальным количеством рабочих мест',
);

// Создаёт рабочее место со связкой с заводом
export const createWorkplace = createEntityFactory(
  'workplace_entity',
  (world) => {
    const workplaceId = addEntity(world);
    WorkplaceComponent.create(world, workplaceId, { factoryId: 0, workplaceId: 0 });
    return workplaceId;
  },
  'Создает сущность рабочего места со связью с жителем и заводом',
);
