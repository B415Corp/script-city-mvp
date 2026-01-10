import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { DebugComponent } from './debug_component';
import { TimeService } from '@/core/tick/time_service';
import { TimeService as TimeServiceImport } from '@/core/tick/time_service';
import { query } from 'bitecs';
import { createSimpleComponent } from '@/core/ecs/core/component_schema';
import { ComponentRegistry } from '@/core/ecs/registry/component_registry';
import { SystemRegistry } from '@/core/ecs/registry/system_registry';
import { ClusterRegistry } from '@/core/ecs/registry/cluster_registry';

// Импортируем компоненты динамически из реестра
// Компоненты будут получаться во время выполнения

// Вспомогательные функции для упрощенной симуляции

// Интерфейсы для данных упрощенной симуляции
export interface CitizenData {
  id: number;
  age: number;
  gender: string;
  happiness: number;
  energy: number;
  money: number;
  home: number;
  workplace?: number; // Всегда есть в упрощенной симуляции
  housingType: string; // Всегда OWNED в упрощенной симуляции
  salary: number; // Всегда 100 в упрощенной симуляции
  needs: {
    food: number;
    shopping: number;
    work: number;
    sleep: number;
  };
  currentActivity: string;
  position: { x: number; y: number };
}

export interface BuildingData {
  id: number;
  type: string;
  position: { x: number; y: number };
  capacity?: number;
  currentOccupancy?: number;
}

export interface EconomyData {
  totalMoney: number;
  averageHappiness: number;
}

export class SimulationDebug extends DebugComponent {
  private citizensList!: HTMLElement;
  private buildingsList!: HTMLElement;
  private economyList!: HTMLElement;
  private scheduleList!: HTMLElement;
  private updateTimer: number | null = null;
  private updateInterval = 2000; // Обновлять каждые 2 секунды
  private timeService: TimeService;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    // Создаем TimeService для получения данных времени
    this.timeService = new TimeService(eventBus);
  }

  private initDOM(): void {
    this.citizensList = document.getElementById('citizens-list')!;
    this.buildingsList = document.getElementById('buildings-list')!;
    this.economyList = document.getElementById('economy-list')!;
    this.scheduleList = document.getElementById('schedule-list')!;
  }

  // создание контента
  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    this.initDOM();
  }

  // активация компонента
  public onActivate(): void {
    // Убедимся, что DOM элементы инициализированы
    if (!this.citizensList) {
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
    this.updateSimulationInfo();

    // Запустим периодическое обновление
    this.updateTimer = window.setInterval(() => {
      this.updateSimulationInfo();
    }, this.updateInterval);
  }

  private stopPeriodicUpdate(): void {
    if (this.updateTimer) {
      window.clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private updateSimulationInfo(): void {
    try {
      if (!this.ecsManager) {
        console.warn('ECS Manager not available');
        this.showError('Менеджер ECS недоступен');
        return;
      }

      if (!this.timeService) {
        console.warn('TimeService not available');
        this.showError('Сервис времени недоступен');
        return;
      }

      this.updateCitizensList();
      this.updateBuildingsList();
      this.updateEconomyList();
      this.updateScheduleList();
    } catch (error) {
      console.error('Error updating simulation debug info:', error);
      this.showError('Ошибка загрузки данных симуляции');
    }
  }

  private updateCitizensList(): void {
    if (!this.citizensList || !this.ecsManager) return;

    this.citizensList.innerHTML = '';

    // Получить всех жителей из ECS
    const citizensData = this.getCitizensData();
    // В упрощенной симуляции цены не используются

    if (citizensData.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.className = 'debug-no-data';
      noDataDiv.textContent = '• Жители не найдены';
      this.citizensList.appendChild(noDataDiv);
      return;
    }

    // Заголовок с количеством
    const headerDiv = document.createElement('div');
    headerDiv.className = 'debug-simulation-header';
    headerDiv.textContent = `👥 Жители (${citizensData.length}):`;
    this.citizensList.appendChild(headerDiv);

    // Отобразить каждого жителя
    citizensData.forEach((citizen) => {
      const citizenDiv = document.createElement('div');
      citizenDiv.className = 'debug-simulation-citizen';

      const energyStatus = citizen.energy > 70 ? '🟢' : citizen.energy > 30 ? '🟡' : '🔴';
      const happinessStatus = citizen.happiness > 70 ? '😊' : citizen.happiness > 30 ? '😐' : '😢';

      // В упрощенной симуляции все жители получают одинаковую зарплату и не имеют расходов
      const salaryStatus = '🟢'; // Все имеют работу и стабильный доход

      // Основная информация
      const basicInfo = document.createElement('div');
      basicInfo.className = 'debug-simulation-citizen-section';
      basicInfo.innerHTML = `
        <div class="debug-simulation-citizen-header">
          <strong>ID ${citizen.id}</strong> - ${citizen.age.toFixed(1)}г, ${citizen.gender === 'Male' ? 'Муж' : 'Жен'}
        </div>
      `;

      // Статусы и ресурсы
      const statusSection = document.createElement('div');
      statusSection.className = 'debug-simulation-citizen-section';
      statusSection.innerHTML = `
        <div class="debug-simulation-citizen-section-title">📊 Статусы и ресурсы</div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">${energyStatus}</span>
          <span>Энергия: ${citizen.energy.toFixed(0)}%</span>
        </div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">${happinessStatus}</span>
          <span>Счастье: ${citizen.happiness.toFixed(0)}%</span>
        </div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">💰</span>
          <span>Деньги: $${citizen.money.toFixed(0)}</span>
        </div>
      `;

      // Работа
      const workSection = document.createElement('div');
      workSection.className = 'debug-simulation-citizen-section';
      workSection.innerHTML = `
        <div class="debug-simulation-citizen-section-title">💼 Работа</div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">💼</span>
          <span>Работа: ID ${citizen.workplace}</span>
        </div>
      `;

      // Жилье
      const housingSection = document.createElement('div');
      housingSection.className = 'debug-simulation-citizen-section';
      housingSection.innerHTML = `
        <div class="debug-simulation-citizen-section-title">🏠 Жилье</div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">🏠</span>
          <span>Дом: ID ${citizen.home}</span>
        </div>
      `;

      // Местоположение
      const locationSection = document.createElement('div');
      locationSection.className = 'debug-simulation-citizen-section';
      locationSection.innerHTML = `
        <div class="debug-simulation-citizen-section-title">📍 Местоположение</div>
        <div class="debug-simulation-citizen-stat-item">
          <span class="debug-simulation-citizen-stat-icon">📍</span>
          <span>Позиция: (${citizen.position.x.toFixed(1)}, ${citizen.position.y.toFixed(1)})</span>
        </div>
      `;

      // Добавляем все секции
      citizenDiv.appendChild(basicInfo);
      citizenDiv.appendChild(statusSection);
      citizenDiv.appendChild(workSection);
      citizenDiv.appendChild(housingSection);
      citizenDiv.appendChild(locationSection);

      this.citizensList.appendChild(citizenDiv);
    });
  }

  private updateBuildingsList(): void {
    if (!this.buildingsList || !this.ecsManager) return;

    this.buildingsList.innerHTML = '';

    // Получить все здания из ECS
    const buildingsData = this.getBuildingsData();

    if (buildingsData.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.className = 'debug-no-data';
      noDataDiv.textContent = '• Здания не найдены';
      this.buildingsList.appendChild(noDataDiv);
      return;
    }

    // Заголовок с количеством
    const headerDiv = document.createElement('div');
    headerDiv.className = 'debug-simulation-header';
    headerDiv.textContent = `🏢 Здания (${buildingsData.length}):`;
    this.buildingsList.appendChild(headerDiv);

    // Группировать по типам
    const buildingsByType = buildingsData.reduce(
      (acc, building) => {
        if (!acc[building.type]) {
          acc[building.type] = [];
        }
        acc[building.type].push(building);
        return acc;
      },
      {} as Record<string, BuildingData[]>,
    );

    Object.entries(buildingsByType).forEach(([type, buildings]) => {
      const typeDiv = document.createElement('div');
      typeDiv.className = 'debug-simulation-building-type';

      const typeHeader = document.createElement('div');
      typeHeader.className = 'debug-simulation-building-header';
      typeHeader.textContent = `${this.getBuildingIcon(type)} ${this.getBuildingTypeName(type)} (${buildings.length}):`;
      typeDiv.appendChild(typeHeader);

      buildings.forEach((building) => {
        const buildingDiv = document.createElement('div');
        buildingDiv.className = 'debug-simulation-building-item';

        let details = `ID ${building.id} at (${building.position.x.toFixed(1)}, ${building.position.y.toFixed(1)})`;

        if (building.capacity !== undefined) {
          details += ` | Capacity: ${building.currentOccupancy || 0}/${building.capacity}`;
        }

        buildingDiv.textContent = `  • ${details}`;
        typeDiv.appendChild(buildingDiv);
      });

      this.buildingsList.appendChild(typeDiv);
    });
  }

  private updateEconomyList(): void {
    if (!this.economyList || !this.ecsManager) return;

    this.economyList.innerHTML = '';

    // Получить экономические данные
    const economyData = this.getEconomyData();

    const economyDiv = document.createElement('div');
    economyDiv.className = 'debug-simulation-economy';

    const citizensData = this.getCitizensData();
    const buildingsData = this.getBuildingsData();

    // Подсчитываем реальные данные
    const residentialBuildings = buildingsData.filter((b) => b.type === 'Residential');
    const workplaceBuildings = buildingsData.filter((b) => b.type === 'Workplace');
    const totalCapacity = residentialBuildings.reduce((sum, b) => sum + (b.capacity || 0), 0);
    const totalWorkplaces = workplaceBuildings.length;

    economyDiv.innerHTML = `
      <div class="debug-simulation-economy-item">
        👥 <strong>Население:</strong> ${citizensData.length} чел.
      </div>
      <div class="debug-simulation-economy-item">
        🏠 <strong>Жилые дома:</strong> ${residentialBuildings.length} шт. (вместимость: ${totalCapacity})
      </div>
      <div class="debug-simulation-economy-item">
        💼 <strong>Рабочие места:</strong> ${totalWorkplaces} шт.
      </div>
      <div class="debug-simulation-economy-item">
        🏢 <strong>Коммерческие здания:</strong> ${buildingsData.filter((b) => b.type !== 'Residential' && b.type !== 'Workplace').length} шт.
      </div>
      <div class="debug-simulation-economy-item">
        💰 <strong>Общие деньги:</strong> $${economyData.totalMoney.toFixed(0)}
      </div>
      <div class="debug-simulation-economy-item">
        💰 <strong>Деньги на жителя:</strong> $${citizensData.length > 0 ? (economyData.totalMoney / citizensData.length).toFixed(0) : '0'}
      </div>
      <div class="debug-simulation-economy-item">
        😊 <strong>Среднее счастье:</strong> ${economyData.averageHappiness.toFixed(1)}%
      </div>
    `;

    this.economyList.appendChild(economyDiv);
  }

  private updateScheduleList(): void {
    if (!this.scheduleList || !this.ecsManager) return;

    this.scheduleList.innerHTML = '';

    // Получить информацию о расписании
    const scheduleData = this.getScheduleData();

    const scheduleDiv = document.createElement('div');
    scheduleDiv.className = 'debug-simulation-schedule';

    scheduleDiv.innerHTML = `
      <div class="debug-simulation-schedule-item">
        📅 <strong>Текущая фаза:</strong> ${scheduleData.currentPhase}
      </div>
      <div class="debug-simulation-schedule-item">
        ⏰ <strong>Время суток:</strong> ${scheduleData.timeOfDay}
      </div>
      <div class="debug-simulation-schedule-item">
        👥 <strong>Активных жителей:</strong> ${scheduleData.activeCitizens}
      </div>
      <div class="debug-simulation-schedule-item">
        🎯 <strong>Текущие активности:</strong>
      </div>
    `;

    // Добавить активности
    scheduleData.activities.forEach((activity) => {
      const activityDiv = document.createElement('div');
      activityDiv.className = 'debug-simulation-activity-item';
      activityDiv.textContent = `  • ${activity.name}: ${activity.count} citizens`;
      scheduleDiv.appendChild(activityDiv);
    });

    this.scheduleList.appendChild(scheduleDiv);

    // Добавить информацию о системах и кластерах
    this.addSystemsAndClustersInfo(this.scheduleList);
  }

  private addSystemsAndClustersInfo(container: HTMLElement): void {
    const systemRegistry = SystemRegistry.getInstance();
    const clusterRegistry = ClusterRegistry.getInstance();

    // Разделитель
    const separator = document.createElement('hr');
    separator.className = 'debug-separator';
    container.appendChild(separator);

    // Системы
    const systemsHeader = document.createElement('div');
    systemsHeader.className = 'debug-simulation-schedule-item';
    systemsHeader.innerHTML = `⚙️ <strong>Зарегистрированные системы (${systemRegistry.size()}):</strong>`;
    container.appendChild(systemsHeader);

    const registeredSystems = systemRegistry.getAll();
    Array.from(registeredSystems.keys())
      .sort()
      .forEach((systemName) => {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'debug-simulation-activity-item';
        systemDiv.textContent = `  • ${systemName}`;
        container.appendChild(systemDiv);
      });

    // Кластеры
    if (clusterRegistry.size() > 0) {
      const clustersHeader = document.createElement('div');
      clustersHeader.className = 'debug-simulation-schedule-item';
      clustersHeader.innerHTML = `📁 <strong>Кластеры систем (${clusterRegistry.size()}):</strong>`;
      container.appendChild(clustersHeader);

      const registeredClusters = clusterRegistry.getAll();
      Array.from(registeredClusters.values()).forEach((cluster) => {
        const clusterDiv = document.createElement('div');
        clusterDiv.className = 'debug-simulation-cluster-item';
        const status = cluster.metadata.enabled ? '🟢' : '🔴';
        const interval = cluster.metadata.interval
          ? `${cluster.metadata.interval}ms`
          : 'каждый тик';
        clusterDiv.innerHTML = `
          <div class="debug-simulation-cluster-header">
            ${status} ${cluster.name} (${cluster.systemNames.length} систем, ${interval})
          </div>
        `;
        container.appendChild(clusterDiv);
      });
    }
  }

  private getCitizensData(): CitizenData[] {
    const citizens: CitizenData[] = [];

    try {
      if (!this.ecsManager) {
        console.warn('ECSManager not available in getCitizensData');
        return citizens;
      }

      const world = this.ecsManager.getWorld();
      if (!world) {
        console.warn('World not available in getCitizensData');
        return citizens;
      }

      // Получаем компоненты из реестра
      const componentRegistry = ComponentRegistry.getInstance();
      const personComponent = componentRegistry.get('Person');
      const citizenComponent = componentRegistry.get('Citizen');
      const positionComponent = componentRegistry.get('Position');

      if (!personComponent || !citizenComponent || !positionComponent) {
        console.warn('Required components not found in registry');
        return citizens;
      }

      // Получаем все сущности с компонентами Person и Citizen
      const personEntities = query(world, [personComponent, citizenComponent, positionComponent]);

      personEntities.forEach((eid: number) => {
        try {
          // Доступ к компонентам через BitECS API
          const age = (personComponent as any).age[eid] || 0;
          const gender = (personComponent as any).gender[eid] || 0;
          const happiness = (citizenComponent as any).happiness[eid] || 0;
          const energy = (citizenComponent as any).energy[eid] || 0;
          const money = (citizenComponent as any).money[eid] || 0;
          const home = (citizenComponent as any).home[eid] || 0;
          const workplace = (citizenComponent as any).workplace[eid] || 0;
          const housingType = (citizenComponent as any).housingType[eid] || 0;
          const posX = (positionComponent as any).x[eid] || 0;
          const posY = (positionComponent as any).y[eid] || 0;

          // Определяем тип жилья
          const housingNames: Record<number, string> = {
            0: 'Собственное',
            1: 'Арендное',
          };

          citizens.push({
            id: eid,
            age: Math.floor(age),
            gender: gender === 0 ? 'Male' : 'Female',
            happiness: happiness,
            energy: energy,
            money: money,
            home: home,
            workplace: workplace,
            housingType: housingNames[housingType] || 'Собственное',
            salary: 100, // Пока фиксированная зарплата
            needs: {
              food: 50, // Заглушка, пока нет компонента Needs
              shopping: 30,
              work: energy,
              sleep: 80 - energy,
            },
            currentActivity: 'idle', // Заглушка, пока нет компонента Schedule
            position: {
              x: posX,
              y: posY,
            },
          });
        } catch (error) {
          console.warn(`Error reading citizen entity ${eid}:`, error);
        }
      });
    } catch (error) {
      console.error('Error getting citizens data:', error);
    }

    return citizens;
  }

  private getBuildingsData(): BuildingData[] {
    const buildings: BuildingData[] = [];

    try {
      if (!this.ecsManager) {
        console.warn('ECSManager not available in getBuildingsData');
        return buildings;
      }

      const world = this.ecsManager.getWorld();
      if (!world) {
        console.warn('World not available in getBuildingsData');
        return buildings;
      }

      // Получаем компоненты из реестра
      const componentRegistry = ComponentRegistry.getInstance();
      const positionComponent = componentRegistry.get('Position');
      const residentialComponent = componentRegistry.get('Residential');
      const commercialComponent = componentRegistry.get('Commercial');
      const workplaceComponent = componentRegistry.get('Workplace');

      if (!positionComponent) {
        console.warn('Position component not found in registry');
        return buildings;
      }

      // Получаем жилые дома
      if (residentialComponent) {
        const residentialEntities = query(world, [residentialComponent, positionComponent]);

        residentialEntities.forEach((eid: number) => {
          try {
            const capacity = (residentialComponent as any).capacity[eid] || 4;
            const occupants = (residentialComponent as any).occupants[eid] || 0;
            const posX = (positionComponent as any).x[eid] || 0;
            const posY = (positionComponent as any).y[eid] || 0;

            buildings.push({
              id: eid,
              type: 'Residential',
              position: {
                x: posX,
                y: posY,
              },
              capacity: capacity,
              currentOccupancy: occupants,
            });
          } catch (error) {
            console.warn(`Error reading Residential entity ${eid}:`, error);
          }
        });
      }

      // Получаем коммерческие здания
      if (commercialComponent) {
        const commercialEntities = query(world, [commercialComponent, positionComponent]);

        commercialEntities.forEach((eid: number) => {
          try {
            const buildingType = (commercialComponent as any).type[eid] || 0;
            const employees = (commercialComponent as any).employees[eid] || 0;
            const customers = (commercialComponent as any).customers[eid] || 0;
            const posX = (positionComponent as any).x[eid] || 0;
            const posY = (positionComponent as any).y[eid] || 0;

            const typeNames = ['Shop', 'Office', 'Factory'];

            buildings.push({
              id: eid,
              type: typeNames[buildingType] || 'Shop',
              position: {
                x: posX,
                y: posY,
              },
              capacity: employees,
              currentOccupancy: customers,
            });
          } catch (error) {
            console.warn(`Error reading Commercial entity ${eid}:`, error);
          }
        });
      }

      // Получаем рабочие места
      if (workplaceComponent) {
        const workplaceEntities = query(world, [workplaceComponent, positionComponent]);

        workplaceEntities.forEach((eid: number) => {
          try {
            const occupied = (workplaceComponent as any).occupied[eid] || 0;
            const posX = (positionComponent as any).x[eid] || 0;
            const posY = (positionComponent as any).y[eid] || 0;

            buildings.push({
              id: eid,
              type: 'Workplace',
              position: {
                x: posX,
                y: posY,
              },
              capacity: 1, // Одно рабочее место
              currentOccupancy: occupied,
            });
          } catch (error) {
            console.warn(`Error reading Workplace entity ${eid}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error getting buildings data:', error);
    }

    return buildings;
  }

  private getEconomyData(): EconomyData {
    const citizensData = this.getCitizensData();

    const totalMoney = citizensData.reduce((sum, citizen) => sum + citizen.money, 0);

    const averageHappiness =
      citizensData.length > 0
        ? citizensData.reduce((sum, citizen) => sum + citizen.happiness, 0) / citizensData.length
        : 0;

    return {
      totalMoney,
      averageHappiness,
    };
  }

  private getScheduleData(): {
    currentPhase: string;
    timeOfDay: string;
    activeCitizens: number;
    activities: { name: string; count: number }[];
  } {
    const citizensData = this.getCitizensData();

    // Определить текущее время и фазу на основе реального времени
    let timeOfDay = '00:00';
    let currentPhase = 'неизвестно';

    try {
      const gameTime = this.getCurrentGameTime();
      const minutesOfDay = gameTime % (24 * 60);
      const hour = Math.floor(minutesOfDay / 60);
      const minute = Math.floor(minutesOfDay % 60);
      timeOfDay = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      if (hour >= 22 || hour < 6) currentPhase = 'Ночь (Сон)';
      else if (hour >= 18) currentPhase = 'Вечер (Покупки)';
      else if (hour >= 9) currentPhase = 'День (Работа)';
      else if (hour >= 6) currentPhase = 'Утро (Пробуждение)';
    } catch (error) {
      console.warn('Error getting time data for schedule:', error);
    }

    // Простая логика активностей на основе энергии жителей
    const activities: { name: string; count: number }[] = [];
    if (citizensData.length > 0) {
      const sleeping = citizensData.filter((c) => c.energy < 30).length;
      const working = citizensData.filter((c) => c.energy >= 30 && c.energy < 70).length;
      const shopping = citizensData.filter((c) => c.energy >= 70).length;

      if (sleeping > 0) activities.push({ name: 'сон', count: sleeping });
      if (working > 0) activities.push({ name: 'работа', count: working });
      if (shopping > 0) activities.push({ name: 'покупки/отдых', count: shopping });
    }

    return {
      currentPhase,
      timeOfDay,
      activeCitizens: citizensData.length,
      activities,
    };
  }

  private getCurrentGameTime(): number {
    // Получить текущее игровое время из TimeService
    try {
      return this.timeService.getTimeData().totalMinutes;
    } catch (error) {
      console.warn('TimeService not ready, using fallback time');
      return 8 * 60; // 8:00 fallback
    }
  }

  private getBuildingIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'residential':
        return '🏠';
      case 'shop':
        return '🏪';
      case 'office':
        return '🏢';
      case 'workplace':
        return '💼';
      default:
        return '🏗️';
    }
  }

  private getBuildingTypeName(type: string): string {
    switch (type.toLowerCase()) {
      case 'residential':
        return 'Жилые';
      case 'shop':
        return 'Магазины';
      case 'office':
        return 'Офисы';
      case 'workplace':
        return 'Рабочие места';
      default:
        return type;
    }
  }

  private showError(message: string): void {
    const errorDiv = `<div class="debug-no-data debug-error">• ${message}</div>`;

    if (this.citizensList) this.citizensList.innerHTML = errorDiv;
    if (this.buildingsList) this.buildingsList.innerHTML = errorDiv;
    if (this.economyList) this.economyList.innerHTML = errorDiv;
    if (this.scheduleList) this.scheduleList.innerHTML = errorDiv;
  }
}
