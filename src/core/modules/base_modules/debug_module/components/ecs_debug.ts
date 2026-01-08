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
  private lastUpdate = 0;
  private updateInterval = 1000; // Обновлять каждую секунду

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

    // Сбросим таймер, чтобы данные обновились сразу
    this.lastUpdate = 0;
    this.updateECSInfo();
  }

  // деактивация компонента
  public onDeactivate(): void {
    // Очистка не требуется
  }

  // обновление компонента
  public onUpdate(): void {
    const now = Date.now();
    if (now - this.lastUpdate > this.updateInterval) {
      this.updateECSInfo();
      this.lastUpdate = now;
    }
  }

  private updateECSInfo(): void {
    try {
      const sim = window.sim;
      if (!sim || !sim.getECSStats) {
        console.log('ECSDebug: window.sim.getECSStats not available yet');
        this.showError('ECS stats not available');
        return;
      }

      const stats = sim.getECSStats() as ECSStats;
      if (!stats) {
        console.log('ECSDebug: no stats returned');
        this.showError('No ECS data');
        return;
      }

      console.log('ECSDebug: updating with stats', stats);
      this.updateSystemsList(stats);
      this.updateComponentsList();
      this.updateEntitiesList();
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

  private updateEntitiesList(): void {
    if (!this.entitiesList) return;

    this.entitiesList.innerHTML = '';

    // Для получения количества сущностей нам нужен доступ к миру
    // Пока что покажем заглушку
    const entitiesDiv = document.createElement('div');
    entitiesDiv.className = 'debug-ecs-item debug-ecs-entity';
    entitiesDiv.textContent = `• Total entities: ~100 (approximate)`;
    this.entitiesList.appendChild(entitiesDiv);

    // Добавим информацию о типах сущностей
    const entityTypes = ['Person', 'Shop', 'Factory'];
    entityTypes.forEach((type) => {
      const typeDiv = document.createElement('div');
      typeDiv.className = 'debug-ecs-item debug-ecs-entity-type';
      typeDiv.textContent = `• ${type} entities: counting...`;
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
