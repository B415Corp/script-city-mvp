import { World, EntityId } from 'bitecs';
import { EventBus } from '../../../event_bus/event_bus';
import { Events } from '../../../event_bus/events';
import { CallSystemPayload } from '../../../event_bus/types';
import { System } from '../types';
import { TimeService } from '../../../tick/time_service';
import { Schedule, DayPhase, Activity, DEFAULT_SCHEDULES, EntityType } from '../../components';
import { Logger } from '../../../utils/logger';

const logger = Logger.create('DayNightCycleSystem');

/**
 * Система управления циклом дня и ночи
 * Управляет расписаниями сущностей и вызывает соответствующие системы в нужное время
 */
export class DayNightCycleSystem implements System {
  name = 'DayNightCycle';
  components = ['Schedule']; // Требует компонент Schedule

  private currentPhase: DayPhase = 'dawn';
  private eventBus: EventBus;
  private timeService: TimeService;

  constructor(eventBus: EventBus, timeService: TimeService) {
    this.eventBus = eventBus;
    this.timeService = timeService;
  }

  update(world: World, entities: readonly EntityId[], delta?: number): void {
    // Получаем текущее время дня (0-1439 минут)
    const timeOfDay = this.getCurrentTimeOfDay();

    // Определяем текущую фазу дня
    const newPhase = this.getDayPhase(timeOfDay);

    // Проверяем, сменилась ли фаза
    if (newPhase !== this.currentPhase) {
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
    return this.timeService.getMinutesOfDay();
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
    // Уведомляем каждую сущность о смене фазы
    for (const eid of entities) {
      this.notifyEntityOfPhaseChange(eid, newPhase, timeOfDay);
    }
  }

  /**
   * Уведомить сущность о смене фазы дня
   */
  private notifyEntityOfPhaseChange(eid: EntityId, phase: DayPhase, timeOfDay: number): void {
    // Используем DEFAULT_SCHEDULES вместо phaseSchedule из компонента
    const entityType = Schedule.entityType[eid] as EntityType || 'citizen';
    const defaultSchedule = DEFAULT_SCHEDULES[entityType];

    if (!defaultSchedule || !defaultSchedule[phase]) {
      return; // Нет расписания для этой фазы
    }

    // Устанавливаем текущую фазу для сущности
    const phaseIndex = DAY_PHASES[phase];
    Schedule.currentPhase[eid] = phaseIndex;

    const activity = defaultSchedule[phase];

    // TODO: Применяем модификаторы расписания (пока возвращаем как есть)
    const modifiedActivity = activity; // this.applyScheduleModifiers(eid, activity, phase);

    // Запускаем активность
    this.startEntityActivity(eid, modifiedActivity, timeOfDay, phase);
  }

  /**
   * Применить модификаторы расписания к активности
   */
  // TODO: Реализовать после добавления поля modifiers в компонент Schedule
  // private applyScheduleModifiers(eid: EntityId, activity: Activity, phase: DayPhase): Activity {
  //   const modifiers = Schedule.modifiers[eid] || [];
  //   let modifiedActivity = { ...activity };

  //   // Сортируем модификаторы по приоритету (выше = важнее)
  //   const sortedModifiers = modifiers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  //   for (const modifier of sortedModifiers) {
  //     if (!this.checkModifierCondition(eid, modifier.condition)) {
  //       continue; // Условие не выполнено
  //     }

  //     switch (modifier.type) {
  //       case 'delay':
  //         // Увеличиваем длительность (задержка)
  //         modifiedActivity.duration += modifier.value;
  //         break;

  //       case 'speed_up':
  //         // Уменьшаем длительность (ускорение)
  //         modifiedActivity.duration = Math.max(1, modifiedActivity.duration * modifier.value);
  //         break;

  //       case 'skip':
  //         // Пропускаем активность
  //         if (modifier.value > 0) {
  //           modifiedActivity.activity = 'idle';
  //           modifiedActivity.system = undefined;
  //         }
  //         break;

  //       case 'repeat':
  //         // Повторяем активность (пока не реализовано)
  //         break;
  //     }
  //   }

  //   return modifiedActivity;
  // }

  /**
   * Проверить условие модификатора
   * TODO: Реализовать после добавления поля modifiers в компонент Schedule
   */
  // private checkModifierCondition(eid: EntityId, condition: string): boolean {
  //   // В реальной игре здесь будут проверки компонентов
  //   // Например: energy_low, hunger_high, sick, etc.
  //   switch (condition) {
  //     case 'always':
  //       return true;
  //     case 'never':
  //       return false;
  //     // Здесь будут добавлены реальные условия
  //     default:
  //       console.warn(`Unknown condition: ${condition}`);
  //       return false;
  //   }
  // }

  /**
   * Запустить активность для сущности
   */
  private startEntityActivity(
    eid: EntityId,
    activity: Activity,
    timeOfDay: number,
    phase: DayPhase,
  ): void {
    // Обновляем текущую активность (индекс активности)
    const activityIndex = ACTIVITIES[activity.activity] || 0;
    Schedule.currentActivity[eid] = activityIndex;

    // Вычисляем время окончания активности
    const endTime = (timeOfDay + activity.duration) % (24 * 60);
    Schedule.nextActivityTime[eid] = endTime;

    // Вызываем соответствующую систему через EventBus
    if (activity.system) {
      const payload: CallSystemPayload = {
        systemName: activity.system,
        entityId: eid,
        extraData: this.timeService,
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
    // Определяем следующую фазу
    const currentPhase = this.getDayPhase(timeOfDay);
    const nextPhase = this.getNextPhase(currentPhase);

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
    // Просто устанавливаем тип сущности - расписание берется из DEFAULT_SCHEDULES
    Schedule.entityType[eid] = entityType === 'citizen' ? 0 : 0; // Пока только citizen поддерживается
    Schedule.currentPhase[eid] = 0; // dawn
    Schedule.currentActivity[eid] = 0; // idle
    Schedule.activityExecuted[eid] = 0;
    Schedule.nextActivityTime[eid] = 0;

    logger.info(`Initialized schedule for ${entityType} entity ${eid}`);
  }
  }

  /**
   * Добавить модификатор расписания
   * TODO: Реализовать после добавления поля modifiers в компонент Schedule
   */
  // addScheduleModifier(eid: EntityId, modifier: import('../../components').ScheduleModifier): void {
  //   if (!Schedule.modifiers[eid]) {
  //     Schedule.modifiers[eid] = [];
  //   }
  //   Schedule.modifiers[eid].push(modifier);
  // }

  /**
   * Удалить модификатор расписания
   * TODO: Реализовать после добавления поля modifiers в компонент Schedule
   */
  // removeScheduleModifier(eid: EntityId, condition: string): void {
  //   if (Schedule.modifiers[eid]) {
  //     Schedule.modifiers[eid] = Schedule.modifiers[eid].filter(
  //       (mod) => mod.condition !== condition,
  //     );
  //   }
  // }

// Экспортируем фабричную функцию для создания системы
export const createDayNightCycleSystem = (eventBus: EventBus, timeService: TimeService) =>
  new DayNightCycleSystem(eventBus, timeService);
