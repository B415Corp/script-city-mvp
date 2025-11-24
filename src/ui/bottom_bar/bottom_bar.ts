import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { SpeedControls } from '@/ui/speed_controls/speed_controls';
import { TopBar } from './top_bar';
import { StatisticsBar } from './statistics_bar';
import { GameMenuModal } from '@/ui/game_menu_modal/game_menu_modal';

/**
 * Нижняя панель управления (в стиле Cities: Skylines)
 * Состоит из двух полос:
 * - Верхняя полоса: категории инструментов (при клике показывается подполоса с инструментами НАД верхней полосой)
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

  // Модальное меню игры
  private gameMenuModal!: GameMenuModal;

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

    // Создаём модальное меню игры
    this.gameMenuModal = new GameMenuModal(this.scene, this.core);
    this.gameMenuModal.create();

    // Подписка на события клавиатуры для обработки ESC
    this.subscribeToKeyboardEvents();
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

    // Обновление модального меню
    if (this.gameMenuModal) {
      this.gameMenuModal.resize();
    }
  }

  /**
   * Подписка на события клавиатуры для обработки ESC.
   */
  private subscribeToKeyboardEvents(): void {
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      this.handleEscapeKey();
    });
  }

  /**
   * Обработка нажатия клавиши ESC.
   * Приоритет действий:
   * 1. Если открыта подполоса инструментов - закрываем её
   * 2. Если активен инструмент - деактивируем его
   * 3. Если меню открыто - закрываем его
   * 4. Если меню закрыто - открываем его
   */
  private handleEscapeKey(): void {
    // Проверяем, открыта ли подполоса инструментов
    if (this.topBar.isSubbarVisible()) {
      this.topBar.closeSubbar();
      return;
    }

    const toolManager = this.core.getToolManager();
    const activeTool = toolManager.getActiveTool();

    if (activeTool.toolId !== null) {
      // Если активен инструмент - деактивируем его
      toolManager.deactivateTool();
    } else {
      // Если инструмент не активен - показываем/скрываем меню
      if (this.gameMenuModal.getIsVisible()) {
        this.gameMenuModal.hide();
      } else {
        this.gameMenuModal.show();
      }
    }
  }

  destroy(): void {
    // Отписываемся от событий клавиатуры
    this.scene.input.keyboard?.off('keydown-ESC');

    if (this.topBar) {
      this.topBar.destroy();
    }

    if (this.statisticsBar) {
      this.statisticsBar.destroy();
    }

    if (this.speedControls) {
      this.speedControls.destroy();
    }

    if (this.gameMenuModal) {
      this.gameMenuModal.destroy();
    }

    super.destroy();
  }
}
