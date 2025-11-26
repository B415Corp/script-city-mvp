import { ISystem } from '@/core/ecs_manager/types';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { LevelComponent, LevelType } from '../components/level_component';
import { LevelUpTimerComponent, LevelUpTimerType } from '../components/level_up_timer_component';
import { NameComponent, NameType } from '../components/name_component';

/**
 * Система повышения уровня.
 * Обрабатывает сущности с компонентами Level и LevelUpTimer,
 * автоматически повышая их уровень через заданные интервалы тиков.
 *
 * **Теги**: `arch:ecs`, `system:level`, `feature:simulation`
 */
export const createLevelUpSystem = (): ISystem => ({
  id: 'LevelUpSystem',
  priority: 10,
  updateInterval: 1, // Обновляется каждый тик

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    // Находим все сущности с компонентом LevelUpTimer
    const entitiesWithTimer = ecs.getEntitiesWithComponent(LevelUpTimerType);

    for (const entityId of entitiesWithTimer) {
      const timer = ecs.getComponent<LevelUpTimerComponent>(entityId, LevelUpTimerType);
      const level = ecs.getComponent<LevelComponent>(entityId, LevelType);
      const name = ecs.getComponent<NameComponent>(entityId, NameType);

      if (timer && level) {
        // Увеличиваем счетчик тиков
        timer.currentTicks += deltaTime;

        // Проверяем, нужно ли повысить уровень
        if (timer.currentTicks >= timer.ticksPerLevel) {
          // Повышаем уровень
          level.level += 1;

          // Сбрасываем счетчик
          timer.currentTicks = 0;

          // Получаем имя сущности
          const entityName = name ? name.name : `Entity ${entityId}`;

          // Генерируем событие через EventBus
          eventBus.emit(Events.BuildingLevelUp, {
            entityId,
            entityName,
            newLevel: level.level,
            ticksPerLevel: timer.ticksPerLevel,
          });

          // Также выводим информацию в консоль для наглядности
          // console.log(
          //   `🏠 [LEVEL UP] ${entityName}: уровень повышен до ${level.level} (интервал: ${timer.ticksPerLevel} тиков)`,
          // );
        }
      }
    }
  },
});
