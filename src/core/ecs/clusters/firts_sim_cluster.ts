import { createCluster } from '../core/smart_constructors';

export const FirtsSimCluster = createCluster(
  'first_sim',
  ['work_income'], // Имена систем
  {
    enabled: true,
    description: 'Системы первой симуляции',
    interval: 200, // Каждые 200 тиков
  },
);
