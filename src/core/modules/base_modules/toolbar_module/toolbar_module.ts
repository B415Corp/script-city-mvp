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
      orientation: 'horizontal', // Горизонтальная ориентация для полной ширины
      sections: [
        {
          id: 'upper',
          className: 'upper-section',
          expandable: true,
          expanded: false,
          tools: [
            // Левая часть - кнопка инструментов
            {
              label: '🔧 Инструменты',
              variant: 'primary',
              size: 'medium',
              onClick: () => this.toggleToolsSection(),
            },
            // Правая часть - режим редактирования
            {
              label: '✏️ Редактирование',
              variant: 'secondary',
              size: 'medium',
              onClick: () => this.toggleEditMode(),
            },
          ],
        },
        {
          id: 'lower',
          className: 'lower-section',
          tools: [
            // Управление временем
            {
              label: '⏸️ Пауза',
              variant: 'warning',
              size: 'small',
              onClick: () => {
                this.eventBus.emit(Events.GamePauseToggle, undefined);
                this.switchTimeButton('pause');
              },
            },
            {
              label: '🐌 X1',
              variant: 'success',
              size: 'small',
              onClick: () => {
                this.eventBus.emit(Events.SetGameSpeed, { speed: 10 });
                this.switchTimeButton('speedX1');
              },
            },
            {
              label: '🐕 X2',
              variant: 'secondary',
              size: 'small',
              onClick: () => {
                this.eventBus.emit(Events.SetGameSpeed, { speed: 60 });
                this.switchTimeButton('speedX2');
              },
            },
            {
              label: '🐆 X3',
              variant: 'secondary',
              size: 'small',
              onClick: () => {
                this.eventBus.emit(Events.SetGameSpeed, { speed: 240 });
                this.switchTimeButton('speedX3');
              },
            },
          ],
        },
      ],
    });

    // X1 активен по умолчанию
    const speedX1Btn = this.toolbar.getTool('lower', '🐌 X1');
    if (speedX1Btn) {
      speedX1Btn.setVariant('success');
      this.speedButtons.set('speedX1', speedX1Btn);
    }

    // Сохраняем ссылки на кнопки для управления
    this.saveToolReferences();

    // Создаем бейдж для времени игры
    this.gameTimeBadge = new HTMLBadge({
      text: '16:00',
      variant: 'primary',
      size: 'large',
    });

    // Добавляем бейдж к нижней секции
    const lowerSection = this.toolbar.getSection('lower');
    if (lowerSection) {
      lowerSection.appendChild(this.gameTimeBadge.getElement());
    }

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

  private saveToolReferences(): void {
    // Сохраняем ссылки на кнопки управления временем
    const pauseBtn = this.toolbar.getTool('lower', '⏸️ Пауза');
    const speedX2Btn = this.toolbar.getTool('lower', '🐕 X2');
    const speedX3Btn = this.toolbar.getTool('lower', '🐆 X3');

    if (pauseBtn) this.speedButtons.set('pause', pauseBtn);
    if (speedX2Btn) this.speedButtons.set('speedX2', speedX2Btn);
    if (speedX3Btn) this.speedButtons.set('speedX3', speedX3Btn);
  }

  private toggleToolsSection(): void {
    // Определяем инструменты для expandable секции
    const tools = [
      {
        label: '🏠 Жилая зона',
        variant: 'secondary' as const,
        size: 'medium' as const,
        onClick: () => {
          this.eventBus.emit(Events.SelectTool, { type: 'living_zone' });
          this.switchActiveTool('living_zone');
          this.collapseToolsSection();
        },
      },
      {
        label: '🏪 Коммерческая зона',
        variant: 'secondary' as const,
        size: 'medium' as const,
        onClick: () => {
          this.eventBus.emit(Events.SelectTool, { type: 'commercial_zone' });
          this.switchActiveTool('commercial_zone');
          this.collapseToolsSection();
        },
      },
      {
        label: '🗑️ Очистить зону',
        variant: 'danger' as const,
        size: 'medium' as const,
        onClick: () => {
          this.eventBus.emit(Events.SelectTool, { type: 'clear_zone' });
          this.switchActiveTool('clear_zone');
          this.collapseToolsSection();
        },
      },
    ];

    // Добавляем инструменты в expandable секцию
    this.toolbar.addToolsToExpandable('upper', tools);

    // Переключаем видимость секции
    this.toolbar.toggleSection('upper');
  }

  private collapseToolsSection(): void {
    this.toolbar.collapseSection('upper');
  }

  private toggleEditMode(): void {
    // Пока просто UI - ничего не делает, как указано в требованиях
    const editButton = this.toolbar.getTool('upper', '✏️ Редактирование');
    if (editButton) {
      const currentVariant = editButton.getElement().className.includes('success')
        ? 'secondary'
        : 'success';
      editButton.setVariant(currentVariant);
    }
  }

  private switchActiveTool(toolName: string): void {
    // Логика переключения активного инструмента
    // Поскольку инструменты теперь в выпадающем меню,
    // здесь можно добавить визуальную индикацию активного инструмента
    this.logger.debug(`Tool switched to: ${toolName}`);
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
