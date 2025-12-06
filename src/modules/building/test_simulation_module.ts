import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { createLevelUpSystem } from '@/ecs/systems/level_up_system';
import { createHouseEntity } from '@/ecs/entities/house_entity';
import { debugLog } from '@/infrastructure/utils/logger';

/**
 * Модуль тестирования симуляции повышения уровня зданий.
 * Создает три дома с разными интервалами повышения уровня для демонстрации ECS.
 *
 * **Теги**: `arch:module`, `feature:building`, `test:simulation`
 */

export class TestSimulationModule implements IModule {
  id = 'test_simulation';
  dependencies?: string[];
  ecsSystems = [createLevelUpSystem()];

  async initialize(core: GameCore): Promise<void> {
    const ecs = core.getECSManager();
    const eventBus = core.getEventBus();

    // Создаём несколько домов для демонстрации системы повышения уровня
    createHouseEntity(ecs, eventBus, 'House A', 2);
    createHouseEntity(ecs, eventBus, 'House B', 3);
    createHouseEntity(ecs, eventBus, 'House C', 5);

    debugLog('TestSimulationModule initialized');
  }

  destroy(): void {
    debugLog('TestSimulationModule destroyed');
  }
}
