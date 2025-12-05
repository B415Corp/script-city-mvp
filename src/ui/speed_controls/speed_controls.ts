import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';
import { createRexButton, RexButton, setButtonActive } from '@/ui/common/rex_ui_factory';

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
  private buttons: Array<RexButton & { speed: number | null }> = [];
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
    // Позиционируем относительно левого края контейнера
    const startX = this.BUTTON_WIDTH / 2;

    const pauseButton = this.createButton(startX, 0, '⏸', () => this.onPauseClick(), null);
    const speed1xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 1,
      0,
      '1x',
      () => this.onSpeedClick(1.0),
      1.0,
    );
    const speed2xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 2,
      0,
      '2x',
      () => this.onSpeedClick(2.0),
      2.0,
    );
    const speed3xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 3,
      0,
      '3x',
      () => this.onSpeedClick(3.0),
      3.0,
    );

    this.buttons = [pauseButton, speed1xButton, speed2xButton, speed3xButton];
    this.buttons.forEach((btn) => this.container.add(btn.label));
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    speed: number | null,
  ): RexButton & { speed: number | null } {
    const button = createRexButton(this.scene, {
      width: this.BUTTON_WIDTH,
      height: this.BUTTON_HEIGHT,
      text,
      fontSize: '18px',
      onClick,
      onPointerOut: () => this.updateDisplay(),
    });

    button.label.setPosition(x, y);
    return { ...button, speed };
  }

  private isButtonActive(button: RexButton & { speed: number | null }): boolean {
    if (button.speed === null) {
      return this.isPaused;
    }
    return !this.isPaused && this.currentSpeed === button.speed;
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
      const isActive = this.isButtonActive(button);

      if (index === 0) {
        button.text.setText(this.isPaused ? '▶' : '⏸');
      }

      setButtonActive(button, isActive);
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
