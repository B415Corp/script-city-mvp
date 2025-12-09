import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import {
  BuildBuildingCommandHandler,
  BulldozeAreaCommandHandler,
  ChangeTaxRateCommandHandler,
  SetPolicyCommandHandler,
  SetSimulationSpeedCommandHandler,
  ZoneTileCommandHandler,
  RemoveZoneCommandHandler,
} from '../command_processor/handlers';
import type {
  BuildBuildingCommand,
  BulldozeAreaCommand,
  ChangeTaxRateCommand,
  SetPolicyCommand,
  SetSimulationSpeedCommand,
  ZoneTileCommand,
  RemoveZoneCommand,
} from '../command_processor/types';

// Тестируем валидацию и публикацию событий каждым хэндлером.
describe('Command Handlers', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Новый EventBus для изоляции тестов
    eventBus = new EventBus();
  });

  it('BuildBuilding: validates position/type and emits BuildCommandRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new BuildBuildingCommandHandler(eventBus);
    // 2) Проверяем невалидный ввод (без позиции и типа).
    const invalid = handler.validate({
      type: 'BuildBuilding',
      timestamp: 1,
    } as unknown as BuildBuildingCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписываемся на событие результата.
    let payload: unknown;
    eventBus.once(Events.BuildCommandRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'BuildBuilding',
      timestamp: 1,
      position: { x: 1, y: 2 },
      buildingType: 'house',
    } as BuildBuildingCommand);
    // 5) Проверяем, что событие отправлено с правильным payload.
    expect(payload).toEqual({ position: { x: 1, y: 2 }, buildingType: 'house' });
  });

  it('BulldozeArea: validates area and emits DemolishCommandRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new BulldozeAreaCommandHandler(eventBus);
    // 2) Проверяем невалидный ввод (нет area).
    const invalid = handler.validate({
      type: 'BulldozeArea',
      timestamp: 1,
    } as unknown as BulldozeAreaCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.DemolishCommandRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'BulldozeArea',
      timestamp: 1,
      area: { x: 0, y: 0, width: 2, height: 3 },
    } as BulldozeAreaCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ area: { x: 0, y: 0, width: 2, height: 3 } });
  });

  it('ChangeTaxRate: validates bounds and emits ChangeTaxRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new ChangeTaxRateCommandHandler(eventBus);
    // 2) Проверяем невалидный newRate > 1.
    const invalid = handler.validate({
      type: 'ChangeTaxRate',
      timestamp: 1,
      taxType: 'a',
      newRate: 2,
    } as unknown as ChangeTaxRateCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.ChangeTaxRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'ChangeTaxRate',
      timestamp: 1,
      taxType: 'income',
      newRate: 0.2,
    } as ChangeTaxRateCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ taxType: 'income', newRate: 0.2 });
  });

  it('SetPolicy: validates and emits PolicyChangeRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new SetPolicyCommandHandler(eventBus);
    // 2) Проверяем невалидный policyId.
    const invalid = handler.validate({
      type: 'SetPolicy',
      timestamp: 1,
      policyId: '',
      enabled: true,
    } as unknown as SetPolicyCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.PolicyChangeRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'SetPolicy',
      timestamp: 1,
      policyId: 'p1',
      enabled: true,
    } as SetPolicyCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ policyId: 'p1', enabled: true });
  });

  it('SetSimulationSpeed: validates non-negative and emits SetSimulationSpeedRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new SetSimulationSpeedCommandHandler(eventBus);
    // 2) Проверяем невалидное отрицательное значение.
    const invalid = handler.validate({
      type: 'SetSimulationSpeed',
      timestamp: 1,
      speedLevel: -1,
    } as unknown as SetSimulationSpeedCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.SetSimulationSpeedRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'SetSimulationSpeed',
      timestamp: 1,
      speedLevel: 2,
    } as SetSimulationSpeedCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ speedLevel: 2 });
  });

  it('ZoneTile: validates allowed zone types and emits ZoneTileRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new ZoneTileCommandHandler(eventBus);
    // 2) Проверяем невалидный zoneType.
    const invalid = handler.validate({
      type: 'ZoneTile',
      timestamp: 1,
      position: { x: 1, y: 1 },
      zoneType: 'bad',
    } as unknown as ZoneTileCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.ZoneTileRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'ZoneTile',
      timestamp: 1,
      position: { x: 3, y: 4 },
      zoneType: 'residential_low',
    } as ZoneTileCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ position: { x: 3, y: 4 }, zoneType: 'residential_low' });
  });

  it('RemoveZone: validates position and emits RemoveZoneRequested', () => {
    // 1) Создаём хэндлер.
    const handler = new RemoveZoneCommandHandler(eventBus);
    // 2) Проверяем невалидный ввод без позиции.
    const invalid = handler.validate({
      type: 'RemoveZone',
      timestamp: 1,
    } as unknown as RemoveZoneCommand);
    expect(invalid.valid).toBe(false);
    // 3) Подписка на событие.
    let payload: unknown;
    eventBus.once(Events.RemoveZoneRequested, (p) => (payload = p));
    // 4) Применяем валидную команду.
    handler.apply({
      type: 'RemoveZone',
      timestamp: 1,
      position: { x: 7, y: 8 },
    } as RemoveZoneCommand);
    // 5) Проверяем payload.
    expect(payload).toEqual({ position: { x: 7, y: 8 } });
  });
});
