import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { SpeedControls } from '@/ui/speed_controls/speed_controls';
import { TopBar } from './top_bar';
import { StatisticsBar } from './statistics_bar';

/**
 * Нижняя панель управления (в стиле Cities: Skylines)
 * Состоит из двух полос:
 * - Верхняя полоса: категории инструментов (при наведении показывается подполоса с инструментами НАД верхней полосой)
 * - Нижняя полоса: управление скоростью (первым), игровое время, статистика города
 *
 * Теги: arch:ui, gameplay:time-control, gameplay:editor, tech:phaser
 */
export class BottomBar extends UIComponent {
  // Константы размеров
  readonly TOP_BAR_HEIGHT = 60;
  readonly BOTTOM_BAR_HEIGHT = 80;

  // Компоненты полос
  private topBar!: TopBar;
  private statisticsBar!: StatisticsBar;

  // Элементы нижней полосы (управление и статистика)
  private bottomBarBackground!: Phaser.GameObjects.Rectangle;
  private speedControls!: SpeedControls;

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    const { width, height } = this.scene.scale;

    // Создаём контейнер с depth для панелей
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    // Создаём верхнюю полосу (инструменты)
    this.topBar = new TopBar(this.scene, this.core, this.BOTTOM_BAR_HEIGHT);
    this.topBar.create();

    // Создаём нижнюю полосу (управление и статистика)
    this.createBottomBar(width, height);
  }

  private createBottomBar(width: number, height: number): void {
    const bottomBarY = height - this.BOTTOM_BAR_HEIGHT;

    // Фон нижней полосы
    this.bottomBarBackground = this.scene.add.rectangle(
      width / 2,
      bottomBarY + this.BOTTOM_BAR_HEIGHT / 2,
      width,
      this.BOTTOM_BAR_HEIGHT,
      0x1a1a1a,
      0.95,
    );
    this.container.add(this.bottomBarBackground);

    // Создаём компонент управления скоростью
    this.speedControls = new SpeedControls(this.scene, this.core);
    this.speedControls.create();

    // Позиционируем кнопки скорости первыми (слева)
    const speedControlsX = 20;
    const speedControlsY = bottomBarY + this.BOTTOM_BAR_HEIGHT / 2;
    this.speedControls.setPosition(speedControlsX, speedControlsY);

    // Создаём компонент статистики
    const statisticsStartX = speedControlsX + this.speedControls.getWidth() + 30;
    this.statisticsBar = new StatisticsBar(this.scene, this.core);
    this.statisticsBar.initialize(bottomBarY, statisticsStartX);
    this.statisticsBar.create();
  }

  resize(): void {
    const { width, height } = this.scene.scale;
    const bottomBarY = height - this.BOTTOM_BAR_HEIGHT;

    // Обновление верхней полосы
    this.topBar.resize(width, height);

    // Обновление нижней полосы
    this.bottomBarBackground.setSize(width, this.BOTTOM_BAR_HEIGHT);
    this.bottomBarBackground.setPosition(width / 2, bottomBarY + this.BOTTOM_BAR_HEIGHT / 2);

    // Обновление позиции кнопок скорости
    const speedControlsX = 20;
    const speedControlsY = bottomBarY + this.BOTTOM_BAR_HEIGHT / 2;
    this.speedControls.setPosition(speedControlsX, speedControlsY);

    // Обновление элементов статистики
    const statisticsStartX = speedControlsX + this.speedControls.getWidth() + 30;
    this.statisticsBar.resize(bottomBarY, statisticsStartX);
  }

  destroy(): void {
    if (this.topBar) {
      this.topBar.destroy();
    }

    if (this.statisticsBar) {
      this.statisticsBar.destroy();
    }

    if (this.speedControls) {
      this.speedControls.destroy();
    }

    super.destroy();
  }
}
