import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationLoop } from '../simulation_loop/simulation_loop';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import type { CommandProcessor } from '../command_processor/command_processor';
import type { ECSManager } from '../ecs_manager/ecs_manager';

// Тестируем, что SimulationLoop на TickStarted вызывает процессинг команд и систем.
describe('SimulationLoop', () => {
  let eventBus: EventBus;
  let processCommands: () => void;
  let runSystems: () => void;

  beforeEach(() => {
    // 1) Новый EventBus для изоляции.
    eventBus = new EventBus();
    // 2) Стаб для processCommands.
    processCommands = vi.fn();
    // 3) Стаб для runSystems.
    runSystems = vi.fn();
  });

  it('processes commands and runs systems on tick', () => {
    // 1) Создаём стабы зависимостей SimulationLoop.
    const processorStub: Pick<CommandProcessor, 'processCommands'> = { processCommands };
    const ecsStub: Pick<ECSManager, 'runSystems'> = { runSystems } as {
      runSystems: ECSManager['runSystems'];
    };
    // 2) Создаём SimulationLoop и подписываемся на TickStarted.
    new SimulationLoop(eventBus, processorStub as CommandProcessor, ecsStub as ECSManager);
    // 3) Эмитим TickStarted — ждём вызов процессора команд и систем.
    eventBus.emit(Events.TickStarted, { tick: 0, gameTime: 0 });
    // 4) Проверяем, что оба стаба вызваны один раз.
    expect(processCommands).toHaveBeenCalledTimes(1);
    expect(runSystems).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on destroy', () => {
    // 1) Создаём стабы и SimulationLoop.
    const processorStub: Pick<CommandProcessor, 'processCommands'> = { processCommands };
    const ecsStub: Pick<ECSManager, 'runSystems'> = { runSystems } as {
      runSystems: ECSManager['runSystems'];
    };
    const loop = new SimulationLoop(
      eventBus,
      processorStub as CommandProcessor,
      ecsStub as ECSManager,
    );
    // 2) Первый тик — вызывает стабы.
    eventBus.emit(Events.TickStarted, { tick: 1, gameTime: 1 });
    // 3) Отписываемся через destroy.
    loop.destroy();
    // 4) Второй тик не должен вызвать стабы повторно.
    eventBus.emit(Events.TickStarted, { tick: 2, gameTime: 2 });
    // 5) Убеждаемся, что вызовы только один раз.
    expect(processCommands).toHaveBeenCalledTimes(1);
    expect(runSystems).toHaveBeenCalledTimes(1);
  });
});
