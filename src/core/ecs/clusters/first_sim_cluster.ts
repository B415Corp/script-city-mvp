import { createCluster } from '../core/smart_constructors';

/**
 * Кластер первой симуляции: системы, обновляющиеся раз в 200 тиков.
 * Период кластера задаётся в игровом времени (GAME_TIME_PER_TICK на тик).
 */
export const FirstSimCluster = createCluster('first_sim', ['work_income'], {
  enabled: true,
  description: 'Системы первой симуляции',
  interval: 200,
});
