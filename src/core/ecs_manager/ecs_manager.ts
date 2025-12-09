import { EventBus } from '../event_bus/event_bus';
import { ComponentType, EntityId, ISystem } from './types';
import { debugLog, debugGroup, debugGroupEnd } from '@/infrastructure/utils/logger';
import { ISnapshotProvider, BaseSnapshotProvider } from '../save_manager/snapshot_provider';
import { ECSData, SerializedComponents } from '../save_manager/types';

/**
 * Менеджер Entity Component System (ECS) архитектуры.
 *
 * Управляет сущностями, компонентами и системами игры.
 * Обеспечивает изоляцию данных между системами и поддерживает
 * разные частоты обновления систем.
 *
 * **Теги**: `arch:ecs`, `arch:core`, `tech:ecs`
 *
 * @example
 * const ecs = new ECSManager();
 * const entityId = ecs.createEntity();
 * ecs.addComponent(entityId, { x: 10, y: 20 }, 'Position');
 * const position = ecs.getComponent(entityId, 'Position');
 */
export class ECSManager
  extends BaseSnapshotProvider<ECSData>
  implements ISnapshotProvider<ECSData>
{
  /**
   * Реестр всех сущностей в игре.
   * Используется для быстрой проверки существования сущности.
   */
  private entities: Set<EntityId> = new Set();

  /**
   * Хранилище компонентов.
   * Ключ первого уровня - ID сущности, ключ второго уровня - тип компонента.
   */
  private components: Map<EntityId, Map<ComponentType, unknown>> = new Map();

  /**
   * Реестр систем.
   * Ключ - ID системы, значение - система.
   */
  private systems: Map<string, ISystem> = new Map();

  /**
   * Отсортированный массив систем для быстрого доступа в порядке приоритета.
   * Обновляется при регистрации/удалении систем.
   */
  private sortedSystems: ISystem[] = [];

  /**
   * Счётчик тиков для отслеживания интервалов обновления систем.
   * Ключ - ID системы, значение - количество тиков с последнего обновления.
   */
  private systemTickCounters: Map<string, number> = new Map();

  /**
   * Счётчик для генерации уникальных ID сущностей.
   */
  private entityIdCounter: number = 0;

  /**
   * Создаёт новый экземпляр ECSManager.
   */
  constructor() {
    super();
    debugLog('🎮 ECSManager создан');
  }

  // ==================== ISnapshotProvider implementation ====================

  readonly snapshotVersion = '1.0.0';

  createSnapshot(): ECSData {
    // Получить все сущности
    const entities = this.getAllEntities();

    // Получить все компоненты
    const serializedComponents: SerializedComponents = {};

    // Сериализовать все компоненты
    for (const entityId of entities) {
      // Получить все компоненты для сущности
      const entityComponents = this.getAllComponentsForEntity(entityId);

      // Если сущность имеет компоненты, сериализовать их
      if (entityComponents.size > 0) {
        serializedComponents[entityId] = {};

        // Сериализовать все компоненты
        for (const [componentType, componentData] of entityComponents) {
          // Преобразуем Symbol в строку
          const componentKey =
            typeof componentType === 'symbol' ? componentType.toString() : String(componentType);

          // Сериализовать компонент безопасно (удаляем функции и несериализуемые объекты)
          try {
            // JSON.parse(JSON.stringify()) автоматически убирает функции, undefined, символы
            // и другие типы, которые не поддерживаются IndexedDB
            serializedComponents[entityId][componentKey] = JSON.parse(
              JSON.stringify(componentData),
            );
          } catch (error) {
            debugLog(
              `ECSManager: не удалось сериализовать компонент "${componentKey}" для сущности ${entityId}`,
              { error },
            );
            // Пропускаем проблемный компонент - он не будет сохранён
          }
        }
      }
    }

    return {
      entities: Array.from(entities),
      entityIdCounter: this.entityIdCounter,
      components: serializedComponents,
    };
  }

  restoreFromSnapshot(snapshot: ECSData, version: string): void {
    if (!this.isSnapshotCompatible(version)) {
      if (this.migrateSnapshot) {
        const migratedSnapshot = this.migrateSnapshot(snapshot, version);
        return this.restoreFromSnapshot(migratedSnapshot, this.snapshotVersion);
      }
      throw new Error(`Incompatible snapshot version: ${version}`);
    }

    // Очищаем текущее состояние ECS
    this.clear();

    // Восстанавливаем счетчик ID сущностей
    this.entityIdCounter = snapshot.entityIdCounter;

    // Восстанавливаем компоненты для каждой сущности
    for (const entityId of snapshot.entities) {
      const entityComponents = snapshot.components[entityId.toString()];
      if (entityComponents) {
        for (const [componentType, componentData] of Object.entries(entityComponents)) {
          // Преобразуем строку обратно в Symbol если нужно
          const componentKey: string | symbol = componentType.startsWith('Symbol(')
            ? Symbol(componentType.slice(7, -1))
            : componentType;

          this.addComponent(entityId, componentData, componentKey);
        }
      }
    }
  }

  // ==================== Управление сущностями ====================

  /**
   * Создаёт новую сущность и возвращает её уникальный идентификатор.
   *
   * @returns Уникальный идентификатор созданной сущности
   *
   * @example
   * const entityId = ecs.createEntity();
   * console.log(entityId); // 0, 1, 2, ...
   */
  createEntity(): EntityId {
    const entityId = this.entityIdCounter++;
    this.entities.add(entityId);
    // Инициализируем пустое хранилище компонентов для этой сущности
    if (!this.components.has(entityId)) {
      this.components.set(entityId, new Map());
    }
    debugLog('🎮 ECSManager: сущность создана', { entityId });
    return entityId;
  }

  /**
   * Удаляет сущность и все её компоненты.
   *
   * @param id - Идентификатор сущности для удаления
   *
   * @example
   * const entityId = ecs.createEntity();
   * ecs.destroyEntity(entityId);
   * ecs.hasEntity(entityId); // false
   */
  destroyEntity(id: EntityId): void {
    if (!this.entities.has(id)) {
      debugLog('🎮 ECSManager: попытка удалить несуществующую сущность', { entityId: id });
      return;
    }

    // Удаляем все компоненты сущности
    this.components.delete(id);
    // Удаляем сущность из реестра
    this.entities.delete(id);
    debugLog('🎮 ECSManager: сущность удалена', { entityId: id });
  }

  /**
   * Проверяет существование сущности.
   *
   * @param id - Идентификатор сущности для проверки
   * @returns `true`, если сущность существует, иначе `false`
   *
   * @example
   * const entityId = ecs.createEntity();
   * ecs.hasEntity(entityId); // true
   * ecs.hasEntity(999); // false
   */
  hasEntity(id: EntityId): boolean {
    return this.entities.has(id);
  }

  /**
   * Возвращает массив всех существующих сущностей.
   *
   * @returns Массив идентификаторов всех сущностей
   *
   * @example
   * const entity1 = ecs.createEntity();
   * const entity2 = ecs.createEntity();
   * const allEntities = ecs.getAllEntities(); // [0, 1]
   */
  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  // ==================== Управление компонентами ====================

  /**
   * Добавляет компонент к сущности.
   *
   * Если компонент такого типа уже существует у сущности, он будет заменён.
   *
   * @param entityId - Идентификатор сущности
   * @param component - Компонент для добавления
   * @param componentType - Тип компонента (строка или символ)
   *
   * @example
   * const entityId = ecs.createEntity();
   * ecs.addComponent(entityId, { x: 10, y: 20 }, 'Position');
   */
  addComponent<T>(entityId: EntityId, component: T, componentType: ComponentType): void {
    if (!this.entities.has(entityId)) {
      console.warn(`ECSManager: попытка добавить компонент к несуществующей сущности ${entityId}`);
      return;
    }

    const entityComponents = this.components.get(entityId);
    if (!entityComponents) {
      this.components.set(entityId, new Map());
    }

    const componentTypeStr =
      typeof componentType === 'symbol' ? componentType.toString() : componentType;
    const isReplacement = this.components.get(entityId)!.has(componentType);
    this.components.get(entityId)!.set(componentType, component);
    debugLog('🎮 ECSManager: компонент добавлен', {
      entityId,
      componentType: componentTypeStr,
      isReplacement,
    });
  }

  /**
   * Удаляет компонент у сущности.
   *
   * @param entityId - Идентификатор сущности
   * @param componentType - Тип компонента для удаления
   *
   * @example
   * ecs.removeComponent(entityId, 'Position');
   */
  removeComponent(entityId: EntityId, componentType: ComponentType): void {
    if (!this.entities.has(entityId)) {
      return;
    }

    const entityComponents = this.components.get(entityId);
    if (entityComponents) {
      const componentTypeStr =
        typeof componentType === 'symbol' ? componentType.toString() : componentType;
      entityComponents.delete(componentType);
      debugLog('🎮 ECSManager: компонент удалён', { entityId, componentType: componentTypeStr });
    }
  }

  /**
   * Получает компонент сущности по типу.
   *
   * @param entityId - Идентификатор сущности
   * @param componentType - Тип компонента
   * @returns Компонент или `null`, если компонент не найден
   *
   * @example
   * const position = ecs.getComponent<{ x: number; y: number }>(entityId, 'Position');
   * if (position) {
   *   console.log(position.x, position.y);
   * }
   */
  getComponent<T>(entityId: EntityId, componentType: ComponentType): T | null {
    if (!this.entities.has(entityId)) {
      return null;
    }

    const entityComponents = this.components.get(entityId);
    if (!entityComponents) {
      return null;
    }

    const component = entityComponents.get(componentType);
    return (component as T) ?? null;
  }

  /**
   * Проверяет наличие компонента у сущности.
   *
   * @param entityId - Идентификатор сущности
   * @param componentType - Тип компонента для проверки
   * @returns `true`, если компонент существует, иначе `false`
   *
   * @example
   * if (ecs.hasComponent(entityId, 'Position')) {
   *   // сущность имеет компонент Position
   * }
   */
  hasComponent(entityId: EntityId, componentType: ComponentType): boolean {
    if (!this.entities.has(entityId)) {
      return false;
    }

    const entityComponents = this.components.get(entityId);
    if (!entityComponents) {
      return false;
    }

    return entityComponents.has(componentType);
  }

  /**
   * Возвращает массив всех сущностей, имеющих компонент указанного типа.
   *
   * @param componentType - Тип компонента для поиска
   * @returns Массив идентификаторов сущностей с данным компонентом
   *
   * @example
   * const entitiesWithPosition = ecs.getEntitiesWithComponent('Position');
   * for (const entityId of entitiesWithPosition) {
   *   const position = ecs.getComponent(entityId, 'Position');
   *   // обработка позиции
   * }
   */
  getEntitiesWithComponent(componentType: ComponentType): EntityId[] {
    const result: EntityId[] = [];

    for (const [entityId, entityComponents] of this.components.entries()) {
      if (entityComponents.has(componentType)) {
        result.push(entityId);
      }
    }

    return result;
  }

  /**
   * Возвращает Map всех компонентов для указанной сущности.
   *
   * @param entityId - Идентификатор сущности
   * @returns Map с компонентами сущности или пустая Map, если компонентов нет
   *
   * @example
   * const components = ecs.getAllComponentsForEntity(entityId);
   * for (const [type, data] of components) {
   *   console.log(type, data);
   * }
   */
  getAllComponentsForEntity(entityId: EntityId): Map<ComponentType, unknown> {
    if (!this.entities.has(entityId)) {
      return new Map();
    }

    return this.components.get(entityId) ?? new Map();
  }

  // ==================== Управление системами ====================

  /**
   * Регистрирует систему в менеджере.
   *
   * Системы выполняются в порядке приоритета (меньшее число = выше приоритет).
   * Если система с таким ID уже зарегистрирована, она будет заменена.
   *
   * @param system - Система для регистрации
   * @param priority - Опциональный приоритет (перезаписывает приоритет системы)
   *
   * @example
   * const system: ISystem = {
   *   id: 'PopulationSystem',
   *   priority: 1,
   *   updateInterval: 1,
   *   update: (deltaTime, ecs, eventBus) => {
   *     // логика системы
   *   }
   * };
   * ecs.registerSystem(system);
   */
  registerSystem(system: ISystem, priority?: number): void {
    if (priority !== undefined) {
      system.priority = priority;
    }

    const isReplacement = this.systems.has(system.id);
    this.systems.set(system.id, system);
    this.systemTickCounters.set(system.id, 0);
    this.updateSortedSystems();
    debugLog('🎮 ECSManager: система зарегистрирована', {
      systemId: system.id,
      priority: system.priority,
      updateInterval: system.updateInterval,
      isReplacement,
    });
  }

  /**
   * Удаляет систему из реестра.
   *
   * @param systemId - ID системы для удаления
   *
   * @example
   * ecs.unregisterSystem('PopulationSystem');
   */
  unregisterSystem(systemId: string): void {
    const existed = this.systems.has(systemId);
    this.systems.delete(systemId);
    this.systemTickCounters.delete(systemId);
    this.updateSortedSystems();
    if (existed) {
      debugLog('🎮 ECSManager: система удалена', { systemId });
    }
  }

  /**
   * Получает систему по ID.
   *
   * @param systemId - ID системы
   * @returns Система или `null`, если система не найдена
   *
   * @example
   * const system = ecs.getSystem('PopulationSystem');
   * if (system) {
   *   console.log(system.id, system.priority);
   * }
   */
  getSystem(systemId: string): ISystem | null {
    return this.systems.get(systemId) ?? null;
  }

  /**
   * Запускает все зарегистрированные системы в порядке приоритета.
   *
   * Системы обновляются с учётом их `updateInterval`:
   * система обновляется только если прошло достаточно тиков с последнего обновления.
   *
   * @param deltaTime - Время, прошедшее с последнего обновления (в тиках)
   * @param eventBus - Событийная шина для передачи системам
   *
   * @example
   * // Вызывается из TickManager в начале каждого тика
   * ecs.runSystems(1, eventBus);
   */
  runSystems(deltaTime: number, eventBus: EventBus): void {
    for (const system of this.sortedSystems) {
      // Получаем счётчик тиков для этой системы
      let tickCounter = this.systemTickCounters.get(system.id) ?? 0;
      tickCounter += deltaTime;

      // Проверяем, нужно ли обновлять систему
      if (tickCounter >= system.updateInterval) {
        try {
          system.update(deltaTime, this, eventBus);
          // Сбрасываем счётчик после обновления
          tickCounter = 0;
        } catch (error) {
          console.error(`Error in system "${system.id}":`, error);
        }
      }

      // Сохраняем обновлённый счётчик
      this.systemTickCounters.set(system.id, tickCounter);
    }
  }

  /**
   * Очищает все сущности, компоненты и системы.
   *
   * Используется при полной очистке игры (например, при перезапуске).
   *
   * @example
   * ecs.clear(); // удаляет все сущности, компоненты и системы
   */
  clear(): void {
    debugGroup('🎮 ECSManager: очистка');
    const entitiesCount = this.entities.size;
    const systemsCount = this.systems.size;
    this.entities.clear();
    this.components.clear();
    this.systems.clear();
    this.sortedSystems = [];
    this.systemTickCounters.clear();
    this.entityIdCounter = 0;
    debugLog('ECSManager очищен', { entitiesCount, systemsCount });
    debugGroupEnd();
  }

  public getEntityIdCounter(): number {
    return this.entityIdCounter;
  }

  public setEntityIdCounter(counter: number): void {
    this.entityIdCounter = counter;
  }

  /**
   * Возвращает массив всех зарегистрированных систем.
   *
   * @returns Массив систем в порядке приоритета
   *
   * @example
   * const systems = ecs.getAllSystems();
   * console.log(`Registered systems: ${systems.length}`);
   */
  public getAllSystems(): ISystem[] {
    return this.sortedSystems;
  }

  // ==================== Внутренние методы ====================

  /**
   * Обновляет отсортированный массив систем по приоритету.
   * Вызывается автоматически при регистрации/удалении систем.
   */
  private updateSortedSystems(): void {
    this.sortedSystems = Array.from(this.systems.values()).sort((a, b) => a.priority - b.priority);
  }
}
