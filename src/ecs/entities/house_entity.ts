import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { EntityId } from '@/core/ecs_manager/types';
import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { NameComponent, NameType } from '../components/name_component';
import { LevelComponent, LevelType } from '../components/level_component';
import { LevelUpTimerComponent, LevelUpTimerType } from '../components/level_up_timer_component';

/**
 * Создает сущность дома с возможностью автоматического повышения уровня.
 *
 * @param ecs - менеджер ECS
 * @param eventBus - шина событий
 * @param name - название дома
 * @param ticksPerLevel - количество тиков между повышениями уровня
 * @returns ID созданной сущности
 *
 * **Теги**: `arch:ecs`, `entity:house`, `feature:building`
 */
export function createHouseEntity(
  ecs: ECSManager,
  eventBus: EventBus,
  name: string,
  ticksPerLevel: number,
): EntityId {
  const entityId = ecs.createEntity();

  // Добавляем компонент имени
  ecs.addComponent<NameComponent>(entityId, { name }, NameType);

  // Добавляем компонент уровня (начальный уровень 1)
  ecs.addComponent<LevelComponent>(entityId, { level: 1 }, LevelType);

  // Добавляем компонент таймера повышения уровня
  ecs.addComponent<LevelUpTimerComponent>(
    entityId,
    {
      ticksPerLevel,
      currentTicks: 0,
    },
    LevelUpTimerType,
  );

  // Генерируем событие создания здания
  eventBus.emit(Events.BuildingCreated, {
    entityId,
    name,
    ticksPerLevel,
  });

  console.log(
    `🏠 [CREATE] Создан дом "${name}" (Entity ${entityId}), повышение уровня каждые ${ticksPerLevel} тиков`,
  );

  return entityId;
}
