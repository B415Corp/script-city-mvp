import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { SpeedControls } from '@/ui/speed_controls/speed_controls';
import { TopBar } from './top_bar';
import { StatisticsBar } from './statistics_bar';
import { debugError, debugLog } from '@/infrastructure/utils/logger';

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
  private saveButton!: Phaser.GameObjects.Container;

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

    // Создаём кнопку сохранения
    const saveButtonX = speedControlsX + this.speedControls.getWidth() + 30;
    this.createSaveButton(saveButtonX, speedControlsY);
  }

  private createSaveButton(x: number, y: number): void {
    const baseColor = 0x2a7a2a;
    const hoverColor = 0x3a9a3a;

    const background = this.scene.rexUI.add.roundRectangle(0, 0, 90, 50, 6, baseColor, 1);
    const text = this.scene.add.text(0, 0, '💾 Save', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });

    const label = this.scene.rexUI.add.label({
      width: 90,
      height: 50,
      background,
      text,
      align: 'center',
      space: { left: 8, right: 8, top: 6, bottom: 6 },
    }) as Phaser.GameObjects.Container;

    label.setSize(90, 50);
    label.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 90, 50),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    label.on('pointerover', () => background.setFillStyle(hoverColor));
    label.on('pointerout', () => background.setFillStyle(baseColor));
    label.on('pointerdown', () => this.onSaveButtonClick());

    label.setPosition(x, y);
    this.saveButton = label;
    this.container.add(label);
  }

  private async onSaveButtonClick(): Promise<void> {
    try {
      const saveManager = this.core.getSaveManager();
      const saveName = `Manual Save ${new Date().toLocaleString()}`;

      await saveManager.saveGame({ saveName });

      debugLog('💾 Game saved successfully!', { saveName });

      // Показываем уведомление об успешном сохранении
      this.showSaveNotification('Game saved!', 0x2a7a2a);
    } catch (error) {
      debugError('💾 Failed to save game:', error);
      this.showSaveNotification('Save failed!', 0xff0000);
    }
  }

  private showSaveNotification(message: string, color: number): void {
    const { width, height } = this.scene.scale;
    const badgeLabel = this.scene.rexUI.add.badgeLabel({
      x: width / 2,
      y: height / 2,
      background: this.scene.rexUI.add.roundRectangle(0, 0, 240, 70, 10, color, 0.9),
      main: this.scene.add
        .text(0, 0, message, {
          fontSize: '18px',
          color: '#ffffff',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5),
    });

    badgeLabel.setDepth(UIComponent.DEPTH.UI_MODAL);
    badgeLabel.setAlpha(0);
    badgeLabel.layout();

    this.scene.tweens.add({
      targets: badgeLabel,
      alpha: { from: 0, to: 1 },
      duration: 200,
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: badgeLabel,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              badgeLabel.destroy();
            },
          });
        });
      },
    });
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

    // Обновление позиции кнопки сохранения
    const saveButtonX = speedControlsX + this.speedControls.getWidth() + 30;
    this.saveButton.setPosition(saveButtonX, speedControlsY);
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

    if (this.saveButton) {
      this.saveButton.destroy();
    }

    super.destroy();
  }
}
