import { createWorld } from 'bitecs';
import { AdvancedECSManager } from './managers/advanced_ecs_manager';
import { EntityFactory } from './entities';
import { MVPInitializer } from './entities/mvp_initializer';

/**
 * Тестовая симуляция для проверки работы ECS
 * Можно запустить для демонстрации MVP
 */
export class TestSimulation {
  private world = createWorld();
  private ecs: AdvancedECSManager<Record<string, object>>;
  private entityFactory: EntityFactory;
  private mvpSetup: any;

  constructor() {
    // Создаем расширенный ECS менеджер
    this.ecs = new AdvancedECSManager({} as any, {}); // TODO: передать реальные компоненты

    this.entityFactory = new EntityFactory(this.world);

    console.log('🚀 Starting Script City MVP Simulation...');
  }

  /**
   * Инициализирует MVP симуляцию
   */
  async initialize(): Promise<void> {
    console.log('🏗️ Initializing simulation...');

    // Создаем базовые компоненты
    const components = {}; // TODO: передать все компоненты

    // Создаем MVP начальное состояние
    const initializer = new MVPInitializer(this.world, this.entityFactory);
    this.mvpSetup = initializer.initialize();

    console.log('✅ Simulation initialized!');
    console.log('📊 Stats:', this.ecs.getStats());
  }

  /**
   * Запускает тестовый цикл симуляции
   */
  async runTestCycle(ticks: number = 100): Promise<void> {
    console.log(`🎮 Running simulation for ${ticks} ticks...`);

    for (let i = 0; i < ticks; i++) {
      // Обновляем системы
      this.ecs.updateSystems(1);

      // Каждые 10 тиков выводим статистику
      if (i % 10 === 0) {
        console.log(`Tick ${i}:`, this.getSimulationStats());
      }

      // Небольшая пауза для демонстрации
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('🏁 Simulation completed!');
  }

  /**
   * Получает статистику симуляции
   */
  private getSimulationStats(): any {
    return {
      citizens: this.mvpSetup.citizens.length,
      house: 1,
      shops: this.mvpSetup.shops.length,
      workplaces: this.mvpSetup.workplaces.length,
      // TODO: добавить реальную статистику из компонентов
    };
  }

  /**
   * Сохраняет состояние симуляции
   */
  saveState(): void {
    this.ecs.saveToStorage('mvp_simulation_save');
    console.log('💾 Simulation state saved!');
  }

  /**
   * Загружает состояние симуляции
   */
  loadState(): boolean {
    const loaded = this.ecs.loadFromStorage('mvp_simulation_save');
    if (loaded) {
      console.log('📂 Simulation state loaded!');
    } else {
      console.log('❌ Failed to load simulation state');
    }
    return loaded;
  }
}

// Экспорт для тестирования
export default TestSimulation;

// Для запуска в браузере
if (typeof window !== 'undefined') {
  (window as any).TestSimulation = TestSimulation;
}
