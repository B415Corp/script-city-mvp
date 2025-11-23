import { EventBus } from '../event_bus/event_bus';
import { CommandProcessor } from '../command_processor/command_processor';

import { ECSManager } from '../ecs_manager/ecs_manager';

export interface TickManagerConfig {
  tickRate: number; // тиков в секунду (10-20)
  maxCatchUpTicks: number; // максимальное количество catch-up тиков за кадр
  eventBus: EventBus; // для публикации событий
  commandProcessor?: CommandProcessor; // для обработки команд в начале тика
  ecsManager?: ECSManager; // для запуска систем ECS
}
