import { describe, it, expect, vi } from 'vitest';

import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { ECSManager } from '../ecs_manager';
import { createECSRegistries } from '../registry/ecs_registries';
import { BaseModule } from '../../modules/extends/base_module';
import { CustomModule } from '../../modules/extends/custom_module';

class TestBase extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.id = 'test-base';
  }
}

class TestCustom extends CustomModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.id = 'test-custom';
  }
}

describe('core 9/10: изоляция и teardown', () => {
  it('два ECSManager на разных контейнерах не делят системы', () => {
    const busA = new EventBus();
    const busB = new EventBus();
    const tickA = new TickManager(busA);
    const tickB = new TickManager(busB);
    const regsA = createECSRegistries();
    const regsB = createECSRegistries();

    regsA.systems.register('only_a', (() => undefined) as never, { enabled: true });
    expect(regsB.systems.has('only_a')).toBe(false);

    const managerA = new ECSManager(busA, tickA, regsA);
    const managerB = new ECSManager(busB, tickB, regsB);
    expect(managerA.getRegistries().systems.has('only_a')).toBe(true);
    expect(managerB.getRegistries().systems.has('only_a')).toBe(false);

    managerA.destroy();
    // destroy чистит только свой контейнер
    expect(regsA.systems.size()).toBe(0);
    managerB.destroy();
  });

  it('BaseModule.destroy не эмитит событий', () => {
    const eventBus = new EventBus();
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const scene = {} as Phaser.Scene;
    const module = new TestBase(scene, eventBus, {} as ECSManager);

    module.destroy();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('CustomModule.destroy не эмитит событий', () => {
    const eventBus = new EventBus();
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const scene = {} as Phaser.Scene;
    const module = new TestCustom(scene, eventBus);

    module.destroy();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
