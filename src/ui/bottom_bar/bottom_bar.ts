import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';

/**
 * Нижняя панель управления (как в Cities: Skylines)
 * Содержит управление временем (тиками)
 * Теги: arch:ui, gameplay:time-control, tech:phaser
 */
export class BottomBar {
  private scene: Phaser.Scene;
  private core: GameCore;
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private speedButtons: Phaser.GameObjects.Text[] = [];
  private currentSpeed: number = 1.0;
  private isPaused: boolean = false;

  // Константы
  private readonly BAR_HEIGHT = 80;
  private readonly BUTTON_WIDTH = 60;
  private readonly BUTTON_HEIGHT = 50;
  private readonly BUTTON_SPACING = 10;
  private readonly BUTTON_Y_OFFSET = 15;

  constructor(scene: Phaser.Scene, core: GameCore) {
    this.scene = scene;
    this.core = core;
  }

  create(): void {
    const { width, height } = this.scene.scale;
    const barY = height - this.BAR_HEIGHT;

    // Создаем контейнер для всей панели
    this.container = this.scene.add.container(0, 0);

    // Фон панели (темный полупрозрачный)
    this.background = this.scene.add.rectangle(
      width / 2,
      barY + this.BAR_HEIGHT / 2,
      width,
      this.BAR_HEIGHT,
      0x1a1a1a,
      0.95,
    );
    this.container.add(this.background);

    // Кнопки управления временем
    this.createSpeedButtons(barY);

    // Подписка на события изменения скорости
    this.subscribeToEvents();

    // Синхронизация начального состояния с TickManager
    const tickManager = this.core.getTickManager();
    this.currentSpeed = tickManager.getSpeed();
    this.isPaused = !tickManager.isActive();

    // Установка начального состояния
    this.updateSpeedDisplay();
  }

  private createSpeedButtons(barY: number): void {
    const { width } = this.scene.scale;
    const startX = width / 2 - (this.BUTTON_WIDTH * 2 + this.BUTTON_SPACING * 1.5);

    // Кнопка паузы (⏸)
    const pauseButton = this.createButton(
      startX,
      barY + this.BUTTON_Y_OFFSET + this.BUTTON_HEIGHT / 2,
      '⏸',
      () => this.onPauseClick(),
    );
    this.speedButtons.push(pauseButton);

    // Кнопка 1x
    const speed1xButton = this.createButton(
      startX + this.BUTTON_WIDTH + this.BUTTON_SPACING,
      barY + this.BUTTON_Y_OFFSET + this.BUTTON_HEIGHT / 2,
      '1x',
      () => this.onSpeedClick(1.0),
    );
    this.speedButtons.push(speed1xButton);

    // Кнопка 2x
    const speed2xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 2,
      barY + this.BUTTON_Y_OFFSET + this.BUTTON_HEIGHT / 2,
      '2x',
      () => this.onSpeedClick(2.0),
    );
    this.speedButtons.push(speed2xButton);

    // Кнопка 3x
    const speed3xButton = this.createButton(
      startX + (this.BUTTON_WIDTH + this.BUTTON_SPACING) * 3,
      barY + this.BUTTON_Y_OFFSET + this.BUTTON_HEIGHT / 2,
      '3x',
      () => this.onSpeedClick(3.0),
    );
    this.speedButtons.push(speed3xButton);

    this.container.add(this.speedButtons);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    // Фон кнопки
    const bg = this.scene.add.rectangle(x, y, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 0x34495e, 1);

    // Текст кнопки
    const buttonText = this.scene.add
      .text(x, y, text, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Делаем интерактивным
    bg.setInteractive({ useHandCursor: true });
    buttonText.setInteractive({ useHandCursor: true });

    // Обработчики событий
    const handlePointerOver = () => {
      bg.setFillStyle(0x2c3e50);
    };

    const handlePointerOut = () => {
      bg.setFillStyle(0x34495e);
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

    this.container.add([bg, buttonText]);

    return buttonText;
  }

  private onPauseClick(): void {
    // Проверяем состояние напрямую из TickManager
    const tickManager = this.core.getTickManager();
    const isCurrentlyPaused = !tickManager.isActive();
    const currentSpeed = tickManager.getSpeed();

    if (isCurrentlyPaused) {
      // Возобновление - устанавливаем скорость 1x (или предыдущую скорость, если она была > 0)
      const resumeSpeed = currentSpeed > 0 ? currentSpeed : 1.0;
      this.sendSpeedCommand(resumeSpeed);
    } else {
      // Пауза - сохраняем текущую скорость и устанавливаем 0
      // Сохраняем текущую скорость для возобновления
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
    // Отправляем событие напрямую, минуя очередь команд
    // Это необходимо, т.к. на паузе тики не выполняются и команды из очереди не обрабатываются
    this.core.getEventBus().emit('SetSimulationSpeedRequested', {
      speedLevel: speed,
    });
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на изменение скорости
    eventBus.on<{ oldSpeed: number; newSpeed: number }>('SpeedChanged', (payload) => {
      if (payload) {
        this.currentSpeed = payload.newSpeed;
        this.isPaused = payload.newSpeed === 0.0;
        this.updateSpeedDisplay();
      }
    });

    // Подписка на паузу/возобновление
    eventBus.on('SimulationPaused', () => {
      this.isPaused = true;
      this.updateSpeedDisplay();
    });

    eventBus.on('SimulationResumed', () => {
      this.isPaused = false;
      this.updateSpeedDisplay();
    });
  }

  private updateSpeedDisplay(): void {
    // Обновляем визуальное состояние кнопок
    this.speedButtons.forEach((button, index) => {
      const bg = button.parentContainer?.list[0] as Phaser.GameObjects.Rectangle;
      if (!bg) return;

      let isActive = false;

      if (index === 0) {
        // Кнопка паузы
        isActive = this.isPaused;
        button.setText(this.isPaused ? '▶' : '⏸');
      } else if (index === 1) {
        // 1x
        isActive = !this.isPaused && this.currentSpeed === 1.0;
      } else if (index === 2) {
        // 2x
        isActive = !this.isPaused && this.currentSpeed === 2.0;
      } else if (index === 3) {
        // 3x
        isActive = !this.isPaused && this.currentSpeed === 3.0;
      }

      // Подсветка активной кнопки
      if (isActive) {
        bg.setFillStyle(0x4a90e2);
      } else {
        bg.setFillStyle(0x34495e);
      }
    });
  }

  // Обновление при изменении размера экрана
  resize(): void {
    const { width, height } = this.scene.scale;
    const barY = height - this.BAR_HEIGHT;

    this.background.setSize(width, this.BAR_HEIGHT);
    this.background.setPosition(width / 2, barY + this.BAR_HEIGHT / 2);

    // Пересоздаем кнопки на новых позициях
    this.speedButtons.forEach((button) => {
      button.destroy();
    });
    this.speedButtons = [];
    this.createSpeedButtons(barY);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
