/**
 * Компонент таймера повышения уровня.
 * Используется для автоматического повышения уровня через заданное количество тиков.
 *
 * **Теги**: `arch:ecs`, `component:timer`
 */
export interface LevelUpTimerComponent {
  /**
   * Количество тиков между повышениями уровня
   */
  ticksPerLevel: number;

  /**
   * Текущий счетчик тиков
   */
  currentTicks: number;
}

export const LevelUpTimerType = 'LevelUpTimer' as const;
