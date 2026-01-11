import Phaser from 'phaser';
import ModuleManager from '../modules/module_manager';
import { MainScene } from '../scenes';
import { EventBus } from '../event_bus/event_bus';
import { ECSManager } from '../ecs/ecs_manager';
import { TickManager } from '../tick/tick_manager';
import { EntrySimulation } from '../simulations/entry_simulation';
import { GameSpeeds } from '../tick/types';
import { Core } from '../core';
import { ICoreDependencies } from '../types';

// Builder для создания тестовых экземпляров Core
/** @internal Для тестирования */
export class CoreBuilder {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private dependencies: ICoreDependencies = {};

  constructor(
    phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      scene: [],
    },
  ) {
    this.phaserConfig = phaserConfig;
  }

  withPhaser(phaser: Phaser.Game): this {
    this.dependencies.phaserFactory = () => phaser;
    return this;
  }

  withEventBus(eventBus: EventBus): this {
    this.dependencies.eventBusFactory = () => eventBus;
    return this;
  }

  withTickManager(tickManager: TickManager): this {
    this.dependencies.tickManagerFactory = () => tickManager;
    return this;
  }

  withTickManagerFactory(
    factory: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager,
  ): this {
    this.dependencies.tickManagerFactory = factory;
    return this;
  }

  withECSManager(ecsManager: ECSManager): this {
    this.dependencies.ecsManagerFactory = () => ecsManager;
    return this;
  }

  withModuleManager(moduleManager: ModuleManager): this {
    this.dependencies.moduleManagerFactory = () => moduleManager;
    return this;
  }

  withEntrySimulation(entrySimulation: EntrySimulation): this {
    this.dependencies.entrySimulationFactory = () => entrySimulation;
    return this;
  }

  withPhaserFactory(factory: () => Phaser.Game): this {
    this.dependencies.phaserFactory = factory;
    return this;
  }

  withEventBusFactory(factory: () => EventBus): this {
    this.dependencies.eventBusFactory = factory;
    return this;
  }

  withECSManagerFactory(
    factory: (eventBus: EventBus, tickManager: TickManager) => ECSManager,
  ): this {
    this.dependencies.ecsManagerFactory = factory;
    return this;
  }

  withModuleManagerFactory(
    factory: (
      scene: MainScene,
      eventBus: EventBus,
      ecsManager: ECSManager | null,
      tickManager: TickManager,
    ) => ModuleManager,
  ): this {
    this.dependencies.moduleManagerFactory = factory;
    return this;
  }

  withEntrySimulationFactory(
    factory: (
      ecsManager: ECSManager,
      eventBus: EventBus,
      tickManager: TickManager,
    ) => EntrySimulation,
  ): this {
    this.dependencies.entrySimulationFactory = factory;
    return this;
  }

  build(): Core {
    return new Core(this.phaserConfig, this.dependencies);
  }
}
