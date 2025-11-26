import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';

/**
 * Боковой сайдбар отладки с информацией о тиках, модулях и событиях
 * Теги: arch:ui, debug:info, tech:phaser
 */
type TabName = 'common' | 'ecs' | 'modules' | 'events';

interface TabButton {
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  name: TabName;
}

export class DebugWindow extends UIComponent {
  private background!: Phaser.GameObjects.Rectangle;
  private toggleButton!: Phaser.GameObjects.Rectangle;
  private toggleButtonText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabsContainer!: Phaser.GameObjects.Container;
  private tickText!: Phaser.GameObjects.Text;
  private ecsText!: Phaser.GameObjects.Text;
  private toolText!: Phaser.GameObjects.Text;
  private modulesText!: Phaser.GameObjects.Text;
  private eventsText!: Phaser.GameObjects.Text;
  private isVisible: boolean = true;
  private activeTab: TabName = 'common';
  private tabs: TabButton[] = [];
  private hoveredTile: { x: number; y: number } | null = null;

  // Константы
  private readonly SIDEBAR_WIDTH = 280;
  private readonly TOGGLE_BUTTON_WIDTH = 30;
  private readonly TOGGLE_BUTTON_HEIGHT = 60;
  private readonly PADDING = 12;
  private readonly FONT_SIZE = '11px';
  private readonly UPDATE_INTERVAL = 100; // обновление каждые 100ms реального времени
  private readonly SECTION_SPACING = 10; // отступ между секциями
  private readonly TAB_HEIGHT = 32;
  private readonly TAB_SPACING = 4;

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

    // Контейнер для вкладок
    this.tabsContainer = this.scene.add.container(sidebarX + this.PADDING, this.PADDING);
    this.container.add(this.tabsContainer);

    // Заголовок
    const titleText = this.scene.add
      .text(0, 0, '🐛 Debug', {
        fontSize: '14px',
        color: '#4a90e2',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0);
    this.tabsContainer.add(titleText);

    // Создаем вкладки
    this.createTabs(sidebarX);

    // Контейнер для контента
    const contentY = this.PADDING + 25 + this.TAB_HEIGHT + this.TAB_SPACING;
    this.contentContainer = this.scene.add.container(sidebarX + this.PADDING, contentY);
    this.container.add(this.contentContainer);

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

    // Текст ECS - позиция будет обновляться динамически
    this.ecsText = this.scene.add
      .text(0, 0, '', {
        fontSize: this.FONT_SIZE,
        color: '#ffcc66',
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.ecsText);

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

    // Подписка на события тайлов
    const eventBus = this.core.getEventBus();
    eventBus.on(Events.TileHovered, (data?: { tileX: number; tileY: number }) => {
      if (data) {
        this.hoveredTile = { x: data.tileX, y: data.tileY };
      }
    });
    eventBus.on(Events.TileUnhovered, () => {
      this.hoveredTile = null;
    });

    // Первоначальное позиционирование и обновление
    this.updateVisibility();
    this.lastUpdateTime = Date.now();
    this.updateInfo();
  }

  /**
   * Создает кнопки вкладок
   */
  private createTabs(sidebarX: number): void {
    const tabNames: { name: TabName; label: string }[] = [
      { name: 'common', label: 'Common' },
      { name: 'ecs', label: 'ECS' },
      { name: 'modules', label: 'Modules' },
      { name: 'events', label: 'Events' },
    ];

    const tabWidth = (this.SIDEBAR_WIDTH - this.PADDING * 2 - this.TAB_SPACING * 3) / 4;
    const startY = 25; // После заголовка

    tabNames.forEach((tab, index) => {
      const x = index * (tabWidth + this.TAB_SPACING);
      const isActive = tab.name === this.activeTab;

      const background = this.scene.add.rectangle(
        x + tabWidth / 2,
        startY + this.TAB_HEIGHT / 2,
        tabWidth,
        this.TAB_HEIGHT,
        isActive ? 0x4a90e2 : 0x2a2a2a,
        1,
      );
      background.setStrokeStyle(1, 0x4a90e2, isActive ? 1 : 0.5);
      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', () => this.switchTab(tab.name));

      const text = this.scene.add
        .text(x + tabWidth / 2, startY + this.TAB_HEIGHT / 2, tab.label, {
          fontSize: '10px',
          color: isActive ? '#ffffff' : '#999999',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);

      this.tabsContainer.add(background);
      this.tabsContainer.add(text);

      this.tabs.push({ background, text, name: tab.name });
    });
  }

  /**
   * Переключение между вкладками
   */
  private switchTab(tabName: TabName): void {
    if (this.activeTab === tabName) {
      return;
    }

    this.activeTab = tabName;

    // Обновляем визуальное состояние вкладок
    this.tabs.forEach((tab) => {
      const isActive = tab.name === this.activeTab;
      tab.background.setFillStyle(isActive ? 0x4a90e2 : 0x2a2a2a);
      tab.background.setStrokeStyle(1, 0x4a90e2, isActive ? 1 : 0.5);
      tab.text.setColor(isActive ? '#ffffff' : '#999999');
    });

    // Обновляем контент
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

  private updateInfo(): void {
    const tickManager = this.core.getTickManager();
    const eventBus = this.core.getEventBus();
    const moduleManager = this.core.getModuleManager();
    const ecs = this.core.getECSManager();

    // Скрываем все тексты
    this.tickText.setVisible(false);
    this.ecsText.setVisible(false);
    this.toolText.setVisible(false);
    this.modulesText.setVisible(false);
    this.eventsText.setVisible(false);

    // Показываем и обновляем только контент активной вкладки
    switch (this.activeTab) {
      case 'common': {
        // Информация о тиках
        const currentTick = tickManager.getCurrentTick();
        const tickRate = tickManager.getTickRate();
        const effectiveTickRate = tickManager.getEffectiveTickRate();
        const ticksPerSecond = tickManager.getTicksPerSecond();
        const speed = tickManager.getSpeed();
        const isPaused = !tickManager.isActive();
        const avgEventsPerTick = eventBus.getAverageEventsPerTick();

        // Информация о выделенном тайле
        const tileInfo = this.hoveredTile
          ? `Tile: (${this.hoveredTile.x}, ${this.hoveredTile.y})`
          : 'Tile: None';

        this.tickText.setVisible(true);
        this.tickText.setY(0);
        this.tickText.setText(
          `Tick: ${currentTick}\nRate: ${tickRate}/s\nEffective: ${effectiveTickRate.toFixed(1)}/s\nActual: ${ticksPerSecond}/s\nSpeed: ${isPaused ? '⏸' : `${speed}x`}\nAvg events: ${avgEventsPerTick}/tick\n\n${tileInfo}`,
        );

        // Информация об активном инструменте
        try {
          const toolManager = this.core.getToolManager();
          const activeTool = toolManager.getActiveTool();
          if (activeTool.toolId) {
            const tool = toolManager.getTool(activeTool.toolId);
            if (tool) {
              this.toolText.setVisible(true);
              this.toolText.setY(this.getTextHeight(this.tickText) + this.SECTION_SPACING);
              this.toolText.setText(
                `Tool: ${tool.icon} ${tool.name}\nType: ${tool.type}\nCategory: ${tool.categoryId}`,
              );
            } else {
              this.toolText.setVisible(true);
              this.toolText.setY(this.getTextHeight(this.tickText) + this.SECTION_SPACING);
              this.toolText.setText('Tool: Unknown');
            }
          } else {
            this.toolText.setVisible(true);
            this.toolText.setY(this.getTextHeight(this.tickText) + this.SECTION_SPACING);
            this.toolText.setText('Tool: None');
          }
        } catch {
          // ToolManager может быть не инициализирован
          this.toolText.setVisible(true);
          this.toolText.setY(this.getTextHeight(this.tickText) + this.SECTION_SPACING);
          this.toolText.setText('Tool: N/A');
        }
        break;
      }

      case 'ecs': {
        // Информация о ECS
        const entitiesCount = ecs.getAllEntities().length;
        const systemsCount = ecs.getAllSystems().length;
        const eventsPerTick = eventBus.getEventsPerTick();

        this.ecsText.setVisible(true);
        this.ecsText.setY(0);
        this.ecsText.setText(
          `Entities: ${entitiesCount}\nSystems: ${systemsCount}\n\nEvents/tick: ${eventsPerTick}`,
        );
        break;
      }

      case 'modules': {
        // Информация о модулях
        const modules = moduleManager.getAllModules();
        this.modulesText.setVisible(true);
        this.modulesText.setY(0);

        if (modules.length === 0) {
          this.modulesText.setText('(no modules)');
        } else {
          const modulesList = modules.map((module) => `• ${module.id}`).join('\n');
          this.modulesText.setText(`Total: ${modules.length}\n\n${modulesList}`);
        }
        break;
      }

      case 'events': {
        // Информация о последних событиях (исключая события тиков)
        const eventHistory = eventBus.getEventHistory();
        const filteredEvents = eventHistory.filter(
          (entry) => !this.EXCLUDED_EVENTS.has(entry.eventType),
        );

        this.eventsText.setVisible(true);
        this.eventsText.setY(0);

        if (filteredEvents.length === 0) {
          this.eventsText.setText('(no events yet)');
        } else {
          const eventsList = filteredEvents
            .slice()
            .reverse() // Показываем последние сверху
            .slice(0, 15) // Показываем максимум 15 событий
            .map((entry, index) => {
              const timeAgo = Date.now() - entry.timestamp;
              const timeStr = timeAgo < 1000 ? `${timeAgo}ms` : `${(timeAgo / 1000).toFixed(1)}s`;
              return `${index + 1}. ${entry.eventType}\n   ${timeStr} ago`;
            })
            .join('\n');
          this.eventsText.setText(`Last ${filteredEvents.length} events:\n\n${eventsList}`);
        }
        break;
      }
    }
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.updateVisibility();
  }

  private updateVisibility(): void {
    const { width, height } = this.scene.scale;
    this.background.setVisible(this.isVisible);
    this.tabsContainer.setVisible(this.isVisible);
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

    // Обновляем позицию вкладок
    this.tabsContainer.setPosition(sidebarX + this.PADDING, this.PADDING);

    // Обновляем позицию контента
    const contentY = this.PADDING + 25 + this.TAB_HEIGHT + this.TAB_SPACING;
    this.contentContainer.setPosition(sidebarX + this.PADDING, contentY);

    // Обновляем позицию кнопки в зависимости от состояния
    this.updateVisibility();
  }

  destroy(): void {
    super.destroy();
  }
}
