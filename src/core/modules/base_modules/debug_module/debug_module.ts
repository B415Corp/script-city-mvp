import { ButtonUI } from '@/ui/button.ui';
import { BaseModule } from '../../extends';
import { EventBus } from '@/core/event_bus/event_bus';

type panelCategories = 'tick' | 'events' | 'tools' | 'map';

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isOpen: boolean = false;
  private currentTab: panelCategories = 'events';

  // UI элементы
  private container!: Phaser.GameObjects.Container;
  private panelContainer!: Phaser.GameObjects.Container;
  private tabsContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private btns: Array<{ name: panelCategories; component: ButtonUI }> = [];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('DebugModule: init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.createPanel();
  }

  private openDebugPanel(): void {
    this.isOpen = !this.isOpen;
  }

  private changeTab(tabName: panelCategories): void {
    this.currentTab = tabName;
    this.updateContentContainer();
    console.log('Current tab:', this.currentTab);
  }

  private createPanel(): void {
    const margin = { left: 0, right: 10, top: 10, bottom: 10 };
    const height = this.scene.cameras.main.height / 1.2 - (margin.top + margin.bottom);
    const width = 335 - (margin.right + margin.left);
    const x = this.scene.cameras.main.width - width - margin.right;
    const y = margin.top;

    // Основной контейнер панели
    this.panelContainer = this.scene.add.container(x, y);
    this.panelContainer.setDepth(2000);

    // Фон панели
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 16);
    bg.strokeRoundedRect(0, 0, width, height, 16);
    this.panelContainer.add(bg);

    // Создаем табы
    this.createTabs();

    // Создаем контейнер для контента
    this.createContentContainer();
  }

  private createTabs(): void {
    // Контейнер табов
    this.tabsContainer = this.scene.add.container(0, 10);
    this.tabsContainer.setDepth(this.panelContainer.depth + 100);
    this.panelContainer.add(this.tabsContainer);

    // Кнопка tick
    const tickBtn = new ButtonUI(this.scene, {
      xPos: 10,
      yPos: 0,
      w: 70,
      h: 30,
      text: 'tick',
      depth: this.tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('tick');
        this.toggleBtns('tick');
      },
    });

    // Кнопка events
    const eventsBtn = new ButtonUI(this.scene, {
      xPos: 10 + tickBtn.width + 10,
      yPos: 0,
      w: 85,
      h: 30,
      text: 'events',
      depth: this.tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('events');
        this.toggleBtns('events');
      },
    });

    // Кнопка tools
    const toolsBtn = new ButtonUI(this.scene, {
      xPos: 10 + eventsBtn.xPosition! + eventsBtn.width,
      yPos: 0,
      w: 80,
      h: 30,
      text: 'tools',
      depth: this.tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('tools');
        this.toggleBtns('tools');
      },
    });

    // Кнопка map
    const mapBtn = new ButtonUI(this.scene, {
      xPos: 10 + toolsBtn.xPosition! + toolsBtn.width,
      yPos: 0,
      w: 80,
      h: 30,
      text: 'map',
      depth: this.tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('map');
        this.toggleBtns('map');
      },
    });

    // Сохраняем кнопки в массив
    this.btns = [
      { name: 'tick', component: tickBtn },
      { name: 'events', component: eventsBtn },
      { name: 'tools', component: toolsBtn },
      { name: 'map', component: mapBtn },
    ];

    // Добавляем кнопки в контейнер табов и устанавливаем активную
    this.btns.forEach((btn) => {
      this.tabsContainer.add(btn.component.container);
      if (btn.name === this.currentTab) {
        btn.component.setActiveTab(true);
      }
    });
  }

  private createContentContainer(): void {
    // Контейнер для контента под табами
    this.contentContainer = this.scene.add.container(10, 50);
    this.contentContainer.setDepth(this.panelContainer.depth + 50);
    this.panelContainer.add(this.contentContainer);

    // Изначально показываем контент для текущей вкладки
    this.updateContentContainer();
  }

  private updateContentContainer(): void {
    // Очищаем предыдущий контент
    this.contentContainer.removeAll(true);

    // Создаем контент в зависимости от текущей вкладки
    const contentWidth = 305;
    const contentHeight = 400;

    // Фон контейнера контента
    const contentBg = this.scene.add.graphics();
    contentBg.fillStyle(0x333333, 0.9);
    contentBg.fillRoundedRect(0, 0, contentWidth, contentHeight, 12);
    contentBg.strokeRoundedRect(0, 0, contentWidth, contentHeight, 12);
    this.contentContainer.add(contentBg);

    // Текст заголовка категории
    const titleText = this.scene.add
      .text(15, 15, this.currentTab.toUpperCase(), {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.contentContainer.add(titleText);

    // Контент для каждой вкладки
    switch (this.currentTab) {
      case 'tick':
        this.createTickContent();
        break;
      case 'events':
        this.createEventsContent();
        break;
      case 'tools':
        this.createToolsContent();
        break;
      case 'map':
        this.createMapContent();
        break;
    }
  }

  private createTickContent(): void {
    const yOffset = 50;
    this.scene.add
      .text(15, yOffset, 'Tick Debug Info:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#cccccc',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 25, '• Current tick: 0', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );

    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 45, '• Delta time: 16ms', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );
  }

  private createEventsContent(): void {
    const yOffset = 50;
    this.scene.add
      .text(15, yOffset, 'Events Log:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#cccccc',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 25, '• No events yet', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );
  }

  private createToolsContent(): void {
    const yOffset = 50;
    this.scene.add
      .text(15, yOffset, 'Available Tools:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#cccccc',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 25, '• Performance Monitor', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );

    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 45, '• Memory Usage', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );
  }

  private createMapContent(): void {
    const yOffset = 50;
    this.scene.add
      .text(15, yOffset, 'Map Debug:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#cccccc',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 25, '• Tiles loaded: 0', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );

    this.contentContainer.add(
      this.scene.add
        .text(15, yOffset + 45, '• Camera pos: (0,0)', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );
  }

  private toggleBtns(buttonName: panelCategories): void {
    this.btns.forEach((btn) => {
      btn.component.setActiveTab(btn.name === buttonName);
    });
  }
}
