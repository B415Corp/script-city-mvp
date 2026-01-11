import { createComponent } from '../../core/smart_constructors';

// хранит текущую сумму денег жителя
export const MoneyComponent = createComponent('Money', {
  money: 0,
});

// хранит количество рабочих мест на заводе
export const FactoryComponent = createComponent('Factory', {
  workplace: 5,
});

// связывает жителя с конкретным заводом и рабочим местом
export const WorkplaceComponent = createComponent('Workplace', {
  factoryId: 0,
  workplaceId: 0,
});
