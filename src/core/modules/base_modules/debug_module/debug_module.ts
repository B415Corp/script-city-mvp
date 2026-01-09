import { BaseModule } from '../../extends';
import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { DebugComponent } from './components/debug_component';
import { EventsDebug } from './components/events_debug';
import { TickDebug } from './components/tick_debug';
import { ECSDebug } from './components/ecs_debug';
import { SimulationDebug } from './components/simulation_debug';
import { Logger } from '@/core/utils/logger';

// названия базовых модулей с их классами
const debugComponentsRegister = {
  events: EventsDebug,
  tick: TickDebug,
  ecs: ECSDebug,
  simulation: SimulationDebug,
} as const;

type ComponentsRegister = keyof typeof debugComponentsRegister;

// Типы конструкторов для разных компонентов
type DebugComponentConstructor = new (scene: Phaser.Scene, eventBus: EventBus) => DebugComponent;
type ECSDebugComponentConstructor = new (
  scene: Phaser.Scene,
  eventBus: EventBus,
  ecsManager: ECSManager,
) => DebugComponent;
type SimulationDebugComponentConstructor = new (
  scene: Phaser.Scene,
  eventBus: EventBus,
  ecsManager: ECSManager,
) => DebugComponent;

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  protected ecsManager!: ECSManager;
  private logger: Logger;

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

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus);
    this.logger = Logger.create('DebugModule');
    this.logger.info('DebugModule initialized');
    this.scene = scene;
    this.eventBus = eventBus;
    this.ecsManager = ecsManager;

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
      let component: DebugComponent;

      // ECSDebug и SimulationDebug получают ECSManager для доступа к статистике entities
      if (name === 'ecs' || name === 'simulation') {
        component = new (ModuleClass as ECSDebugComponentConstructor)(
          this.scene,
          this.eventBus,
          this.ecsManager,
        );
      } else {
        component = new (ModuleClass as DebugComponentConstructor)(this.scene, this.eventBus);
      }

      component.onInit();
      this.debugComponentsApi.set(name, component);
    });
  }

  // обновление компонентов
  public update(): void {
    const currentComponent = this.debugComponentsApi.get(this.currentTab);
    // ECS и Simulation компоненты обновляются самостоятельно через setInterval
    if (currentComponent && this.currentTab !== 'ecs' && this.currentTab !== 'simulation') {
      currentComponent.onUpdate();
    }
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
    this.logger.debug('Current tab:', this.currentTab);

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
