import { ButtonUI } from '@/ui/button.ui';
import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';

type panelCategories = 'tick' | 'events' | 'tools' | 'map';

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isOpen: boolean = false;
  private currentTab: panelCategories = 'events';

  // UI элементы
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('DebugModule: init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.container = scene.add.container();
    this.container.setDepth(2000);

    this.createPanel();

    const panel = this.createPanel();
    const tabs = this.createTabs(panel);
    panel.add(tabs);
    this.container.add(panel);
  }

  private openDebugPanel(): void {
    this.isOpen = !this.isOpen;
  }

  private changeTab(tabName: panelCategories): void {
    this.currentTab = tabName;
    console.log(this.currentTab);
  }

  private createPanel(): Phaser.GameObjects.Container {
    const margin = { left: 0, right: 10, top: 10, bottom: 10 };
    const height = this.scene.cameras.main.height - (margin.top + margin.bottom);
    const width = 335 - (margin.right + margin.left);
    const x = this.scene.cameras.main.width - width - margin.right;
    const y = margin.top;

    // Контейнер бара
    const panelContainer = this.scene.add.container(x, y);
    panelContainer.setDepth(2000);

    // Фон бара
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 16);
    // // bg.lineStyle(2, 0x222222, 1);
    bg.strokeRoundedRect(0, 0, width, height, 16);

    // Добавляем фон в контейнер панели
    panelContainer.add(bg);

    return panelContainer;
  }

  private createTabs(parentContainer: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
    const x = parentContainer.originX;
    const y = parentContainer.originY;

    // Контейнер табов
    const tabsContainer = this.scene.add.container(x, y);
    tabsContainer.setDepth(parentContainer.depth + 101);

    // Кнопка выбора коммерческой зоны
    const tickBtn = new ButtonUI(this.scene, {
      xPos: 10,
      yPos: 10,
      w: 70,
      h: 30,
      text: 'tick',
      depth: tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('tick');
      },
    });

    // Кнопка выбора коммерческой зоны
    const eventsBtn = new ButtonUI(this.scene, {
      xPos: 10 + tickBtn.width + 10,
      yPos: 10,
      w: 85,
      h: 30,
      text: 'events',
      depth: tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('events');
      },
    });

    // Кнопка выбора коммерческой зоны
    const toolsBtn = new ButtonUI(this.scene, {
      xPos: 10 + eventsBtn.xPosition + eventsBtn.width,
      yPos: 10,
      w: 80,
      h: 30,
      text: 'tools',
      depth: tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('tools');
      },
    });

    // Кнопка выбора коммерческой зоны
    const mapBtn = new ButtonUI(this.scene, {
      xPos: 10 + toolsBtn.xPosition + toolsBtn.width,
      yPos: 10,
      w: 80,
      h: 30,
      text: 'map',
      depth: tabsContainer.depth + 1,
      onClick: (): void => {
        this.changeTab('map');
      },
    });

    tabsContainer.add(tickBtn.container);
    tabsContainer.add(eventsBtn.container);
    tabsContainer.add(toolsBtn.container);
    tabsContainer.add(mapBtn.container);

    return tabsContainer;
  }
}
