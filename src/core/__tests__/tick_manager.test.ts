import { describe, it, expect, beforeEach } from 'vitest';
import { TickManager } from '../tick_manager/tick_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

// Тестируем управление временем: фиксированные тики, пауза/резюм, блокировки скорости.
describe('TickManager', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;

  beforeEach(() => {
    // 1) Новый EventBus.
    eventBus = new EventBus();
    // 2) Создаём TickManager с фиксированным шагом.
    tickManager = new TickManager({
      tickRate: 10,
      maxCatchUpTicks: 5,
      eventBus,
    });
    // 3) Запускаем менеджер.
    tickManager.start();
  });

  it('emits tick events with fixed-step processing', () => {
    // За 250мс при 10 tps должны пройти 2 тика с событиями начала/конца.
    const ticks: Array<{ type: Events; tick: number }> = [];

    // 1) Подписываемся на TickStarted и TickEnded.
    eventBus.on<{ tick: number }>(Events.TickStarted, (payload) => {
      ticks.push({ type: Events.TickStarted, tick: payload?.tick ?? -1 });
    });
    eventBus.on<{ tick: number }>(Events.TickEnded, (payload) => {
      ticks.push({ type: Events.TickEnded, tick: payload?.tick ?? -1 });
    });

    // 2) 250 ms at 10 tps => 2 ticks, limited by maxCatchUpTicks (5).
    tickManager.updateFromPhaser(250);

    // 3) Проверяем счётчик и накопленные события.
    expect(tickManager.getCurrentTick()).toBe(2);
    expect(ticks).toHaveLength(4);
    expect(ticks[0]).toEqual({ type: Events.TickStarted, tick: 0 });
    expect(ticks[1]).toEqual({ type: Events.TickEnded, tick: 0 });
    expect(ticks[2]).toEqual({ type: Events.TickStarted, tick: 1 });
    expect(ticks[3]).toEqual({ type: Events.TickEnded, tick: 1 });
  });

  it('pauses and resumes via speed control', () => {
    // Скорость 0 ставит на паузу, возврат к 1 возобновляет симуляцию.
    const simulationEvents: Events[] = [];
    // 1) Подписываемся на события паузы/возобновления.
    eventBus.on(Events.SimulationPaused, () => simulationEvents.push(Events.SimulationPaused));
    eventBus.on(Events.SimulationResumed, () => simulationEvents.push(Events.SimulationResumed));

    // 2) Ставим паузу и снимаем её.
    const paused = tickManager.setSpeed(0);
    const resumed = tickManager.setSpeed(1);

    // 3) Проверяем статусы и события.
    expect(paused).toBe(true);
    expect(resumed).toBe(true);
    expect(tickManager.isActive()).toBe(true);
    expect(simulationEvents).toEqual([Events.SimulationPaused, Events.SimulationResumed]);
  });

  it('locks speed changes when requested', () => {
    // Проверяем, что блокировка запрещает смену скорости до unlock.
    // 1) Ставим блокировку.
    tickManager.lockSpeedChange('ui', 'block');
    const changed = tickManager.setSpeed(3);

    // 2) Изменение заблокировано.
    expect(changed).toBe(false);
    expect(tickManager.getSpeed()).toBe(1);

    // 3) Снимаем блокировку и пробуем снова.
    tickManager.unlockSpeedChange('ui');
    const changedAfterUnlock = tickManager.setSpeed(2);
    expect(changedAfterUnlock).toBe(true);
    expect(tickManager.getSpeed()).toBe(2);
  });
});
