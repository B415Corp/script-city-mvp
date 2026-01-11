import Phaser from 'phaser';
import ModuleManager from './modules/module_manager';
import { MainScene } from './scenes';
import { EventBus } from './event_bus/event_bus';
import { ECSManager } from './ecs/ecs_manager';
import { TickManager } from './tick/tick_manager';
import { EntrySimulation } from './simulations/entry_simulation';
import { GameSpeeds } from './tick/types';

// Фабрики зависимостей для Dependency Injection
export interface ICoreDependencies {
  phaserFactory?: () => Phaser.Game;
  eventBusFactory?: () => EventBus;
  tickManagerFactory?: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager;
  ecsManagerFactory?: (eventBus: EventBus, tickManager: TickManager) => ECSManager;
  moduleManagerFactory?: (
    scene: MainScene,
    eventBus: EventBus,
    ecsManager: ECSManager | null,
    tickManager: TickManager,
  ) => ModuleManager;
  entrySimulationFactory?: (
    ecsManager: ECSManager,
    eventBus: EventBus,
    tickManager: TickManager,
  ) => EntrySimulation;
}
