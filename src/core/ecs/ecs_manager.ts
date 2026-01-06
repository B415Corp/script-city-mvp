import { createWorld, addEntity, removeEntity, World, EntityId } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

/**
 * Данные обновления игрового времени
 */
export interface GameTimeUpdateData {
  /** Общее время в минутах */
  totalMinutes: number;
  /** Время дня в формате HH:MM */
  timeOfDay: string;
  /** Номер дня */
  day: number;
  /** Час дня (0-23) */
  hour: number;
  /** Минута часа (0-59) */
  minute: number;
  /** Время дня в минутах от начала дня */
  minutesOfDay: number;
}
import { EntityFactory } from './entities';
import { PopulationSystem, NeedsSystem, DailyRoutineSystem } from './systems/clusters';
import { System } from './systems/types';

/**
 * Главный менеджер ECS
 * Управляет миром, сущностями, системами и симуляцией
 *
 * Особенности времени:
 * - Игровое время привязано к LogicTick событиям
 * - Каждый LogicTick = 15 минут игрового времени (фиксировано)
 * - Первый день начинается в 08:00, последующие дни в 00:00
 * - Цикл суток: 24 часа игрового времени
 * - При паузе игры - LogicTick'и не идут → время останавливается
 * - Скорость времени = tickRate × 15 мин/тик (изменяется в TickManager)
 */
export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory;
  private systems: System[] = [];
  private gameTime = 8 * 60; // общее игровое время в минутах (стартуем с 8:00 первого дня)

  // Константы времени
  private readonly MINUTES_PER_DAY = 24 * 60; // 1440 минут в сутках
  private readonly MINUTES_PER_TICK = 15; // 15 минут игры за 1 логический тик

  /**
   * Получить время дня (минуты от начала текущего дня)
   */
  private get gameTimeOfDay(): number {
    return this.gameTime % this.MINUTES_PER_DAY;
  }

  constructor(private eventBus: EventBus) {
    console.log('🚀 ECSManager initialized');
    this.world = createWorld();
    this.entityFactory = new EntityFactory(this.world);

    // Подписываемся на LogicTick для обновления систем
    this.eventBus.on(Events.LogicTick, (payload) => {
      const { delta } = payload as { delta: number };
      this.updateSystems(delta);
    });
  }

  /**
   * Первый шаг симуляции - создает MVP мир
   * Дом, магазины, жители, рабочие места
   */
  firstSimulationStep(): void {
    console.log('🏗️ Starting first simulation step...');

    // Создаем здания
    const house = this.entityFactory.buildings.createSimpleHouse({ x: 100, y: 100 });
    const foodShop = this.entityFactory.buildings.createSimpleShop({ x: 200, y: 100 });
    const goodsShop = this.entityFactory.buildings.createSimpleShop({ x: 300, y: 100 });

    // Создаем рабочие места
    const workplaces = [
      this.entityFactory.buildings.createSimpleOffice({ x: 150, y: 200 }, 400), // Кассир в продуктовом
      this.entityFactory.buildings.createSimpleOffice({ x: 250, y: 200 }, 450), // Кассир в магазине товаров
      this.entityFactory.buildings.createSimpleOffice({ x: 350, y: 200 }, 500), // Офисный работник
      this.entityFactory.buildings.createSimpleOffice({ x: 150, y: 300 }, 550), // Офисный работник
      this.entityFactory.buildings.createSimpleOffice({ x: 250, y: 300 }, 600), // Офисный работник
    ];

    // Создаем жителей (5 мужчин + 5 женщин)
    const citizens = this.createCitizens(house);

    // Распределяем работу
    this.assignJobs(citizens, workplaces);

    // Регистрируем системы
    this.registerSystem(PopulationSystem);
    this.registerSystem(NeedsSystem);
    this.registerSystem(DailyRoutineSystem);

    console.log(`✅ MVP simulation ready:`);
    console.log(`   🏠 1 house, 🛒 2 shops, 🏢 ${workplaces.length} workplaces`);
    console.log(
      `   👥 ${citizens.length} citizens (${Math.floor(citizens.length / 2)} men + ${Math.floor(
        citizens.length / 2,
      )} women)`,
    );
    console.log(`   ⚙️ ${this.systems.length} systems registered`);
    console.log(
      `   🕐 Started at ${this.getStats().gameTimeOfDay}, Day ${this.getStats().day} (new days start at 00:00)`,
    );
  }

  /**
   * Создает жителей и размещает их в доме
   */
  private createCitizens(houseId: number): number[] {
    const citizens: number[] = [];

    // Создаем мужчин
    for (let i = 0; i < 5; i++) {
      const citizen = this.entityFactory.persons.createRandom(
        { x: 100 + i * 20, y: 120 + i * 10 },
        houseId,
      );
      citizens.push(citizen);
    }

    // Создаем женщин
    for (let i = 0; i < 5; i++) {
      const citizen = this.entityFactory.persons.createRandom(
        { x: 100 + i * 20, y: 140 + i * 10 },
        houseId,
      );
      citizens.push(citizen);
    }

    return citizens;
  }

  /**
   * Распределяет жителей по рабочим местам
   */
  private assignJobs(citizens: number[], workplaces: number[]): void {
    const availableWorkplaces = [...workplaces];

    for (const citizenId of citizens) {
      if (availableWorkplaces.length === 0) break;

      const workplaceIndex = Math.floor(Math.random() * availableWorkplaces.length);
      const workplaceId = availableWorkplaces.splice(workplaceIndex, 1)[0];

      // TODO: Установить workplace для гражданина
      // Это потребует обновления Citizen компонента
      console.log(`👔 Assigned citizen ${citizenId} to workplace ${workplaceId}`);
    }
  }

  /**
   * Регистрирует систему для автоматического обновления
   */
  registerSystem(system: System): void {
    this.systems.push(system);
    console.log(`📋 Registered system: ${system.name}`);
  }

  /**
   * Обновляет все зарегистрированные системы
   * Вызывается на каждый LogicTick
   */
  private updateSystems(delta: number): void {
    // Добавляем фиксированное количество минут за каждый тик
    this.gameTime += this.MINUTES_PER_TICK;

    // Отправляем обновление времени в UI
    this.emitTimeUpdate();

    for (const system of this.systems) {
      // Получаем сущности для этой системы
      const entities = this.queryEntities(system.components);
      system.update(this.world, entities, this.MINUTES_PER_TICK, this.gameTimeOfDay);
    }
  }

  /**
   * Запрашивает сущности по компонентам
   * TODO: Реализовать настоящий query по компонентам
   */
  private queryEntities(componentNames: readonly string[]): EntityId[] {
    // Пока что возвращаем все сущности (нужно реализовать настоящий query)
    // В будущем использовать bitecs query() с нужными компонентами
    return []; // TODO: Реализовать
  }

  /**
   * Получить фабрику сущностей
   */
  get entities(): EntityFactory {
    return this.entityFactory;
  }

  /**
   * Получить мир
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Создать сущность
   */
  createEntity(): EntityId {
    return addEntity(this.world);
  }

  /**
   * Уничтожить сущность
   */
  destroyEntity(eid: EntityId): void {
    removeEntity(this.world, eid);
  }

  /**
   * Форматирует время дня в читаемый формат HH:MM
   */
  private formatTimeOfDay(minutesOfDay: number): string {
    const hours = Math.floor(minutesOfDay / 60);
    const minutes = Math.floor(minutesOfDay % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Отправляет обновление времени в eventBus для UI
   * Использование в компонентах:
   * eventBus.on(Events.GameTimeUpdated, (data: GameTimeUpdateData) => {
   *   console.log(`Day ${data.day}, ${data.timeOfDay}`);
   * });
   */
  private emitTimeUpdate(): void {
    const day = Math.floor(this.gameTime / this.MINUTES_PER_DAY) + 1;
    const hours = Math.floor(this.gameTimeOfDay / 60);
    const minutes = Math.floor(this.gameTimeOfDay % 60);

    const timeData: GameTimeUpdateData = {
      totalMinutes: this.gameTime,
      timeOfDay: this.formatTimeOfDay(this.gameTimeOfDay),
      day,
      hour: hours,
      minute: minutes,
      minutesOfDay: this.gameTimeOfDay,
    };

    this.eventBus.emit(Events.GameTimeUpdated, timeData);
  }

  /**
   * Получить статистику симуляции
   */
  getStats(): {
    gameTime: number;
    gameTimeOfDay: string;
    day: number;
    systemsCount: number;
    systems: string[];
  } {
    const day = Math.floor(this.gameTime / this.MINUTES_PER_DAY) + 1;

    return {
      gameTime: Math.floor(this.gameTime),
      gameTimeOfDay: this.formatTimeOfDay(this.gameTimeOfDay),
      day,
      systemsCount: this.systems.length,
      systems: this.systems.map((s) => s.name),
    };
  }
}
