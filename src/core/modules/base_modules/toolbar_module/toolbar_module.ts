import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { ButtonUI } from '@/ui/button.ui';
import { BaseModule } from '../../extends';
import { ToolsEvents } from '../tools_module/types';
import { BadgeUI } from '@/ui/badge.ui';

export class ToolbarModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  // UI элементы
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('ToolbarModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
    this.container = scene.add.container();
    this.container.setDepth(1000);

    this.createToolbar();
  }

  // UI контейнер в модуле
  private barContainer!: Phaser.GameObjects.Container;

  private createToolbar(): void {
    const margin = { left: 10, right: 10, top: 10, bottom: 10 };
    const height = 140; // Уменьшили высоту до 140px
    const width = this.scene.cameras.main.width - (margin.right + margin.left);
    const x = this.scene.cameras.main.width / 2 - width / 2;
    const y = this.scene.cameras.main.height - height - margin.bottom;

    // Первый ряд кнопок (инструменты)
    const livingZoneBtn = new ButtonUI(this.scene, {
      xPos: 15,
      yPos: 30, // Подняли верхний ряд ближе к верху
      w: 150,
      h: 30,
      text: 'Жилая зона',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'living_zone' });
        switchActiveTool('living_zone');
      },
    });

    const commercialZoneBtn = new ButtonUI(this.scene, {
      xPos: 15 + livingZoneBtn.width + 15,
      yPos: 30,
      w: 220,
      h: 30,
      text: 'Коммерческая зона',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'commercial_zone' });
        switchActiveTool('commercial_zone');
      },
    });

    const clearZoneBtn = new ButtonUI(this.scene, {
      xPos: commercialZoneBtn.xPosition + commercialZoneBtn.width + 15,
      yPos: 30,
      w: 175,
      h: 30,
      text: 'Очистить зону',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'clear_zone' });
        switchActiveTool('clear_zone');
      },
    });

    this.eventBus.on(Events.ResetToolToDefault, (payload) => {
      switchActiveTool('select');
    });

    // Второй ряд кнопок (скорость игры)
    const pauseBtn = new ButtonUI(this.scene, {
      xPos: 15,
      yPos: 75, // Уменьшили gap, второй ряд ближе к первому (разрыв всего 15px)
      w: 80,
      h: 30,
      text: 'Пауза',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.GamePauseToggle);
        switchTimeButton('pause');
      },
    });

    const speedX1Btn = new ButtonUI(this.scene, {
      xPos: 15 + pauseBtn.width + 15,
      yPos: 75,
      w: 60,
      h: 30,
      text: 'X1',
      depth: 1001,
      isActive: true,
      onClick: (): void => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 10 });
        switchTimeButton('speedX1');
      },
    });
    speedX1Btn.setActiveTab(true);

    const speedX2Btn = new ButtonUI(this.scene, {
      xPos: speedX1Btn.xPosition + speedX1Btn.width + 15,
      yPos: 75,
      w: 60,
      h: 30,
      text: 'X2',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 60 });
        switchTimeButton('speedX2');
      },
    });

    const speedX3Btn = new ButtonUI(this.scene, {
      xPos: speedX2Btn.xPosition + speedX2Btn.width + 15,
      yPos: 75,
      w: 60,
      h: 30,
      text: 'X3',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 240 });
        switchTimeButton('speedX3');
      },
    });

    const gameTimeText = new BadgeUI(this.scene, {
      xPos: speedX3Btn.xPosition + speedX3Btn.width + 15,
      yPos: 75,
      w: 220,
      h: 30,
      text: '16:00',
      depth: 1001,
    });

    this.eventBus.on(Events.GameTimeUpdated, (payload) => {
      if (payload) {
        const { date, timeOfDay } = payload;
        gameTimeText.update(`${date} ${timeOfDay}`);
      }
    });

    // Контейнер бара
    this.barContainer = this.scene.add.container(x, y);
    this.barContainer.setDepth(1001);
    // маска для перхвата нажатия
    // Пустой обработчик поглощает событие

    // Фон бара
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 16);
    bg.strokeRoundedRect(0, 0, width, height, 16);

    this.barContainer.add(bg);

    // Добавляем кнопки первого ряда
    this.barContainer.add(livingZoneBtn.container);
    this.barContainer.add(commercialZoneBtn.container);
    this.barContainer.add(clearZoneBtn.container);

    // Добавляем кнопки второго ряда
    this.barContainer.add(gameTimeText.container);
    this.barContainer.add(pauseBtn.container);
    this.barContainer.add(speedX1Btn.container);
    this.barContainer.add(speedX2Btn.container);
    this.barContainer.add(speedX3Btn.container);

    function switchActiveTool(toolName: string): void {
      livingZoneBtn.setActiveTab(false);
      commercialZoneBtn.setActiveTab(false);
      clearZoneBtn.setActiveTab(false);

      if (toolName === 'living_zone') {
        livingZoneBtn.setActiveTab(true);
      }
      if (toolName === 'commercial_zone') {
        commercialZoneBtn.setActiveTab(true);
      }
      if (toolName === 'clear_zone') {
        clearZoneBtn.setActiveTab(true);
      }
    }

    function switchTimeButton(buttonName: string): void {
      pauseBtn.setActiveTab(false);
      speedX1Btn.setActiveTab(false);
      speedX2Btn.setActiveTab(false);
      speedX3Btn.setActiveTab(false);

      if (buttonName === 'pause') {
        pauseBtn.setActiveTab(true);
      }
      if (buttonName === 'speedX1') {
        speedX1Btn.setActiveTab(true);
      }
      if (buttonName === 'speedX2') {
        speedX2Btn.setActiveTab(true);
      }
      if (buttonName === 'speedX3') {
        speedX3Btn.setActiveTab(true);
      }
    }
    // Добавляем бар в контейнер модуля
    this.container.add(this.barContainer);
  }
}

export default ToolbarModule;
