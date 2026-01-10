import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { DebugComponent } from './debug_component';

// Глобальный интерфейс для отладки (объявлен в main.ts)
declare global {
  interface Window {
    sim: {
      stats: () => void;
      time: () => void;
      listenTime: () => () => void;
      getECSStats: () => ECSDebugStats;
    };
  }
}

export interface ECSDebugStats {
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

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus);
    this.ecsManager = ecsManager;
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
      if (!this.ecsManager) {
        this.showError('ECS manager not available');
        return;
      }

      const stats = this.ecsManager.getStats() as unknown as ECSDebugStats;
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

  private updateSystemsList(stats: ECSDebugStats): void {
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

  private updateEntitiesList(stats: ECSDebugStats): void {
    if (!this.entitiesList) return;

    this.entitiesList.innerHTML = '';

    // Общая статистика ECS
    const overviewDiv = document.createElement('div');
    overviewDiv.className = 'debug-ecs-overview';
    overviewDiv.innerHTML = `
      <div class="debug-ecs-item debug-ecs-summary">📊 <strong>ECS Overview</strong></div>
      <div class="debug-ecs-item">• Systems: ${stats.totalSystemsCount}</div>
      <div class="debug-ecs-item">• Clusters: ${stats.clustersCount}</div>
      <div class="debug-ecs-item">• Total entities: ${stats.totalEntities}</div>
    `;
    this.entitiesList.appendChild(overviewDiv);

    // Разделитель
    const separator1 = document.createElement('hr');
    separator1.className = 'debug-separator';
    this.entitiesList.appendChild(separator1);

    // Сущности по типам
    const entitiesHeader = document.createElement('div');
    entitiesHeader.className = 'debug-ecs-item debug-ecs-summary';
    entitiesHeader.textContent = '🏷️ Entities by Type:';
    this.entitiesList.appendChild(entitiesHeader);

    // Получить все типы сущностей из entityCounts
    const allEntityTypes = Object.keys(stats.entityCounts).sort();
    allEntityTypes.forEach((type) => {
      const count = stats.entityCounts[type] || 0;
      const typeDiv = document.createElement('div');
      typeDiv.className = 'debug-ecs-item debug-ecs-entity-type';
      typeDiv.textContent = `• ${type}: ${count}`;
      this.entitiesList.appendChild(typeDiv);
    });

    // Если нет сущностей по типам, показать сообщение
    if (allEntityTypes.length === 0) {
      const noEntitiesDiv = document.createElement('div');
      noEntitiesDiv.className = 'debug-ecs-item debug-ecs-no-data';
      noEntitiesDiv.textContent = '• No entities found';
      this.entitiesList.appendChild(noEntitiesDiv);
    }

    // Разделитель
    const separator2 = document.createElement('hr');
    separator2.className = 'debug-separator';
    this.entitiesList.appendChild(separator2);

    // Кластеры
    const clustersHeader = document.createElement('div');
    clustersHeader.className = 'debug-ecs-item debug-ecs-summary';
    clustersHeader.textContent = '⚙️ System Clusters:';
    this.entitiesList.appendChild(clustersHeader);

    Object.entries(stats.clusters).forEach(([clusterName, cluster]) => {
      const clusterDiv = document.createElement('div');
      clusterDiv.className = 'debug-ecs-cluster-summary';

      const status = cluster.enabled ? '🟢' : '🔴';
      const interval = cluster.interval ? `${cluster.interval}s` : 'every tick';

      clusterDiv.innerHTML = `
        <div class="debug-ecs-item debug-ecs-cluster-header">
          ${status} ${clusterName} (${cluster.systemsCount} systems, ${interval})
        </div>
      `;

      // Показать системы в кластере если их мало
      if (cluster.systems.length <= 3) {
        cluster.systems.forEach((systemName) => {
          const systemDiv = document.createElement('div');
          systemDiv.className = 'debug-ecs-item debug-ecs-system-small';
          systemDiv.textContent = `  • ${systemName}`;
          clusterDiv.appendChild(systemDiv);
        });
      } else {
        const systemsDiv = document.createElement('div');
        systemsDiv.className = 'debug-ecs-item debug-ecs-system-small';
        systemsDiv.textContent = `  • ${cluster.systems.slice(0, 2).join(', ')}... (+${cluster.systems.length - 2} more)`;
        clusterDiv.appendChild(systemsDiv);
      }

      this.entitiesList.appendChild(clusterDiv);
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
