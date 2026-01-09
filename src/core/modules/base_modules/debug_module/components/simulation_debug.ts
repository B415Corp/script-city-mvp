import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { DebugComponent } from './debug_component';
import {
  Person,
  Citizen,
  Needs,
  Position,
  Schedule,
  Residential,
  Commercial,
  Workplace,
  ID,
} from '@/core/ecs/components';
import { query } from 'bitecs';

// Интерфейсы для данных симуляции
export interface CitizenData {
  id: number;
  age: number;
  gender: string;
  happiness: number;
  energy: number;
  money: number;
  home: number;
  workplace?: number;
  needs: {
    food: number; // Hunger level
    shopping: number; // Shopping need
    work: number; // Work need
    sleep: number; // Sleep need
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
  totalRevenue: number;
  totalCosts: number;
  averageHappiness: number;
  employmentRate: number;
}

export class SimulationDebug extends DebugComponent {
  private citizensList!: HTMLElement;
  private buildingsList!: HTMLElement;
  private economyList!: HTMLElement;
  private scheduleList!: HTMLElement;
  private updateTimer: number | null = null;
  private updateInterval = 2000; // Обновлять каждые 2 секунды

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
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
        this.showError('Менеджер ECS недоступен');
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

      citizenDiv.innerHTML = `
        <div class="debug-simulation-citizen-header">
          <strong>ID ${citizen.id}</strong> - ${citizen.age.toFixed(1)}г, ${citizen.gender === 'Male' ? 'Муж' : 'Жен'}
        </div>
        <div class="debug-simulation-citizen-stats">
          ${energyStatus} Энергия: ${citizen.energy.toFixed(0)}% |
          ${happinessStatus} Счастье: ${citizen.happiness.toFixed(0)}% |
          💰 $${citizen.money.toFixed(0)}
        </div>
        <div class="debug-simulation-citizen-needs">
          🍎 Голод: ${citizen.needs.food.toFixed(0)}% |
          🛒 Нужда в покупках: ${citizen.needs.shopping.toFixed(0)}% |
          💼 Нужда в работе: ${citizen.needs.work.toFixed(0)}% |
          😴 Нужда во сне: ${citizen.needs.sleep.toFixed(0)}%
        </div>
        <div class="debug-simulation-citizen-location">
          🏠 Дом: ${citizen.home} |
          💼 Работа: ${citizen.workplace || 'Нет'} |
          📍 Позиция: (${citizen.position.x.toFixed(1)}, ${citizen.position.y.toFixed(1)})
        </div>
      `;

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
        if (!acc[building.type]) acc[building.type] = [];
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

    economyDiv.innerHTML = `
      <div class="debug-simulation-economy-item">
        💰 <strong>Общие деньги:</strong> $${economyData.totalMoney.toFixed(0)}
      </div>
      <div class="debug-simulation-economy-item">
        📈 <strong>Общий доход:</strong> $${economyData.totalRevenue.toFixed(0)}/день
      </div>
      <div class="debug-simulation-economy-item">
        💸 <strong>Общие расходы:</strong> $${economyData.totalCosts.toFixed(0)}/день
      </div>
      <div class="debug-simulation-economy-item">
        😊 <strong>Среднее счастье:</strong> ${economyData.averageHappiness.toFixed(1)}%
      </div>
      <div class="debug-simulation-economy-item">
        💼 <strong>Уровень занятости:</strong> ${(economyData.employmentRate * 100).toFixed(1)}%
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
  }

  private getCitizensData(): CitizenData[] {
    // Получить данные всех жителей из ECS
    const citizens: CitizenData[] = [];

    try {
      // Получить всех сущностей с компонентами Person и Citizen
      const world = this.ecsManager!.getWorld();
      const personEntities = query(world, [Person, Citizen, Needs, Position, Schedule]);

      personEntities.forEach((eid: number) => {
        citizens.push({
          id: eid,
          age: Person.age[eid],
          gender: Person.gender[eid] === 0 ? 'Male' : 'Female',
          happiness: Citizen.happiness[eid],
          energy: Citizen.energy[eid],
          money: Citizen.money[eid],
          home: Citizen.home[eid],
          workplace:
            Citizen.workplace[eid] && Citizen.workplace[eid] > 0
              ? Citizen.workplace[eid]
              : undefined,
          needs: {
            food: Needs.food[eid],
            shopping: Needs.shopping[eid],
            work: Needs.work[eid],
            sleep: Needs.sleep[eid],
          },
          currentActivity: Schedule.currentActivity[eid] || 'idle',
          position: {
            x: Position.x[eid],
            y: Position.y[eid],
          },
        });
      });
    } catch (error) {
      console.error('Error getting citizens data:', error);
    }

    return citizens;
  }

  private getBuildingsData(): BuildingData[] {
    // Получить данные всех зданий из ECS
    const buildings: BuildingData[] = [];

    try {
      const world = this.ecsManager!.getWorld();

      // Получить жилые дома
      const residentialEntities = query(world, [Residential, Position, ID]);
      residentialEntities.forEach((eid: number) => {
        buildings.push({
          id: ID.value[eid],
          type: 'Residential',
          position: { x: Position.x[eid], y: Position.y[eid] },
        });
      });

      // Получить коммерческие здания
      const commercialEntities = query(world, [Commercial, Position, ID]);
      commercialEntities.forEach((eid: number) => {
        buildings.push({
          id: ID.value[eid],
          type:
            Commercial.type[eid] === 0 ? 'Shop' : Commercial.type[eid] === 1 ? 'Office' : 'Factory',
          position: { x: Position.x[eid], y: Position.y[eid] },
          capacity: Commercial.employees[eid]?.length || 0,
          currentOccupancy: Commercial.customers[eid]?.length || 0,
        });
      });

      // Получить рабочие места
      const workplaceEntities = query(world, [Workplace, Position, ID]);
      workplaceEntities.forEach((eid: number) => {
        buildings.push({
          id: ID.value[eid],
          type: 'Workplace',
          position: { x: Position.x[eid], y: Position.y[eid] },
          capacity: 1, // Одно рабочее место
          currentOccupancy: Workplace.worker[eid] ? 1 : 0,
        });
      });
    } catch (error) {
      console.error('Error getting buildings data:', error);
    }

    return buildings;
  }

  private getEconomyData(): EconomyData {
    const citizensData = this.getCitizensData();
    const buildingsData = this.getBuildingsData();

    const totalMoney = citizensData.reduce((sum, citizen) => sum + citizen.money, 0);
    // Пока используем заглушки для экономики, так как эти данные еще не реализованы в компонентах
    const totalRevenue = 0; // TODO: Реализовать в компонентах зданий
    const totalCosts = 0; // TODO: Реализовать в компонентах зданий
    const averageHappiness =
      citizensData.length > 0
        ? citizensData.reduce((sum, citizen) => sum + citizen.happiness, 0) / citizensData.length
        : 0;
    const employmentRate =
      citizensData.length > 0
        ? citizensData.filter((citizen) => citizen.workplace !== undefined).length /
          citizensData.length
        : 0;

    return {
      totalMoney,
      totalRevenue,
      totalCosts,
      averageHappiness,
      employmentRate,
    };
  }

  private getScheduleData(): {
    currentPhase: string;
    timeOfDay: string;
    activeCitizens: number;
    activities: { name: string; count: number }[];
  } {
    const citizensData = this.getCitizensData();

    // Определить текущее время и фазу
    const gameTime = this.getCurrentGameTime();
    const minutesOfDay = gameTime % (24 * 60);
    const hour = Math.floor(minutesOfDay / 60);
    const minute = Math.floor(minutesOfDay % 60);
    const timeOfDay = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    let currentPhase = 'неизвестно';
    if (hour >= 22 || hour < 6) currentPhase = 'Ночь (Сон)';
    else if (hour >= 18) currentPhase = 'Вечер (Покупки)';
    else if (hour >= 9) currentPhase = 'День (Работа)';
    else if (hour >= 6) currentPhase = 'Утро (Пробуждение)';

    // Подсчитать активности
    const activityCounts: Record<string, number> = {};
    citizensData.forEach((citizen) => {
      const activity = citizen.currentActivity;
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    const activities = Object.entries(activityCounts)
      .map(([name, count]) => ({ name: this.translateActivity(name), count }))
      .sort((a, b) => b.count - a.count);

    return {
      currentPhase,
      timeOfDay,
      activeCitizens: citizensData.length,
      activities,
    };
  }

  private getCurrentGameTime(): number {
    // Получить текущее игровое время из ECSManager
    return this.ecsManager!.getGameTime();
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

  private translateActivity(activity: string): string {
    switch (activity) {
      case 'sleep':
        return 'сон';
      case 'wake_up':
        return 'пробуждение';
      case 'work':
        return 'работа';
      case 'shopping_or_eat':
        return 'покупки/еда';
      case 'idle':
        return 'безделье';
      default:
        return activity;
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
