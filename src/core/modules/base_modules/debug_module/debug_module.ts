import { ButtonUI } from '@/ui/button.ui';
import { BaseModule } from '../../extends';
import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './components/debug_component';
import { EventsDebug } from './components/events_debug';

// названия базовых модулей с их классами
const debugComponentsRegister = {
  events: EventsDebug,
} as const;

type ComponentsRegister = keyof typeof debugComponentsRegister;

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isOpen: boolean = false;
  private currentTab: ComponentsRegister = 'events';

  // компоненты панели
  private tabButtons: Map<string, ButtonUI> = new Map();
  private debugComponentsApi: Map<string, DebugComponent> = new Map();
  private debugComponents = debugComponentsRegister;

  // UI элементы
  private panelContainer!: Phaser.GameObjects.Container;
  private tabsContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('DebugModule: init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.registerComponents();
    this.createPanel();
  }

  private registerComponents(): void {
    Object.entries(this.debugComponents).forEach(([name, ModuleClass]) => {
      const component = new ModuleClass(this.scene, this.eventBus);
      component.onInit();
      this.debugComponentsApi.set(name, component);
    });
  }

  private openDebugPanel(): void {
    this.isOpen = !this.isOpen;
  }

  private changeTab(tabName: ComponentsRegister): void {
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

    Object.entries(this.debugComponents).forEach(([name, component], ind) => {
      const tickBtn = new ButtonUI(this.scene, {
        xPos: 10 + 80 * ind,
        yPos: 0,
        // w: 85,
        h: 30,
        text: name,
        depth: this.tabsContainer.depth + 1,
        onClick: (): void => {
          this.changeTab(name as ComponentsRegister);
          this.toggleBtns(name as ComponentsRegister);
        },
      });
      this.tabButtons.set(name, tickBtn);
      tickBtn.setActiveTab(name === this.currentTab);
      this.tabsContainer.add(tickBtn.container);
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
    const contentHeight = 695;

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
    const tab = this.debugComponentsApi.get(this.currentTab);
    tab?.createContent(this.contentContainer);
  }

  private toggleBtns(buttonName: ComponentsRegister): void {
    this.tabButtons.forEach((component, name) => {
      component.setActiveTab(name === buttonName);
    });
  }
}
