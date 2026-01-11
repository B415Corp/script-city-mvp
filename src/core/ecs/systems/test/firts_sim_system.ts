import { query } from 'bitecs';
import { createSystem } from '../../core/smart_constructors';
import { MoneyComponent } from '../../components/test/firts_sim_components';

/**
 * Система для начисления дохода жителям за работу на заводе
 * Срабатывает каждые 200 тиков
 * Находит всех жителей с компонентом Money
 * Добавляет +1 к деньгам каждого жителя
 * Суммирует и логирует общую сумму денег всех жителей
 */
export const WorkIncomeSystem = createSystem(
  'work_income',
  ['Money'],
  (world, entities, delta) => {
    // Получаем реальные сущности с компонентом Money
    const moneyEntities = query(world, [MoneyComponent]);

    let totalMoney = 0;

    // Сначала суммируем текущие деньги ВСЕХ жителей
    for (const entityId of moneyEntities) {
      totalMoney += MoneyComponent.money[entityId];
    }

    // Затем добавляем +1 каждому жителю
    for (const entityId of moneyEntities) {
      MoneyComponent.money[entityId] += 1;
    }

    console.log(`Общая сумма денег всех жителей: ${totalMoney}`);
  },
  {
    cluster: 'first_sim',
    enabled: true,
  },
);
