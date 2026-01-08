import { BaseModule } from '../../extends';
import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './components/debug_component';
import { EventsDebug } from './components/events_debug';
import { TickDebug } from './components/tick_debug';
import { ECSDebug } from './components/ecs_debug';

// названия базовых модулей с их классами
const debugComponentsRegister = {
  events: EventsDebug,
  tick: TickDebug,
  ecs: ECSDebug,
} as const;

type ComponentsRegister = keyof typeof debugComponentsRegister;

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isOpen: boolean = false;
  private currentTab: ComponentsRegister = 'events';

  // компоненты панели
  private debugComponentsApi: Map<string, DebugComponent> = new Map();
  private debugComponents = debugComponentsRegister;

  // DOM элементы
  private debugPanel!: HTMLElement;
  private debugToggleBtn!: HTMLElement;
  private tabButtons: Map<string, HTMLElement> = new Map();
  private tabContents: Map<string, HTMLElement> = new Map();

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('DebugModule: init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.registerComponents();
    this.initDOM();
    this.setupEventListeners();

    // Активируем начальный компонент
    const initialComponent = this.debugComponentsApi.get(this.currentTab);
    initialComponent?.onActivate();
  }

  // регистрация компонентов
  private registerComponents(): void {
    Object.entries(this.debugComponents).forEach(([name, ModuleClass]) => {
      const component = new ModuleClass(this.scene, this.eventBus);
      component.onInit();
      this.debugComponentsApi.set(name, component);
    });
  }

  // обновление компонентов
  public update(): void {
    const currentComponent = this.debugComponentsApi.get(this.currentTab);
    currentComponent?.onUpdate();
  }

  // инициализация DOM элементов
  private initDOM(): void {
    this.debugPanel = document.getElementById('debug-panel')!;
    this.debugToggleBtn = document.getElementById('debug-toggle')!;

    // Сохраняем ссылки на табы и контент
    document.querySelectorAll('.debug-tab').forEach((tab) => {
      const tabName = tab.getAttribute('data-tab')!;
      this.tabButtons.set(tabName, tab as HTMLElement);
    });

    document.querySelectorAll('.debug-tab-content').forEach((content) => {
      const tabName = content.getAttribute('data-tab')!;
      this.tabContents.set(tabName, content as HTMLElement);
    });
  }

  // настройка обработчиков событий
  private setupEventListeners(): void {
    // Обработчик для кнопки открытия/закрытия панели
    this.debugToggleBtn.addEventListener('click', () => {
      this.toggleDebugPanel();
    });

    // Обработчик клавиш для переключения панели (Ctrl+D)
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        this.toggleDebugPanel();
      }
    });

    // Обработчики для переключения табов
    this.tabButtons.forEach((tabBtn, tabName) => {
      tabBtn.addEventListener('click', () => {
        this.changeTab(tabName as ComponentsRegister);
      });
    });
  }

  // открытие/закрытие панели отладки
  private toggleDebugPanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.debugPanel.classList.remove('hidden');
    } else {
      this.debugPanel.classList.add('hidden');
    }
  }

  // изменение вкладки
  private changeTab(tabName: ComponentsRegister): void {
    // Деактивируем предыдущий компонент
    const prevComponent = this.debugComponentsApi.get(this.currentTab);
    prevComponent?.onDeactivate();

    this.currentTab = tabName;
    this.updateActiveTab();
    console.log('Current tab:', this.currentTab);

    // Активируем новый компонент
    const newComponent = this.debugComponentsApi.get(this.currentTab);
    newComponent?.onActivate();
  }

  // обновление активного таба
  private updateActiveTab(): void {
    // Сбрасываем активные состояния всех табов
    this.tabButtons.forEach((tab) => tab.classList.remove('active'));
    this.tabContents.forEach((content) => content.classList.remove('active'));

    // Активируем текущий таб и контент
    const currentTabBtn = this.tabButtons.get(this.currentTab);
    const currentTabContent = this.tabContents.get(this.currentTab);

    currentTabBtn?.classList.add('active');
    currentTabContent?.classList.add('active');
  }
}
