import { addComponent, addEntity } from 'bitecs';
import { createEntityFactory } from '../../core/smart_constructors';
import {
  FactoryComponent,
  MoneyComponent,
  WorkplaceComponent,
} from '../../components/test/firts_sim_components';

// создаёт жителя с начальной суммой денег
export const createCitizen = createEntityFactory(
  'citizen_entity',
  (world) => {
    // Создание жителя с компонентами
    console.log('Citizen entity created with money');
    const citizenId = addEntity(world);

    // ✅ ИСПОЛЬЗУЕМ create метод компонента вместо ручного addComponent
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
    FactoryComponent.workplace[factoryId] = 5; // 5 рабочих мест
    return factoryId;
  },
  'Создает сущность завода с начальным количеством рабочих мест',
);

// Создаёт рабочее место с связью
export const createWorkplace = createEntityFactory(
  'workplace_entity',
  (world) => {
    const workplaceId = addEntity(world);
    WorkplaceComponent.create(world, workplaceId, { factoryId: 0, workplaceId: 0 });
    WorkplaceComponent.factoryId[workplaceId] = 0; // Связь с заводом
    WorkplaceComponent.workplaceId[workplaceId] = 0; // ID рабочего места
    return workplaceId;
  },
  'Создает сущность рабочего места с связью с жителем и заводом',
);
