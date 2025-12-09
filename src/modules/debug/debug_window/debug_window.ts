import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';
import { TabName, TabButton } from './types';
import { DEBUG_WINDOW_CONSTANTS } from './constants';
import {
  renderCommonTab,
  renderECSTab,
  renderModulesTab,
  renderToolsTab,
  renderEventsTab,
} from './tab_content_renderer';

/**
 * Боковой сайдбар отладки с информацией о тиках, модулях и событиях
 * Теги: arch:ui, debug:info, tech:phaser
 */
export class DebugWindow extends UIComponent {
  private background!: Phaser.GameObjects.Rectangle;
  private toggleButton!: Phaser.GameObjects.Rectangle;
  private toggleButtonText!: Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabsContainer!: Phaser.GameObjects.Container;
  private tickText!: Phaser.GameObjects.Text;
  private ecsText!: Phaser.GameObjects.Text;
  private toolText!: Phaser.GameObjects.Text;
  private toolsText!: Phaser.GameObjects.Text;
  private modulesText!: Phaser.GameObjects.Text;
  private eventsText!: Phaser.GameObjects.Text;
  private isVisible: boolean = true;
  private activeTab: TabName = 'common';
  private tabs: TabButton[] = [];
  private hoveredTile: { x: number; y: number; type?: number; typeName?: string } | null = null;
  private lastUpdateTime: number = 0;

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    const { width, height } = this.scene.scale;
    const { SIDEBAR_WIDTH, PADDING, TAB_HEIGHT, TAB_SPACING, COLORS } = DEBUG_WINDOW_CONSTANTS;

    // Создаём контейнер с depth для панелей
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);
    this.container.setVisible(this.isVisible);

    // Фон сайдбара
    const sidebarX = width - SIDEBAR_WIDTH;
    this.background = this.scene.add.rectangle(
      sidebarX + SIDEBAR_WIDTH / 2,
      height / 2,
      SIDEBAR_WIDTH,
      height,
      COLORS.BACKGROUND,
      0.95,
    );
    this.background.setStrokeStyle(2, COLORS.ACCENT, 1);
    this.container.add(this.background);

    // Контейнер для вкладок
    this.tabsContainer = this.scene.add.container(sidebarX + PADDING, PADDING);
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
    this.createTabs();

    // Контейнер для контента
    const contentY = PADDING + 25 + TAB_HEIGHT + TAB_SPACING;
    this.contentContainer = this.scene.add.container(sidebarX + PADDING, contentY);
    this.container.add(this.contentContainer);

    this.createContentTextElements();
    this.createToggleButton();
    this.setupEventSubscriptions();

    // Первоначальное позиционирование и обновление
    this.updateVisibility();
    this.lastUpdateTime = Date.now();
    this.updateInfo();
  }

  /**
   * Создает текстовые элементы для контента
   */
  private createContentTextElements(): void {
    const { FONT_SIZE, SIDEBAR_WIDTH, PADDING, COLORS } = DEBUG_WINDOW_CONSTANTS;

    // Текст тиков
    this.tickText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.tickText);

    // Текст ECS
    this.ecsText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_ECS,
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.ecsText);

    // Текст активного инструмента
    this.toolText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_TOOL,
        fontFamily: 'Arial',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.toolText);

    // Текст инструментов
    this.toolsText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_TOOL,
        fontFamily: 'Arial',
        wordWrap: { width: SIDEBAR_WIDTH - PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.toolsText);

    // Текст модулей
    this.modulesText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_PRIMARY,
        fontFamily: 'Arial',
        wordWrap: { width: SIDEBAR_WIDTH - PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.modulesText);

    // Текст событий
    this.eventsText = this.scene.add
      .text(0, 0, '', {
        fontSize: FONT_SIZE,
        color: COLORS.TEXT_EVENTS,
        fontFamily: 'Arial',
        wordWrap: { width: SIDEBAR_WIDTH - PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.contentContainer.add(this.eventsText);
  }

  /**
   * Создает кнопку переключения видимости
   */
  private createToggleButton(): void {
    const { height } = this.scene.scale;
    const { TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, COLORS } = DEBUG_WINDOW_CONSTANTS;

    this.toggleButton = this.scene.add.rectangle(
      0,
      height / 2,
      TOGGLE_BUTTON_WIDTH,
      TOGGLE_BUTTON_HEIGHT,
      0x2a2a2a,
      0.9,
    );
    this.toggleButton.setStrokeStyle(2, COLORS.ACCENT, 1);
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
  }

  /**
   * Настраивает подписки на события
   */
  private setupEventSubscriptions(): void {
    // Подписка на клавишу для переключения (F3)
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });

    // Подписка на события тайлов
    const eventBus = this.core.getEventBus();
    eventBus.on(
      Events.TileHovered,
      (data?: { tileX: number; tileY: number; tileType?: number; tileTypeName?: string }) => {
        if (data) {
          this.hoveredTile = {
            x: data.tileX,
            y: data.tileY,
            type: data.tileType,
            typeName: data.tileTypeName,
          };
        }
      },
    );
    eventBus.on(Events.TileUnhovered, () => {
      this.hoveredTile = null;
    });
  }

  /**
   * Создает кнопки вкладок
   */
  private createTabs(): void {
    const { width } = this.scene.scale;
    const { SIDEBAR_WIDTH, PADDING, TAB_HEIGHT, TAB_SPACING, COLORS } = DEBUG_WINDOW_CONSTANTS;
    const sidebarX = width - SIDEBAR_WIDTH;

    const tabNames: { name: TabName; label: string }[] = [
      { name: 'common', label: 'Common' },
      { name: 'ecs', label: 'ECS' },
      { name: 'modules', label: 'Modules' },
      { name: 'tools', label: 'Tools' },
      { name: 'events', label: 'Events' },
    ];

    const tabCount = tabNames.length;
    const tabWidth = (SIDEBAR_WIDTH - PADDING * 2 - TAB_SPACING * (tabCount - 1)) / tabCount;
    const startY = 25; // После заголовка

    tabNames.forEach((tab, index) => {
      const x = index * (tabWidth + TAB_SPACING);
      const isActive = tab.name === this.activeTab;

      const background = this.scene.add.rectangle(
        x + tabWidth / 2,
        startY + TAB_HEIGHT / 2,
        tabWidth,
        TAB_HEIGHT,
        isActive ? COLORS.ACCENT : COLORS.TAB_INACTIVE,
        1,
      );
      background.setStrokeStyle(1, COLORS.ACCENT, isActive ? 1 : 0.5);
      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', () => this.switchTab(tab.name));

      const text = this.scene.add
        .text(x + tabWidth / 2, startY + TAB_HEIGHT / 2, tab.label, {
          fontSize: '10px',
          color: isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
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

    const { COLORS } = DEBUG_WINDOW_CONSTANTS;

    // Обновляем визуальное состояние вкладок
    this.tabs.forEach((tab) => {
      const isActive = tab.name === this.activeTab;
      tab.background.setFillStyle(isActive ? COLORS.ACCENT : COLORS.TAB_INACTIVE);
      tab.background.setStrokeStyle(1, COLORS.ACCENT, isActive ? 1 : 0.5);
      tab.text.setColor(isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY);
    });

    // Обновляем контент
    this.updateInfo();
  }

  update(): void {
    if (!this.isVisible) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;

    if (timeSinceLastUpdate >= DEBUG_WINDOW_CONSTANTS.UPDATE_INTERVAL) {
      this.updateInfo();
      this.lastUpdateTime = currentTime;
    }
  }

  private updateInfo(): void {
    // Скрываем все тексты
    this.tickText.setVisible(false);
    this.ecsText.setVisible(false);
    this.toolText.setVisible(false);
    this.toolsText.setVisible(false);
    this.modulesText.setVisible(false);
    this.eventsText.setVisible(false);

    // Показываем и обновляем только контент активной вкладки
    switch (this.activeTab) {
      case 'common':
        renderCommonTab(this.core, this.tickText, this.toolText, this.hoveredTile);
        break;

      case 'ecs':
        renderECSTab(this.core, this.ecsText);
        break;

      case 'modules':
        renderModulesTab(this.core, this.modulesText);
        break;

      case 'tools':
        renderToolsTab(this.core, this.toolsText);
        break;

      case 'events':
        renderEventsTab(this.core, this.eventsText);
        break;
    }
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.updateVisibility();
  }

  private updateVisibility(): void {
    const { width, height } = this.scene.scale;
    const { SIDEBAR_WIDTH, TOGGLE_BUTTON_WIDTH } = DEBUG_WINDOW_CONSTANTS;

    this.background.setVisible(this.isVisible);
    this.tabsContainer.setVisible(this.isVisible);
    this.contentContainer.setVisible(this.isVisible);

    // Позиционируем кнопку в зависимости от состояния
    if (this.isVisible) {
      // Когда сайдбар открыт - кнопка слева от сайдбара
      const sidebarX = width - SIDEBAR_WIDTH;
      const toggleX = sidebarX - TOGGLE_BUTTON_WIDTH / 2;
      this.toggleButton.setPosition(toggleX, height / 2);
      this.toggleButtonText.setPosition(toggleX, height / 2);
      this.toggleButtonText.setText('◀');
    } else {
      // Когда сайдбар закрыт - кнопка справа экрана
      const toggleX = width - TOGGLE_BUTTON_WIDTH / 2;
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
    const { SIDEBAR_WIDTH, PADDING, TAB_HEIGHT, TAB_SPACING } = DEBUG_WINDOW_CONSTANTS;
    const sidebarX = width - SIDEBAR_WIDTH;

    // Обновляем позицию фона сайдбара
    this.background.setPosition(sidebarX + SIDEBAR_WIDTH / 2, height / 2);
    this.background.setSize(SIDEBAR_WIDTH, height);

    // Обновляем позицию вкладок
    this.tabsContainer.setPosition(sidebarX + PADDING, PADDING);

    // Обновляем позицию контента
    const contentY = PADDING + 25 + TAB_HEIGHT + TAB_SPACING;
    this.contentContainer.setPosition(sidebarX + PADDING, contentY);

    // Обновляем позицию кнопки в зависимости от состояния
    this.updateVisibility();
  }

  destroy(): void {
    super.destroy();
  }
}
