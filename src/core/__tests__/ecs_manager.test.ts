import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from '../ecs_manager/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { ISystem } from '../ecs_manager/types';

// Тестируем CRUD сущностей/компонентов и выполнение систем с приоритетами/интервалами.
describe('ECSManager', () => {
  let ecs: ECSManager;
  let eventBus: EventBus;

  beforeEach(() => {
    // 1) Создаём свежий ECSManager.
    ecs = new ECSManager();
    // 2) EventBus нужен для runSystems сигнатуры.
    eventBus = new EventBus();
  });

  it('creates entities and manages components', () => {
    // Шаг 1: создаём сущность.
    const entityId = ecs.createEntity();
    // Шаг 2: добавляем компонент Name.
    ecs.addComponent(entityId, { name: 'house' }, 'Name');
    // Шаг 3: проверяем наличие сущности и компонента.
    expect(ecs.hasEntity(entityId)).toBe(true);
    expect(ecs.hasComponent(entityId, 'Name')).toBe(true);
    expect(ecs.getComponent<{ name: string }>(entityId, 'Name')?.name).toBe('house');
    // Шаг 4: удаляем компонент и проверяем отсутствие.
    ecs.removeComponent(entityId, 'Name');
    expect(ecs.hasComponent(entityId, 'Name')).toBe(false);
    // Шаг 5: уничтожаем сущность и проверяем отсутствие.
    ecs.destroyEntity(entityId);
    expect(ecs.hasEntity(entityId)).toBe(false);
  });

  it('runs systems respecting priority and updateInterval', () => {
    // Шаг 1: подготавливаем массив вызовов.
    const calls: string[] = [];
    // Шаг 2: systemA с приоритетом 2, выполняется каждый тик.
    const systemA: ISystem = {
      id: 'A',
      priority: 2,
      updateInterval: 1,
      update: () => calls.push('A'),
    };
    // Шаг 3: systemB с приоритетом 1, интервал 2 тика.
    const systemB: ISystem = {
      id: 'B',
      priority: 1,
      updateInterval: 2,
      update: () => calls.push('B'),
    };

    // Шаг 4: регистрируем системы.
    ecs.registerSystem(systemA);
    ecs.registerSystem(systemB);

    // Шаг 5: первый runSystems — B выполняется (приоритет выше), A тоже, но B ждёт интервал.
    ecs.runSystems(1, eventBus);
    // Шаг 6: второй runSystems — B снова доступна.
    ecs.runSystems(1, eventBus);

    // Шаг 7: проверяем порядок вызовов и сортировку систем.
    expect(calls).toEqual(['A', 'B', 'A']);
    expect(ecs.getAllSystems().map((s) => s.id)).toEqual(['B', 'A']);
  });
});
