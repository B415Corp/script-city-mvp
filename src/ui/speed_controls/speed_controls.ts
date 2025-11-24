import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';

/**
 * Компонент управления скоростью игры в стиле Cities: Skylines 2.
 * Монолитная конструкция с кнопками паузы и скоростей.
 *
 * Теги: arch:ui, gameplay:time-control, tech:phaser
 */
export class SpeedControls extends UIComponent {
  // Константы размеров
  private readonly BUTTON_WIDTH = 50;
  private readonly BUTTON_HEIGHT = 50;
  private readonly BUTTON_SPACING = 2; // Без зазора между кнопками для монолитного вида
  private readonly TOTAL_WIDTH = this.BUTTON_WIDTH * 4 + this.BUTTON_SPACING * 3;

  // Элементы
  private background!: Phaser.GameObjects.Rectangle;
  private buttons: Phaser.GameObjects.Container[] = [];
  private currentSpeed: number = 1.0;
  private isPaused: boolean = false;

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    // Создаём контейнер
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    // Создаём монолитную конструкцию
    this.createMonolithicControls();

    // Подписка на события
    this.subscribeToEvents();

    // Синхронизация начального состояния
    const tickManager = this.core.getTickManager();
    this.currentSpeed = tickManager.getSpeed();
    this.isPaused = !tickManager.isActive();

    // Установка начального состояния
    this.updateDisplay();
  }

  private createMonolithicControls(): void {
    // Создаём единый фон для всех кнопок (монолитная конструкция)
    // Позиционируем относительно левого края контейнера
    this.background = this.scene.add.rectangle(
      this.TOTAL_WIDTH / 2,
      0,
      this.TOTAL_WIDTH,
      this.BUTTON_HEIGHT,
      0x2a2a2a,
      1,
    );
    this.container.add(this.background);

    // Создаём кнопки без зазоров между ними
    // Позиционируем относительно левого края контейнера
    const startX = this.BUTTON_WIDTH / 2;

    // Кнопка паузы
    const pauseButton = this.createButton(startX, 0, '⏸', () => this.onPauseClick());
    this.buttons.push(pauseButton);

    // Кнопка 1x
    const speed1xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 1,
      0,
      '1x',
      () => this.onSpeedClick(1.0),
    );
    this.buttons.push(speed1xButton);

    // Кнопка 2x
    const speed2xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 2,
      0,
      '2x',
      () => this.onSpeedClick(2.0),
    );
    this.buttons.push(speed2xButton);

    // Кнопка 3x
    const speed3xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 3,
      0,
      '3x',
      () => this.onSpeedClick(3.0),
    );
    this.buttons.push(speed3xButton);

    this.container.add(this.buttons);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Фон кнопки (без зазоров, сливается с общим фоном)
    const bg = this.scene.add.rectangle(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 0x2a2a2a, 1);

    // Разделитель справа (кроме последней кнопки)
    const divider = this.scene.add.rectangle(
      this.BUTTON_WIDTH / 2,
      0,
      1,
      this.BUTTON_HEIGHT,
      0x1a1a1a,
      1,
    );

    // Текст кнопки
    const buttonText = this.scene.add
      .text(0, 0, text, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    container.add([bg, divider, buttonText]);

    // Делаем интерактивным
    bg.setInteractive({ useHandCursor: true });
    buttonText.setInteractive({ useHandCursor: true });

    // Обработчики событий
    const handlePointerOver = () => {
      bg.setFillStyle(0x3a3a3a);
    };

    const handlePointerOut = () => {
      // Восстанавливаем цвет в зависимости от состояния
      const buttonIndex = this.buttons.indexOf(container);
      const isActive = this.isButtonActive(buttonIndex);
      bg.setFillStyle(isActive ? 0x4a90e2 : 0x2a2a2a);
    };

    const handlePointerDown = () => {
      onClick();
    };

    bg.on('pointerover', handlePointerOver);
    bg.on('pointerout', handlePointerOut);
    bg.on('pointerdown', handlePointerDown);

    buttonText.on('pointerover', handlePointerOver);
    buttonText.on('pointerout', handlePointerOut);
    buttonText.on('pointerdown', handlePointerDown);

    return container;
  }

  private isButtonActive(buttonIndex: number): boolean {
    if (buttonIndex === 0) {
      return this.isPaused;
    } else if (buttonIndex === 1) {
      return !this.isPaused && this.currentSpeed === 1.0;
    } else if (buttonIndex === 2) {
      return !this.isPaused && this.currentSpeed === 2.0;
    } else if (buttonIndex === 3) {
      return !this.isPaused && this.currentSpeed === 3.0;
    }
    return false;
  }

  private onPauseClick(): void {
    const tickManager = this.core.getTickManager();
    const isCurrentlyPaused = !tickManager.isActive();
    const currentSpeed = tickManager.getSpeed();

    if (isCurrentlyPaused) {
      const resumeSpeed = currentSpeed > 0 ? currentSpeed : 1.0;
      this.sendSpeedCommand(resumeSpeed);
    } else {
      if (currentSpeed > 0) {
        this.currentSpeed = currentSpeed;
      }
      this.sendSpeedCommand(0.0);
    }
  }

  private onSpeedClick(speed: number): void {
    this.sendSpeedCommand(speed);
  }

  private sendSpeedCommand(speed: number): void {
    this.core.getEventBus().emit(Events.SetSimulationSpeedRequested, {
      speedLevel: speed,
    });
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на изменение скорости
    eventBus.on<{ oldSpeed: number; newSpeed: number }>(Events.SpeedChanged, (payload) => {
      if (payload) {
        this.currentSpeed = payload.newSpeed;
        this.isPaused = payload.newSpeed === 0.0;
        this.updateDisplay();
      }
    });

    // Подписка на паузу/возобновление
    eventBus.on(Events.SimulationPaused, () => {
      this.isPaused = true;
      this.updateDisplay();
    });

    eventBus.on(Events.SimulationResumed, () => {
      this.isPaused = false;
      this.updateDisplay();
    });
  }

  private updateDisplay(): void {
    this.buttons.forEach((button, index) => {
      const bg = button.list[0] as Phaser.GameObjects.Rectangle;
      if (!bg) return;

      const isActive = this.isButtonActive(index);

      if (index === 0) {
        // Кнопка паузы
        const text = button.list[2] as Phaser.GameObjects.Text;
        if (text) {
          text.setText(this.isPaused ? '▶' : '⏸');
        }
      }

      // Подсветка активной кнопки
      bg.setFillStyle(isActive ? 0x4a90e2 : 0x2a2a2a);
    });
  }

  /**
   * Получение ширины компонента для позиционирования
   */
  getWidth(): number {
    return this.TOTAL_WIDTH;
  }

  /**
   * Установка позиции компонента
   */
  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    super.destroy();
  }
}
