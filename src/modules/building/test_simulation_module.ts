import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { createLevelUpSystem } from '@/ecs/systems/level_up_system';
import { createHouseEntity } from '@/ecs/entities/house_entity';

/**
 * Модуль тестирования симуляции повышения уровня зданий.
 * Создает три дома с разными интервалами повышения уровня для демонстрации ECS.
 *
 * **Теги**: `arch:module`, `feature:building`, `test:simulation`
 */

export class TestSimulationModule implements IModule {
  id = 'test_simulation';
  dependencies?: string[];

  async initialize(core: GameCore): Promise<void> {
    console.log('TestSimulationModule initialized');
  }

  destroy(): void {
    console.log('TestSimulationModule destroyed');
  }

  registerSystems(ecs: ECSManager): void {}
}
