import { addComponent, addEntity } from 'bitecs';
import { createEntityFactory } from '../../core/smart_constructors';
import { MoneyComponent } from '../../components/test/firts_sim_components';

// создаёт жителя с начальной суммой денег
export const createCitizen = createEntityFactory(
  'citizen_entity',
  (world) => {
    // Создание жителя с компонентами
    console.log('Citizen entity created with money');
    const citizenId = addEntity(world);
    addComponent(world, citizenId, MoneyComponent);
    MoneyComponent.money[citizenId] = 100;
    return citizenId;
  },
  'Создает сущность жителя с начальной суммой денег',
);
