/**
 * Компонент вкладок (tabs).
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIBaseComponent } from '../core/ui_base_component';
import { UIComponentConfig } from '../core/types';
import { createTextStyle } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Вкладка
 */
export interface UITab {
  id: string;
  label: string;
  content: Phaser.GameObjects.GameObject;
}

/**
 * Конфигурация tabs
 */
export interface UITabsConfig extends UIComponentConfig {
  tabs: UITab[];
  activeTabId?: string;
  tabHeight?: number;
  onTabChange?: (tabId: string) => void;
}

/**
 * Компонент вкладок
 */
export class UITabs extends UIBaseComponent {
  private tabsConfig: UITabsConfig;
  private tabs: UITab[];
  private activeTabId: string;
  private tabHeight: number;

  private tabsContainer!: Phaser.GameObjects.Container;
  protected contentContainer!: Phaser.GameObjects.Container;
  private tabButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private tabIndicator!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, core: GameCore, config: UITabsConfig) {
    super(scene, core, config);
    this.tabsConfig = config;
    this.tabs = config.tabs;
    this.activeTabId = config.activeTabId ?? (config.tabs[0]?.id || '');
    this.tabHeight = config.tabHeight ?? 40;
  }

  /**
   * Создание tabs
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;

    const depth = this.config.depth ?? UIComponent.DEPTH.UI_BASE;
    super.createContainer(x, y, depth);

    // Создаем контейнер для табов (заголовки)
    this.tabsContainer = this.scene.add.container(0, 0);

    // Создаем контейнер для контента
    this.contentContainer = this.scene.add.container(0, 0);

    this.container.add([this.tabsContainer, this.contentContainer]);

    // Создаем табы
    this.createTabs();

    // Создаем контент
    this.createContent();

    // Показываем активную вкладку
    this.showTab(this.activeTabId);

    // Финализируем создание (вызывает onMount)
    this.finalizeCreation();
  }

  /**
   * Создание табов (заголовков)
   */
  private createTabs(): void {
    const tabWidth = (this.style.width ?? 400) / this.tabs.length;
    const startX = -(this.style.width ?? 400) / 2;

    // Создаем фон для табов
    const tabsBackground = this.scene.add.rectangle(
      0,
      -this.tabHeight / 2,
      this.style.width ?? 400,
      this.tabHeight,
      UITheme.colors.background.secondary,
      1,
    );
    this.tabsContainer.add(tabsBackground);

    // Создаем индикатор активной вкладки
    this.tabIndicator = this.scene.add.rectangle(
      startX + tabWidth / 2,
      0,
      tabWidth,
      3,
      UITheme.colors.accent.primary,
      1,
    );
    this.tabIndicator.setOrigin(0.5, 1);
    this.tabsContainer.add(this.tabIndicator);

    // Создаем кнопки табов
    this.tabs.forEach((tab, index) => {
      const tabX = startX + index * tabWidth + tabWidth / 2;
      const tabButton = this.createTabButton(tab, tabX, -this.tabHeight / 2, tabWidth);
      this.tabButtons.set(tab.id, tabButton);
      this.tabsContainer.add(tabButton);
    });

    // Позиционируем контейнер табов
    this.tabsContainer.y = -(this.style.height ?? 300) / 2 + this.tabHeight / 2;
  }

  /**
   * Создание кнопки таба
   */
  private createTabButton(
    tab: UITab,
    x: number,
    y: number,
    width: number,
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Фон кнопки (для интерактивности)
    const bg = this.scene.add.rectangle(0, 0, width, this.tabHeight, 0x000000, 0);
    bg.setInteractive({ useHandCursor: true });

    // Текст таба
    const text = this.scene.add.text(0, 0, tab.label, createTextStyle('normal'));
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Обработчики событий
    bg.on('pointerover', () => {
      if (this.activeTabId !== tab.id) {
        bg.setFillStyle(UITheme.colors.background.tertiary, 0.5);
      }
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0);
    });

    bg.on('pointerdown', () => {
      this.selectTab(tab.id);
    });

    return container;
  }

  /**
   * Создание контента
   */
  private createContent(): void {
    // Позиционируем контейнер контента
    this.contentContainer.y = this.tabHeight / 2;

    // Добавляем все контенты (скрываем неактивные)
    this.tabs.forEach((tab) => {
      if ('setVisible' in tab.content && typeof tab.content.setVisible === 'function') {
        (
          tab.content as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(tab.id === this.activeTabId);
      }
      this.contentContainer.add(tab.content);
    });
  }

  /**
   * Выбор таба
   */
  selectTab(tabId: string): void {
    if (this.activeTabId === tabId) return;

    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    this.activeTabId = tabId;

    // Показываем выбранную вкладку
    this.showTab(tabId);

    // Анимируем перемещение индикатора
    const tabIndex = this.tabs.findIndex((t) => t.id === tabId);
    const tabWidth = (this.style.width ?? 400) / this.tabs.length;
    const startX = -(this.style.width ?? 400) / 2;
    const targetX = startX + tabIndex * tabWidth + tabWidth / 2;

    this.scene.tweens.add({
      targets: this.tabIndicator,
      x: targetX,
      duration: UITheme.animations.duration.fast,
      ease: UITheme.animations.easing.easeOut,
    });

    // Вызываем callback
    this.tabsConfig.onTabChange?.(tabId);
  }

  /**
   * Показ таба
   */
  private showTab(tabId: string): void {
    // Скрываем все контенты
    this.tabs.forEach((tab) => {
      if ('setVisible' in tab.content && typeof tab.content.setVisible === 'function') {
        (
          tab.content as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(false);
      }
      if ('setAlpha' in tab.content && typeof tab.content.setAlpha === 'function') {
        (
          tab.content as Phaser.GameObjects.GameObject & {
            setAlpha: (alpha: number) => void;
          }
        ).setAlpha(0);
      }
    });

    // Показываем активный контент с анимацией
    const activeTab = this.tabs.find((t) => t.id === tabId);
    if (activeTab) {
      if ('setVisible' in activeTab.content && typeof activeTab.content.setVisible === 'function') {
        (
          activeTab.content as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(true);
      }
      this.animator.animateIn(activeTab.content, {
        type: 'fade',
        duration: UITheme.animations.duration.fast,
      });
    }
  }

  /**
   * Получение активной вкладки
   */
  getActiveTabId(): string {
    return this.activeTabId;
  }

  /**
   * Добавление новой вкладки
   */
  addTab(tab: UITab): void {
    this.tabs.push(tab);
    if ('setVisible' in tab.content && typeof tab.content.setVisible === 'function') {
      (
        tab.content as Phaser.GameObjects.GameObject & {
          setVisible: (visible: boolean) => void;
        }
      ).setVisible(false);
    }
    this.contentContainer.add(tab.content);

    // Пересоздаем табы
    this.tabButtons.forEach((button) => button.destroy());
    this.tabButtons.clear();
    this.tabsContainer.removeAll(true);
    this.createTabs();
  }

  /**
   * Удаление вкладки
   */
  removeTab(tabId: string): void {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];
    tab.content.destroy();
    this.tabs.splice(index, 1);

    // Если удалили активную вкладку, выбираем первую
    if (this.activeTabId === tabId && this.tabs.length > 0) {
      this.selectTab(this.tabs[0].id);
    }

    // Пересоздаем табы
    this.tabButtons.forEach((button) => button.destroy());
    this.tabButtons.clear();
    this.tabsContainer.removeAll(true);
    this.createTabs();
  }
}
