import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';

/**
 * Боковой сайдбар отладки с информацией о тиках, модулях и событиях
 * Теги: arch:ui, debug:info, tech:phaser
 */
export class DebugWindow extends UIComponent {
  private background!: Phaser.GameObjects.Rectangle;
  private toggleButton!: Phaser.GameObjects.Rectangle;
  private toggleButtonText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private tickText!: Phaser.GameObjects.Text;
  private toolText!: Phaser.GameObjects.Text;
  private modulesText!: Phaser.GameObjects.Text;
  private eventsText!: Phaser.GameObjects.Text;
  private isVisible: boolean = true;

  // Константы
  private readonly SIDEBAR_WIDTH = 280;
  private readonly TOGGLE_BUTTON_WIDTH = 30;
  private readonly TOGGLE_BUTTON_HEIGHT = 60;
  private readonly PADDING = 12;
  private readonly FONT_SIZE = '11px';
  private readonly UPDATE_INTERVAL = 100; // обновление каждые 100ms реального времени
  private readonly SECTION_SPACING = 10; // отступ между секциями

  /**
   * События, которые не нужно показывать в debug панели.
   * Используется Set для быстрой проверки исключений.
   */
  private readonly EXCLUDED_EVENTS = new Set<string>([Events.TickStarted, Events.TickEnded]);

  private lastUpdateTime: number = 0; // время последнего обновления в реальном времени

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    const { width, height } = this.scene.scale;

    // Создаём контейнер с depth для панелей
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);
    this.container.setVisible(this.isVisible);

    // Фон сайдбара
    const sidebarX = width - this.SIDEBAR_WIDTH;
    this.background = this.scene.add.rectangle(
      sidebarX + this.SIDEBAR_WIDTH / 2,
      height / 2,
      this.SIDEBAR_WIDTH,
      height,
      0x1a1a1a,
      0.95,
    );
    this.background.setStrokeStyle(2, 0x4a90e2, 1);
    this.container.add(this.background);

    // Контейнер для контента
    this.contentContainer = this.scene.add.container(sidebarX + this.PADDING, this.PADDING);
    this.container.add(this.contentContainer);

    // Заголовок
    const titleText = this.scene.add
      .text(0, 0, '🐛 Debug', {
        fontSize: '14px',
        color: '#4a90e2',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0);
    this.contentContainer.add(titleText);

    // Текст тиков - позиция будет обновляться динамически
    this.tickText = this.scene.add
      .text(0, 0, '', {
        fontSize: this.FONT_SIZE,
        color: '#ffffff',
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.tickText);

    // Текст активного инструмента - позиция будет обновляться динамически
    this.toolText = this.scene.add
      .text(0, 0, '', {
        fontSize: this.FONT_SIZE,
        color: '#90ee90',
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.toolText);

    // Текст модулей - позиция будет обновляться динамически
    this.modulesText = this.scene.add
      .text(0, 0, '', {
        fontSize: this.FONT_SIZE,
        color: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: this.SIDEBAR_WIDTH - this.PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.modulesText);

    // Текст событий - позиция будет обновляться динамически
    this.eventsText = this.scene.add
      .text(0, 0, '', {
        fontSize: this.FONT_SIZE,
        color: '#cccccc',
        fontFamily: 'Arial',
        wordWrap: { width: this.SIDEBAR_WIDTH - this.PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.eventsText);

    // Кнопка переключения видимости
    this.toggleButton = this.scene.add.rectangle(
      0,
      height / 2,
      this.TOGGLE_BUTTON_WIDTH,
      this.TOGGLE_BUTTON_HEIGHT,
      0x2a2a2a,
      0.9,
    );
    this.toggleButton.setStrokeStyle(2, 0x4a90e2, 1);
    this.toggleButton.setInteractive({ useHandCursor: true });
    this.toggleButton.on('pointerdown', () => this.toggle());
    this.container.add(this.toggleButton);

    this.toggleButtonText = this.scene.add
      .text(0, height / 2, '◀', {
        fontSize: '16px',
        color: '#4a90e2',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    this.container.add(this.toggleButtonText);

    // Подписка на клавишу для переключения (F3)
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });

    // Первоначальное позиционирование и обновление
    this.updateVisibility();
    this.lastUpdateTime = Date.now();
    this.updateInfo();
  }

  update(): void {
    // Обновление происходит на основе реального времени, независимо от скорости игры
    // Это гарантирует, что debug панель обновляется с постоянной частотой
    if (!this.isVisible) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;

    if (timeSinceLastUpdate >= this.UPDATE_INTERVAL) {
      this.updateInfo();
      this.lastUpdateTime = currentTime;
    }
  }

  /**
   * Вычисляет высоту текстового элемента с учетом переносов строк.
   */
  private getTextHeight(textObject: Phaser.GameObjects.Text): number {
    const text = textObject.text;
    if (!text) {
      return 0;
    }
    const lines = text.split('\n').length;
    const lineHeight = textObject.style.fontSize
      ? parseInt(textObject.style.fontSize.toString().replace('px', ''))
      : 11;
    // lineSpacing задается при создании текста, используем значение по умолчанию
    const lineSpacing = 2;
    return lines * (lineHeight + lineSpacing);
  }

  /**
   * Позиционирует элементы друг под другом динамически.
   */
  private layoutElements(): void {
    let currentY = 25; // Начальная позиция после заголовка

    // Позиционируем тики
    this.tickText.setY(currentY);
    currentY += this.getTextHeight(this.tickText) + this.SECTION_SPACING;

    // Позиционируем активный инструмент
    this.toolText.setY(currentY);
    currentY += this.getTextHeight(this.toolText) + this.SECTION_SPACING;

    // Позиционируем модули
    this.modulesText.setY(currentY);
    currentY += this.getTextHeight(this.modulesText) + this.SECTION_SPACING;

    // Позиционируем события
    this.eventsText.setY(currentY);
  }

  private updateInfo(): void {
    const tickManager = this.core.getTickManager();
    const eventBus = this.core.getEventBus();
    const moduleManager = this.core.getModuleManager();

    // Информация о тиках
    const currentTick = tickManager.getCurrentTick();
    const tickRate = tickManager.getTickRate();
    const effectiveTickRate = tickManager.getEffectiveTickRate();
    const ticksPerSecond = tickManager.getTicksPerSecond();
    const speed = tickManager.getSpeed();
    const isPaused = !tickManager.isActive();

    this.tickText.setText(
      `Tick: ${currentTick}\nRate: ${tickRate}/s\nEffective: ${effectiveTickRate.toFixed(1)}/s\nActual: ${ticksPerSecond}/s\nSpeed: ${isPaused ? '⏸' : `${speed}x`}`,
    );

    // Информация об активном инструменте
    try {
      const toolManager = this.core.getToolManager();
      const activeTool = toolManager.getActiveTool();
      if (activeTool.toolId) {
        const tool = toolManager.getTool(activeTool.toolId);
        if (tool) {
          this.toolText.setText(
            `Tool: ${tool.icon} ${tool.name}\nType: ${tool.type}\nCategory: ${tool.categoryId}`,
          );
        } else {
          this.toolText.setText('Tool: Unknown');
        }
      } else {
        this.toolText.setText('Tool: None');
      }
    } catch {
      // ToolManager может быть не инициализирован
      this.toolText.setText('Tool: N/A');
    }

    // Информация о модулях
    const modules = moduleManager.getAllModules();
    if (modules.length === 0) {
      this.modulesText.setText('Modules:\n(no modules)');
    } else {
      const modulesList = modules.map((module) => `• ${module.id}`).join('\n');
      this.modulesText.setText(`Modules (${modules.length}):\n${modulesList}`);
    }

    // Информация о последних событиях (исключая события тиков)
    const eventHistory = eventBus.getEventHistory();
    const filteredEvents = eventHistory.filter(
      (entry) => !this.EXCLUDED_EVENTS.has(entry.eventType),
    );

    if (filteredEvents.length === 0) {
      this.eventsText.setText('Events:\n(no events yet)');
    } else {
      // Разворачиваем массив, чтобы последние события были первыми
      const reversedEvents = filteredEvents.slice().reverse();

      // Группируем повторяющиеся события подряд
      interface GroupedEvent {
        eventType: string;
        count: number;
        lastTimestamp: number;
        lastPayload?: unknown;
      }

      const groupedEvents: GroupedEvent[] = [];
      for (const entry of reversedEvents) {
        const lastGroup = groupedEvents[groupedEvents.length - 1];
        if (lastGroup && lastGroup.eventType === entry.eventType) {
          // Увеличиваем счетчик повторений
          lastGroup.count++;
          lastGroup.lastTimestamp = entry.timestamp;
          lastGroup.lastPayload = entry.payload;
        } else {
          // Новое уникальное событие
          groupedEvents.push({
            eventType: entry.eventType,
            count: 1,
            lastTimestamp: entry.timestamp,
            lastPayload: entry.payload,
          });
        }
      }

      // Формируем список событий (максимум 10 уникальных)
      const eventsList = groupedEvents
        .slice(0, 10)
        .map((group, index) => {
          const timeAgo = Date.now() - group.lastTimestamp;
          const timeStr = timeAgo < 1000 ? `${timeAgo}ms` : `${(timeAgo / 1000).toFixed(1)}s`;
          const countStr = group.count > 1 ? ` (${group.count})` : '';
          return `${index + 1}. ${group.eventType}${countStr} (${timeStr})`;
        })
        .join('\n');

      // Получаем данные последнего события
      const lastEvent = reversedEvents[0];
      let lastEventData = '';
      if (lastEvent && lastEvent.payload !== undefined) {
        try {
          const payloadStr = JSON.stringify(lastEvent.payload, null, 2);
          // Ограничиваем длину данных для читаемости
          const maxLength = 200;
          const truncatedPayload =
            payloadStr.length > maxLength
              ? payloadStr.substring(0, maxLength) + '...'
              : payloadStr;
          lastEventData = `\n\nLast event data:\n${truncatedPayload}`;
        } catch {
          lastEventData = `\n\nLast event data:\n(cannot serialize)`;
        }
      }

      this.eventsText.setText(
        `Events (${filteredEvents.length} total):\n${eventsList}${lastEventData}`,
      );
    }

    // Обновляем позиции элементов после изменения текста
    this.layoutElements();
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.updateVisibility();
  }

  private updateVisibility(): void {
    const { width, height } = this.scene.scale;
    this.background.setVisible(this.isVisible);
    this.contentContainer.setVisible(this.isVisible);

    // Позиционируем кнопку в зависимости от состояния
    if (this.isVisible) {
      // Когда сайдбар открыт - кнопка слева от сайдбара
      const sidebarX = width - this.SIDEBAR_WIDTH;
      const toggleX = sidebarX - this.TOGGLE_BUTTON_WIDTH / 2;
      this.toggleButton.setPosition(toggleX, height / 2);
      this.toggleButtonText.setPosition(toggleX, height / 2);
      this.toggleButtonText.setText('◀');
    } else {
      // Когда сайдбар закрыт - кнопка справа экрана
      const toggleX = width - this.TOGGLE_BUTTON_WIDTH / 2;
      this.toggleButton.setPosition(toggleX, height / 2);
      this.toggleButtonText.setPosition(toggleX, height / 2);
      this.toggleButtonText.setText('▶');
    }
  }

  /**
   * Обновление позиций при изменении размера экрана.
   */
  resize(): void {
    const { width, height } = this.scene.scale;
    const sidebarX = width - this.SIDEBAR_WIDTH;

    // Обновляем позицию фона сайдбара
    this.background.setPosition(sidebarX + this.SIDEBAR_WIDTH / 2, height / 2);
    this.background.setSize(this.SIDEBAR_WIDTH, height);

    // Обновляем позицию контента
    this.contentContainer.setPosition(sidebarX + this.PADDING, this.PADDING);

    // Обновляем позицию кнопки в зависимости от состояния
    this.updateVisibility();
  }

  destroy(): void {
    super.destroy();
  }
}
