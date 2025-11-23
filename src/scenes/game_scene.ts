import { GameCore } from '@/core/game_core/game_core';
import { DebugModule } from '@/modules/debug/debug_module';
import { BottomBar } from '@/ui/bottom_bar/bottom_bar';
import { SpeedIndicator } from '@/ui/speed_indicator/speed_indicator';
import Phaser from 'phaser';

/**
 * Основная игровая сцена с симуляцией
 * Теги: arch:core, tech:phaser, arch:simulation
 */
export class GameScene extends Phaser.Scene {
  private core!: GameCore;
  private bottomBar!: BottomBar;
  private speedIndicator!: SpeedIndicator;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create(): Promise<void> {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.core.stop();
      this.scene.start('MenuScene');
    });

    // Инициализация игрового ядра
    this.core = new GameCore();
    await this.core.initialize({
      tickRate: 20,
      maxCatchUpTicks: 5,
      enableDebug: true,
    });

    const moduleManager = this.core.getModuleManager();

    // ⬇️ РЕГИСТРАЦИЯ МОДУЛЕЙ
    // Модуль отладки — один из модулей симуляции.
    moduleManager.registerModule(new DebugModule());

    // 🏋️ Запуск ядра (модули инициализируются автоматически)
    await this.core.start();

    // Прикрепление модулей к сцене (UI, хоткеи и т.п.)
    moduleManager.attachModulesToScene(this);

    // Создание нижней панели управления
    this.bottomBar = new BottomBar(this, this.core);
    this.bottomBar.create();

    // Создание индикатора скорости (в центре экрана)
    const { width, height } = this.scale;
    this.speedIndicator = new SpeedIndicator(this, this.core, width / 2, height / 2);
    this.speedIndicator.create();
  }

  update(_: number, delta: number): void {
    // Делегируем шаг симуляции ядру (через TickManager)
    this.core.getTickManager().updateFromPhaser(delta);

    // Обновляем индикатор скорости
    if (this.speedIndicator) {
      this.speedIndicator.update(delta);
    }
  }

  // Очистка при остановке сцены
  shutdown(): void {
    if (this.speedIndicator) {
      this.speedIndicator.destroy();
    }
    if (this.bottomBar) {
      this.bottomBar.destroy();
    }
    if (this.core) {
      this.core.stop();
      // Можно также вызвать destroy() если сцена больше не нужна
    }
  }
}
