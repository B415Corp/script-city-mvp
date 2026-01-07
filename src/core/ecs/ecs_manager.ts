import { createWorld, addEntity, removeEntity, World, EntityId } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

import { EntityFactory } from './entities';
import { PopulationSystem, NeedsSystem, DailyRoutineSystem } from './systems/clusters';
import { System } from './systems/types';
import { GameTimeUpdateData } from './types';

export type systemsClusters = Record<number, System[]>;

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory; // Фабрика сущностей для создания новых сущностей
  private systems: System[] = []; // Системы для обновления сущностей
  private gameTime = 8 * 60; // общее игровое время в минутах (стартуем с 8:00 первого дня)
  private systemsClusters: systemsClusters = {
    1: [PopulationSystem, NeedsSystem, DailyRoutineSystem],
  };
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
