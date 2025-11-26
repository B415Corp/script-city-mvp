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

  async initialize(core: GameCore): Promise<void> {
    console.log('🧪 [TEST SIMULATION] Инициализация модуля тестирования симуляции');

    const ecs = core.getECSManager();
    const eventBus = core.getEventBus();

    // Регистрируем систему повышения уровня
    ecs.registerSystem(createLevelUpSystem());

    // Создаем 100 домов со случайным временем повышения уровня от 50 до 100 тиков
    const HOUSE_COUNT = 500;
    const MIN_TICKS = 50;
    const MAX_TICKS = 100;

    for (let i = 1; i <= HOUSE_COUNT; i++) {
      const randomTicks = Math.floor(Math.random() * (MAX_TICKS - MIN_TICKS + 1)) + MIN_TICKS;
      createHouseEntity(ecs, eventBus, `Дом #${i}`, randomTicks);
    }

    console.log(`🧪 [TEST SIMULATION] ${HOUSE_COUNT} домов созданы и готовы к симуляции`);
  }

  registerSystems(ecs: ECSManager): void {
    // Системы уже зарегистрированы в initialize
  }

  destroy(): void {
    console.log('🧪 [TEST SIMULATION] Модуль тестирования остановлен');
  }
}
