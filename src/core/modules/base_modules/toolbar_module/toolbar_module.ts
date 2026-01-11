import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { HTMLToolbar, HTMLButton, HTMLBadge } from '@/ui/html';
import { BaseModule } from '../../extends';
import { ToolsEvents } from '../tools_module/types';
import { Logger } from '@/core/utils/logger';

export class ToolbarModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  private logger!: Logger;

  // HTML UI элементы
  private toolbar!: HTMLToolbar;
  private toolButtons: Map<string, HTMLButton> = new Map();
  private speedButtons: Map<string, HTMLButton> = new Map();
  private gameTimeBadge!: HTMLBadge;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.logger = Logger.create('ToolbarModule');
    this.logger.info('ToolbarModule initialized');
    this.scene = scene;
    this.eventBus = eventBus;

    this.createToolbar();
  }

  private createToolbar(): void {
    // Создаем HTML панель инструментов в нижней части экрана
    this.toolbar = new HTMLToolbar({
      position: 'bottom',
      orientation: 'horizontal',
    });

    // Создаем кнопки инструментов зоны
    const livingZoneBtn = this.toolbar.addTool({
      label: '🏠 Жилая зона',
      variant: 'secondary',
      size: 'medium',
      onClick: () => {
        this.eventBus.emit(Events.SelectTool, { type: 'living_zone' });
        this.switchActiveTool('living_zone');
      },
    });
    this.toolButtons.set('living_zone', livingZoneBtn);

    const commercialZoneBtn = this.toolbar.addTool({
      label: '🏪 Коммерческая зона',
      variant: 'secondary',
      size: 'medium',
      onClick: () => {
        this.eventBus.emit(Events.SelectTool, { type: 'commercial_zone' });
        this.switchActiveTool('commercial_zone');
      },
    });
    this.toolButtons.set('commercial_zone', commercialZoneBtn);

    const clearZoneBtn = this.toolbar.addTool({
      label: '🗑️ Очистить зону',
      variant: 'danger',
      size: 'medium',
      onClick: () => {
        this.eventBus.emit(Events.SelectTool, { type: 'clear_zone' });
        this.switchActiveTool('clear_zone');
      },
    });
    this.toolButtons.set('clear_zone', clearZoneBtn);

    // Создаем кнопки управления скоростью
    const pauseBtn = this.toolbar.addTool({
      label: '⏸️ Пауза',
      variant: 'warning',
      size: 'small',
      onClick: () => {
        this.eventBus.emit(Events.GamePauseToggle, undefined);
        this.switchTimeButton('pause');
      },
    });
    this.speedButtons.set('pause', pauseBtn);

    const speedX1Btn = this.toolbar.addTool({
      label: '🐌 X1',
      variant: 'success',
      size: 'small',
      onClick: () => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 10 });
        this.switchTimeButton('speedX1');
      },
    });
    this.speedButtons.set('speedX1', speedX1Btn);
    // X1 активен по умолчанию
    speedX1Btn.setVariant('success');

    const speedX2Btn = this.toolbar.addTool({
      label: '🐕 X2',
      variant: 'secondary',
      size: 'small',
      onClick: () => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 60 });
        this.switchTimeButton('speedX2');
      },
    });
    this.speedButtons.set('speedX2', speedX2Btn);

    const speedX3Btn = this.toolbar.addTool({
      label: '🐆 X3',
      variant: 'secondary',
      size: 'small',
      onClick: () => {
        this.eventBus.emit(Events.SetGameSpeed, { speed: 240 });
        this.switchTimeButton('speedX3');
      },
    });
    this.speedButtons.set('speedX3', speedX3Btn);

    // Создаем бейдж для времени игры
    this.gameTimeBadge = new HTMLBadge({
      text: '16:00',
      variant: 'primary',
      size: 'medium',
    });

    // Добавляем бейдж к панели инструментов
    this.toolbar.getElement().appendChild(this.gameTimeBadge.getElement());

    // Подписываемся на события
    this.eventBus.on(Events.ResetToolToDefault, () => {
      this.switchActiveTool('select');
    });

    this.eventBus.on(Events.GameTimeUpdated, (payload) => {
      if (payload) {
        const { date, timeOfDay } = payload;
        this.gameTimeBadge.updateText(`${date} ${timeOfDay}`);
      }
    });

    // Добавляем панель в DOM
    this.toolbar.appendTo(document.body);
  }

  private switchActiveTool(toolName: string): void {
    // Сбрасываем все инструменты
    this.toolButtons.forEach((button) => {
      button.setVariant('secondary');
    });

    // Активируем выбранный инструмент
    const activeButton = this.toolButtons.get(toolName);
    if (activeButton) {
      activeButton.setVariant('primary');
    }
  }

  private switchTimeButton(buttonName: string): void {
    // Сбрасываем все кнопки скорости
    this.speedButtons.forEach((button, key) => {
      if (key === 'pause') {
        button.setVariant('warning');
      } else {
        button.setVariant('secondary');
      }
    });

    // Активируем выбранную кнопку
    const activeButton = this.speedButtons.get(buttonName);
    if (activeButton) {
      if (buttonName === 'pause') {
        activeButton.setVariant('danger');
      } else {
        activeButton.setVariant('success');
      }
    }
  }
}

export default ToolbarModule;
