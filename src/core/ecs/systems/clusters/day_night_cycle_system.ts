import { World, EntityId } from 'bitecs';
import { EventBus } from '../../../event_bus/event_bus';
import { Events } from '../../../event_bus/events';
import { CallSystemPayload } from '../../../event_bus/types';
import { System } from '../types';
import { Schedule, DayPhase, Activity, DEFAULT_SCHEDULES, EntityType } from '../../components';

/**
 * Система управления циклом дня и ночи
 * Управляет расписаниями сущностей и вызывает соответствующие системы в нужное время
 */
export class DayNightCycleSystem implements System {
  name = 'DayNightCycle';
  components = ['Schedule']; // Требует компонент Schedule

  private currentPhase: DayPhase = 'dawn';
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  update(world: World, entities: readonly EntityId[], delta?: number): void {
    // Получаем текущее время дня (0-1439 минут)
    const timeOfDay = this.getCurrentTimeOfDay();

    // Определяем текущую фазу дня
    const newPhase = this.getDayPhase(timeOfDay);

    // Проверяем, сменилась ли фаза
    if (newPhase !== this.currentPhase) {
      console.log(
        `🌅 Phase transition: ${this.currentPhase} → ${newPhase} at ${this.formatTime(timeOfDay)}`,
      );
      this.onPhaseChange(entities, newPhase, timeOfDay);
      this.currentPhase = newPhase;
    }

    // Проверяем внутренние таймеры сущностей
    this.checkEntityTimers(entities, timeOfDay);
  }

  /**
   * Получить текущее время дня в минутах
   */
  private getCurrentTimeOfDay(): number {
    // В реальной игре это должно приходить из TimeController
    // Пока используем заглушку
    const now = Date.now();
    const minutesSinceMidnight = (now % (24 * 60 * 60 * 1000)) / (60 * 1000);
    return Math.floor(minutesSinceMidnight);
  }

  /**
   * Определить фазу дня по времени
   */
  private getDayPhase(timeOfDay: number): DayPhase {
    if (timeOfDay >= 0 && timeOfDay < 6 * 60) return 'dawn'; // 00:00 - 06:00
    if (timeOfDay >= 6 * 60 && timeOfDay < 12 * 60) return 'morning'; // 06:00 - 12:00
    if (timeOfDay >= 12 * 60 && timeOfDay < 18 * 60) return 'day'; // 12:00 - 18:00
    if (timeOfDay >= 18 * 60 && timeOfDay < 22 * 60) return 'evening'; // 18:00 - 22:00
    return 'night'; // 22:00 - 24:00
  }

  /**
   * Обработчик смены фазы дня
   */
  private onPhaseChange(
    entities: readonly EntityId[],
    newPhase: DayPhase,
    timeOfDay: number,
  ): void {
    console.log(`🌅 Starting ${newPhase} phase for ${entities.length} entities`);

    // Уведомляем каждую сущность о смене фазы
    for (const eid of entities) {
      this.notifyEntityOfPhaseChange(eid, newPhase, timeOfDay);
    }
  }

  /**
   * Уведомить сущность о смене фазы дня
   */
  private notifyEntityOfPhaseChange(eid: EntityId, phase: DayPhase, timeOfDay: number): void {
    const phaseSchedule = Schedule.phaseSchedule[eid];
    if (!phaseSchedule || !phaseSchedule[phase]) {
      return; // Нет расписания для этой фазы
    }

    // Устанавливаем текущую фазу для сущности
    Schedule.currentPhase[eid] = phase;

    const activity = phaseSchedule[phase];

    // Применяем модификаторы расписания
    const modifiedActivity = this.applyScheduleModifiers(eid, activity, phase);

    // Запускаем активность
    this.startEntityActivity(eid, modifiedActivity, timeOfDay, phase);
  }

  /**
   * Применить модификаторы расписания к активности
   */
  private applyScheduleModifiers(eid: EntityId, activity: Activity, phase: DayPhase): Activity {
    const modifiers = Schedule.modifiers[eid] || [];
    let modifiedActivity = { ...activity };

    // Сортируем модификаторы по приоритету (выше = важнее)
    const sortedModifiers = modifiers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const modifier of sortedModifiers) {
      if (!this.checkModifierCondition(eid, modifier.condition)) {
        continue; // Условие не выполнено
      }

      switch (modifier.type) {
        case 'delay':
          // Увеличиваем длительность (задержка)
          modifiedActivity.duration += modifier.value;
          break;

        case 'speed_up':
          // Уменьшаем длительность (ускорение)
          modifiedActivity.duration = Math.max(1, modifiedActivity.duration * modifier.value);
          break;

        case 'skip':
          // Пропускаем активность
          if (modifier.value > 0) {
            modifiedActivity.activity = 'idle';
            modifiedActivity.system = undefined;
          }
          break;

        case 'repeat':
          // Повторяем активность (пока не реализовано)
          break;
      }
    }

    return modifiedActivity;
  }

  /**
   * Проверить условие модификатора
   */
  private checkModifierCondition(eid: EntityId, condition: string): boolean {
    // В реальной игре здесь будут проверки компонентов
    // Например: energy_low, hunger_high, sick, etc.
    switch (condition) {
      case 'always':
        return true;
      case 'never':
        return false;
      // Здесь будут добавлены реальные условия
      default:
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  }

  /**
   * Запустить активность для сущности
   */
  private startEntityActivity(
    eid: EntityId,
    activity: Activity,
    timeOfDay: number,
    phase: DayPhase,
  ): void {
    // Обновляем текущую активность
    Schedule.currentActivity[eid] = activity.activity;

    // Вычисляем время окончания активности
    const endTime = (timeOfDay + activity.duration) % (24 * 60);
    Schedule.nextActivityTime[eid] = endTime;

    console.log(
      `🚀 Entity ${eid} starting: ${activity.activity} (duration: ${activity.duration}min, ends at ${this.formatTime(endTime)})`,
    );

    // Вызываем соответствующую систему через EventBus
    if (activity.system) {
      const payload: CallSystemPayload = {
        systemName: activity.system,
        entityId: eid,
        extraData: {
          activity: activity.activity,
          phase,
          duration: activity.duration,
          params: activity.params,
        },
      };

      this.eventBus.emit(Events.CallSystem, payload);
    }
  }

  /**
   * Проверить внутренние таймеры сущностей
   */
  private checkEntityTimers(entities: readonly EntityId[], timeOfDay: number): void {
    for (const eid of entities) {
      const nextActivityTime = Schedule.nextActivityTime[eid];

      // Проверяем, не пора ли переходить к следующей активности
      if (timeOfDay >= nextActivityTime && Schedule.currentActivity[eid]) {
        this.advanceEntitySchedule(eid, timeOfDay);
      }
    }
  }

  /**
   * Перевести сущность к следующей активности
   */
  private advanceEntitySchedule(eid: EntityId, timeOfDay: number): void {
    const phaseSchedule = Schedule.phaseSchedule[eid];
    if (!phaseSchedule) return;

    // Определяем следующую фазу
    const currentPhase = this.getDayPhase(timeOfDay);
    const nextPhase = this.getNextPhase(currentPhase);

    console.log(`🔄 Entity ${eid} advancing from ${currentPhase} to ${nextPhase} phase`);

    // Запускаем активность следующей фазы
    this.notifyEntityOfPhaseChange(eid, nextPhase, timeOfDay);
  }

  /**
   * Получить следующую фазу дня
   */
  private getNextPhase(currentPhase: DayPhase): DayPhase {
    const phases: DayPhase[] = ['dawn', 'morning', 'day', 'evening', 'night'];
    const currentIndex = phases.indexOf(currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    return phases[nextIndex];
  }

  /**
   * Форматировать время для логов
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Инициализировать расписание для сущности
   */
  initializeEntitySchedule(eid: EntityId, entityType: EntityType): void {
    const defaultSchedule = DEFAULT_SCHEDULES[entityType];

    if (defaultSchedule) {
      Schedule.phaseSchedule[eid] = { ...defaultSchedule };
      Schedule.entityType[eid] = entityType;
      Schedule.modifiers[eid] = [];
      Schedule.currentActivity[eid] = '';
      Schedule.nextActivityTime[eid] = 0;

      console.log(`📅 Initialized schedule for ${entityType} entity ${eid}`);
    } else {
      console.warn(`No default schedule found for entity type: ${entityType}`);
    }
  }

  /**
   * Добавить модификатор расписания
   */
  addScheduleModifier(eid: EntityId, modifier: import('../../components').ScheduleModifier): void {
    if (!Schedule.modifiers[eid]) {
      Schedule.modifiers[eid] = [];
    }
    Schedule.modifiers[eid].push(modifier);
  }

  /**
   * Удалить модификатор расписания
   */
  removeScheduleModifier(eid: EntityId, condition: string): void {
    if (Schedule.modifiers[eid]) {
      Schedule.modifiers[eid] = Schedule.modifiers[eid].filter(
        (mod) => mod.condition !== condition,
      );
    }
  }
}

// Экспортируем экземпляр системы (будет создан в ECSManager)
export const createDayNightCycleSystem = (eventBus: EventBus) => new DayNightCycleSystem(eventBus);
