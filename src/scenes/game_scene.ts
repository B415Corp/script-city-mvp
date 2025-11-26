import { GameCore } from '@/core/game_core/game_core';
import { DebugModule } from '@/modules/debug/debug_module';
import { GridModule } from '@/modules/grid/grid_module';
import { BottomBarModule } from '@/modules/ui/bottom_bar_module';
import { ToolsModule } from '@/modules/tools/tools_module';
import { ZoningToolsModule } from '@/modules/tools/zoning_tools_module';
import { TestSimulationModule } from '@/modules/building/test_simulation_module';

import Phaser from 'phaser';

/**
 * Основная игровая сцена с симуляцией
 * Теги: arch:core, tech:phaser, arch:simulation
 */
export class GameScene extends Phaser.Scene {
  private core!: GameCore;

  constructor() {
    super({ key: 'GameScene' });
  }
  preload() {
    this.load.image('GRASS_BASE_0', 'src/assets/texture/tiles/grass/GRASS_BASE_0.png');
    this.load.image('SAND_BASE_0', 'src/assets/texture/tiles/grass/SAND_BASE_0.png');
    this.load.image('SNOW_BASE_0', 'src/assets/texture/tiles/grass/SNOW_BASE_0.png');
    this.load.image('FOREST_BASE_0', 'src/assets/texture/tiles/grass/FOREST_BASE_0.png');
    this.load.image('MOUNTAIN_BASE_0', 'src/assets/texture/tiles/grass/MOUNTAIN_BASE_0.png');
  }
  async create(): Promise<void> {
    // Устанавливаем тёмно-серый фон сцены для контраста с сеткой
    this.cameras.main.setBackgroundColor('#1a202c');

    // Инициализация игрового ядра
    this.core = new GameCore();
    await this.core.initialize({
      tickRate: 20,
      maxCatchUpTicks: 5,
      enableDebug: true,
      playerName: 'default_player',
    });

    const moduleManager = this.core.getModuleManager();

    // ⬇️ РЕГИСТРАЦИЯ МОДУЛЕЙ
    // ToolsModule должен быть зарегистрирован первым, так как другие модули инструментов зависят от него
    moduleManager.registerModule(new ToolsModule());
    moduleManager.registerModule(new DebugModule());
    moduleManager.registerModule(new BottomBarModule());
    moduleManager.registerModule(new GridModule());
    moduleManager.registerModule(new ZoningToolsModule());
    moduleManager.registerModule(new TestSimulationModule()); // Модуль тестирования симуляции

    // 🏋️ Запуск ядра (модули инициализируются автоматически)
    await this.core.start();

    // Прикрепление модулей к сцене (UI, хоткеи и т.п.)
    moduleManager.attachModulesToScene(this);
  }

  update(_: number, delta: number): void {
    // Делегируем шаг симуляции ядру (через TickManager)
    this.core.getTickManager().updateFromPhaser(delta);
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
