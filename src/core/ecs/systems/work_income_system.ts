import { createSystem } from '../core/smart_constructors';
import { MoneyComponent } from '../components/citizen_components';

/**
 * Система начисления дохода: каждый житель с компонентом Money получает +1 единицу.
 * Выполняется в кластере `first_sim` — период задаётся интервалом кластера.
 */
export const WorkIncomeSystem = createSystem(
  'work_income',
  ['Money'],
  (world, entities, delta) => {
    for (const entityId of entities) {
      MoneyComponent.money[entityId] += 1;
    }
  },
  {
    cluster: 'first_sim',
    enabled: true,
  },
);
