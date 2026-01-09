import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';

// Глобальный интерфейс для отладки (объявлен в main.ts)
declare global {
  interface Window {
    sim: {
      stats: () => void;
      time: () => void;
      listenTime: () => () => void;
      getECSStats: () => ECSStats;
    };
  }
}

export interface ECSStats {
  totalSystemsCount: number;
  clustersCount: number;
  systems: string[]; // Список всех зарегистрированных систем
  totalEntities: number; // Общее количество сущностей
  entityCounts: Record<string, number>; // Количество сущностей по типам
  clusters: Record<
    string,
    {
      systemsCount: number;
      systems: string[];
      enabled: boolean;
      interval?: number;
    }
  >;
}

export class ECSDebug extends DebugComponent {
  private systemsList!: HTMLElement;
  private componentsList!: HTMLElement;
  private entitiesList!: HTMLElement;
  private updateTimer: number | null = null;
  private updateInterval = 5000; // Обновлять каждые 5 секунд

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
  }

  private initDOM(): void {
    this.systemsList = document.getElementById('systems-list')!;
    this.componentsList = document.getElementById('components-list')!;
    this.entitiesList = document.getElementById('entities-list')!;
  }

  // создание контента
  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    this.initDOM();
  }

  // активация компонента
  public onActivate(): void {
    // Убедимся, что DOM элементы инициализированы
    if (!this.systemsList) {
      this.initDOM();
    }

    // Запустим периодическое обновление
    this.startPeriodicUpdate();
  }

  // деактивация компонента
  public onDeactivate(): void {
    this.stopPeriodicUpdate();
  }

  // обновление компонента (вызывается из DebugModule, но мы используем свой интервал)
  public onUpdate(): void {
    // Пустой метод - обновление происходит в setInterval
  }

  private startPeriodicUpdate(): void {
    // Остановим предыдущий интервал если он есть
    this.stopPeriodicUpdate();

    // Обновим данные сразу
    this.updateECSInfo();

    // Запустим периодическое обновление
    this.updateTimer = window.setInterval(() => {
      this.updateECSInfo();
    }, this.updateInterval);
  }

  private stopPeriodicUpdate(): void {
    if (this.updateTimer) {
      window.clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private updateECSInfo(): void {
    try {
      const sim = window.sim;
      if (!sim || !sim.getECSStats) {
        this.showError('ECS stats not available');
        return;
      }

      const stats = sim.getECSStats() as ECSStats;
      if (!stats) {
        this.showError('No ECS data');
        return;
      }

      this.updateSystemsList(stats);
      this.updateComponentsList();
      this.updateEntitiesList(stats);
    } catch (error) {
      console.error('Error updating ECS debug info:', error);
      this.showError('Error loading ECS data');
    }
  }

  private updateSystemsList(stats: ECSStats): void {
    if (!this.systemsList) return;

    this.systemsList.innerHTML = '';

    // Общая информация
    const totalDiv = document.createElement('div');
    totalDiv.className = 'debug-ecs-item debug-ecs-summary';
    totalDiv.textContent = `• Total systems: ${stats.totalSystemsCount}`;
    this.systemsList.appendChild(totalDiv);

    // Список всех систем
    const systemsHeader = document.createElement('div');
    systemsHeader.className = 'debug-ecs-item debug-ecs-summary';
    systemsHeader.textContent = `• Registered systems:`;
    this.systemsList.appendChild(systemsHeader);

    stats.systems.forEach((systemName) => {
      const systemItem = document.createElement('div');
      systemItem.className = 'debug-ecs-item debug-ecs-system';
      systemItem.textContent = `  • ${systemName}`;
      this.systemsList.appendChild(systemItem);
    });

    const clustersDiv = document.createElement('div');
    clustersDiv.className = 'debug-ecs-item debug-ecs-summary';
    clustersDiv.textContent = `• Clusters: ${stats.clustersCount}`;
    this.systemsList.appendChild(clustersDiv);

    // Детали по кластерам
    for (const [clusterName, cluster] of Object.entries(stats.clusters)) {
      const clusterDiv = document.createElement('div');
      clusterDiv.className = 'debug-ecs-cluster';

      const headerDiv = document.createElement('div');
      headerDiv.className = 'debug-ecs-cluster-header';
      headerDiv.textContent = `📁 ${clusterName} (${cluster.systemsCount} systems)`;
      if (!cluster.enabled) {
        headerDiv.classList.add('debug-ecs-disabled');
      }
      clusterDiv.appendChild(headerDiv);

      if (cluster.interval) {
        const intervalDiv = document.createElement('div');
        intervalDiv.className = 'debug-ecs-cluster-interval';
        intervalDiv.textContent = `⏱️ ${cluster.interval}s interval`;
        clusterDiv.appendChild(intervalDiv);
      }

      // Список систем в кластере
      for (const systemName of cluster.systems) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'debug-ecs-item debug-ecs-system';
        systemDiv.textContent = `• ${systemName}`;
        clusterDiv.appendChild(systemDiv);
      }

      this.systemsList.appendChild(clusterDiv);
    }
  }

  private updateComponentsList(): void {
    if (!this.componentsList) return;

    this.componentsList.innerHTML = '';

    // Список доступных компонентов
    const components = ['Person', 'Citizen', 'Needs', 'Schedule', 'Shop', 'Factory'];

    components.forEach((componentName) => {
      const componentDiv = document.createElement('div');
      componentDiv.className = 'debug-ecs-item debug-ecs-component';
      componentDiv.textContent = `• ${componentName}`;
      this.componentsList.appendChild(componentDiv);
    });
  }

  private updateEntitiesList(stats: ECSStats): void {
    if (!this.entitiesList) return;

    this.entitiesList.innerHTML = '';

    // Общее количество сущностей
    const entitiesDiv = document.createElement('div');
    entitiesDiv.className = 'debug-ecs-item debug-ecs-entity';
    entitiesDiv.textContent = `• Total entities: ${stats.totalEntities}`;
    this.entitiesList.appendChild(entitiesDiv);

    // Количество сущностей по типам
    const entityTypes = ['Person', 'Shop', 'Factory'];
    entityTypes.forEach((type) => {
      const count = stats.entityCounts[type] || 0;
      const typeDiv = document.createElement('div');
      typeDiv.className = 'debug-ecs-item debug-ecs-entity-type';
      typeDiv.textContent = `• ${type} entities: ${count}`;
      this.entitiesList.appendChild(typeDiv);
    });
  }

  private showError(message: string): void {
    if (this.systemsList)
      this.systemsList.innerHTML = `<div class="debug-no-data debug-error">• ${message}</div>`;
    if (this.componentsList)
      this.componentsList.innerHTML = `<div class="debug-no-data debug-error">• ${message}</div>`;
    if (this.entitiesList)
      this.entitiesList.innerHTML = `<div class="debug-no-data debug-error">• ${message}</div>`;
  }
}
