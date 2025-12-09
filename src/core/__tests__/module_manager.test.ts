import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleManager } from '../module_manager/module_manager';
import { CommandRegistry } from '../command_processor/command_registry';
import type { IModule } from '../module_manager/types';
import type { ISystem } from '../ecs_manager/types';

// Тестируем топосорт зависимостей, вызовы initialize и регистрацию систем.
describe('ModuleManager', () => {
  let registry: CommandRegistry;
  let manager: ModuleManager;
  let callOrder: string[] = [];

  // Заглушка ECS с шпионом регистрации систем.
  const ecsStub = { registerSystem: vi.fn() };
  // Заглушка GameCore, которая отдаёт ECS менеджер.
  const coreStub = {
    getECSManager: () => ecsStub,
  } as unknown as import('../game_core/game_core').GameCore;

  beforeEach(() => {
    // Сбрасываем состояния перед каждым тестом.
    registry = new CommandRegistry();
    manager = new ModuleManager(registry);
    ecsStub.registerSystem.mockReset();
    callOrder = [];
  });

  // Фабрика модулей для тестов с опциональными зависимостями и ecsSystems.
  const makeModule = (
    id: string,
    dependencies: string[] = [],
    systems?: ISystem[],
  ): IModule & { ecsSystems?: ISystem[]; initializeMock: ReturnType<typeof vi.fn> } => {
    const initializeMock = vi.fn(async () => {
      // Фиксируем порядок вызовов initialize
      callOrder.push(`init:${id}`);
    });
    const module: IModule & { ecsSystems?: ISystem[]; initializeMock: typeof initializeMock } = {
      id,
      dependencies,
      initialize: initializeMock,
      destroy: vi.fn(),
      initializeMock,
    };
    // Если модуль объявил системы — добавляем их для дальнейшей регистрации
    if (systems) {
      module.ecsSystems = systems;
    }
    return module;
  };

  it('initializes modules in topological order and registers ecsSystems', async () => {
    // 1) Готовим модуль A без зависимостей и его систему.
    const systemsA: ISystem[] = [{ id: 'sysA', priority: 1, updateInterval: 1, update: vi.fn() }];
    const modA = makeModule('a', [], systemsA);
    // 2) Модуль B зависит от A.
    const modB = makeModule('b', ['a']);
    // 3) Регистрируем оба модуля в менеджере.
    manager.registerModule(modA);
    manager.registerModule(modB);
    // 4) Запускаем initializeModules — ожидаем порядок A, затем B.
    await manager.initializeModules(coreStub);
    // 5) Проверяем порядок вызовов initialize.
    expect(callOrder).toEqual(['init:a', 'init:b']);
    // 6) Убеждаемся, что система модуля A зарегистрирована в ECS.
    expect(ecsStub.registerSystem).toHaveBeenCalledWith(systemsA[0]);
    // 7) Проверяем наличие модуля в реестре.
    expect(manager.hasModule('a')).toBe(true);
  });

  it('throws on missing dependency', async () => {
    // 1) Регистрируем модуль с отсутствующей зависимостью.
    const mod = makeModule('b', ['missing']);
    manager.registerModule(mod);
    // 2) initializeModules должен бросить ошибку про отсутствующую зависимость.
    await expect(manager.initializeModules(coreStub)).rejects.toThrow('missing module "missing"');
  });

  it('throws on circular dependency', async () => {
    // 1) Регистрируем два модуля, зависящих друг от друга.
    manager.registerModule(makeModule('a', ['b']));
    manager.registerModule(makeModule('b', ['a']));
    // 2) initializeModules должен упасть из-за циклической зависимости.
    await expect(manager.initializeModules(coreStub)).rejects.toThrow('Circular dependency');
  });
});
