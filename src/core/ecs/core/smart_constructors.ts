import { query, type QueryResult } from 'bitecs';
import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry, SystemMetadata } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';
import {
  createSimpleComponent,
  createComponentSchema,
  EnhancedComponent,
  ComponentSchema,
  FieldBuilder,
} from './component_schema';
import { Logger } from '../../utils/logger';
import type { World, EntityId } from 'bitecs';

/**
 * Тип функции системы.
 *
 * `delta` — длительность тика в реальных миллисекундах.
 * `payload` — payload события, если система вызвана event-driven; для per-tick систем `undefined`.
 */
export type SystemFunction = (world: World, delta?: number, payload?: unknown) => void;

/**
 * Сигнатура пользовательской логики системы, которую передают в `createSystem`.
 *
 * `entities` — результат запроса по компонентам системы. Тип соответствует
 * `QueryResult` из bitecs: это либо массив, либо `Uint32Array` (зависит от
 * настройки `buffered`), поэтому индексируемый и итерируемый.
 */
export type SystemUpdateFunction = (
  world: World,
  entities: QueryResult,
  delta: number,
  payload?: unknown,
) => void;

/**
 * Умный конструктор компонентов
 * Создает компонент через createSimpleComponent() и автоматически регистрирует в ComponentRegistry
 *
 * @param name Уникальное имя компонента
 * @param defaults Объект с default значениями полей компонента
 * @returns Созданный компонент
 *
 * @example
 * ```typescript
 * export const Player = createComponent('Player', {
 *   health: 100,
 *   mana: 50,
 *   experience: 0,
 * });
 * ```
 */
export function createComponent<T extends Record<string, number>>(
  name: string,
  defaults: T,
): EnhancedComponent<ComponentSchema> {
  // Создаем компонент через существующую инфраструктуру
  const component = createSimpleComponent(name, defaults);

  // Автоматически регистрируем в реестре
  ComponentRegistry.getInstance().register(name, component);

  return component;
}

/**
 * Умный конструктор систем
 * Создает систему и автоматически регистрирует в SystemRegistry с метаданными
 *
 * @param name Уникальное имя системы
 * @param components Массив имен компонентов, которые эта система использует
 * @param updateFn Функция обновления системы
 * @param metadata Метаданные системы для автоматической настройки
 * @returns Функция системы
 *
 * @example
 * ```typescript
 * export const PlayerSystem = createSystem(
 *   'player',
 *   ['Player', 'Position'],
 *   (world, entities, delta) => {
 *     // Логика обновления игроков
 *   },
 *   {
 *     cluster: 'gameplay', // Автоматически добавляется в кластер
 *     interval: undefined, // Каждый тик (по умолчанию)
 *     eventTriggers: ['level_up'], // Реагирует на события
 *     enabled: true,
 *   },
 * );
 * ```
 */
/**
 * Умный конструктор компонента с расширенной схемой полей.
 * Создаёт компонент через createComponentSchema() и автоматически регистрирует
 * его в ComponentRegistry — так же, как createComponent().
 *
 * Нужен, когда важны явные типы и ограничения полей (min/max), а не вывод типа
 * из значения по умолчанию.
 */
export function createSchemaComponent(
  name: string,
  fields: Record<string, FieldBuilder>,
): EnhancedComponent<ComponentSchema> {
  const component = createComponentSchema(name, fields);

  // Автоматически регистрируем в реестре
  ComponentRegistry.getInstance().register(name, component);

  return component;
}

export function createSystem(
  name: string,
  components: string[],
  updateFn: SystemUpdateFunction,
  metadata: SystemMetadata,
): SystemFunction {
  const logger = Logger.create('createSystem');

  // Компоненты резолвятся лениво: на момент вызова createSystem они могут быть
  // ещё не зарегистрированы (порядок импорта модулей не гарантирован).
  let resolvedComponents: EnhancedComponent<ComponentSchema>[] | null = null;

  const resolveComponents = (): EnhancedComponent<ComponentSchema>[] => {
    if (resolvedComponents) return resolvedComponents;

    const registry = ComponentRegistry.getInstance();
    const resolved: EnhancedComponent<ComponentSchema>[] = [];

    for (const componentName of components) {
      const component = registry.get(componentName);
      if (component) {
        resolved.push(component);
      } else {
        logger.error(
          `Система "${name}" ссылается на незарегистрированный компонент "${componentName}" — ` +
            `он не будет учтён в запросе.`,
        );
      }
    }

    resolvedComponents = resolved;
    return resolved;
  };

  // Создаем функцию системы
  const system: SystemFunction = (world, delta, payload) => {
    const queryComponents = resolveComponents();
    // Система без компонентов не имеет фильтра — отдаём пустой набор,
    // чтобы updateFn никогда не работал с невалидными entity id.
    const entities = queryComponents.length > 0 ? query(world, queryComponents) : [];

    updateFn(world, entities, delta ?? 0, payload);
  };

  // Автоматически регистрируем в реестре с метаданными
  SystemRegistry.getInstance().register(name, system, {
    ...metadata,
    name, // Убеждаемся что имя в метаданных совпадает
  });

  return system;
}

/**
 * Умный конструктор кластеров
 * Создает кластер и автоматически регистрирует в ClusterRegistry
 *
 * @param name Уникальное имя кластера
 * @param systemNames Массив имен систем в кластере
 * @param metadata Метаданные кластера
 *
 * @example
 * ```typescript
 * export const GameplayCluster = createCluster('gameplay', ['player', 'enemy', 'physics'], {
 *   enabled: true,
 *   description: 'Core gameplay systems',
 * });
 * ```
 */
export function createCluster(
  name: string,
  systemNames: string[],
  metadata: { enabled: boolean; description?: string; interval?: number },
): void {
  ClusterRegistry.getInstance().register(name, systemNames, metadata);
}

/**
 * Умный конструктор фабрик сущностей
 * Создает фабрику сущностей и автоматически регистрирует в EntityFactoryRegistry
 *
 * @param name Уникальное имя фабрики
 * @param factoryFn Функция, создающая сущность и принимающая world
 * @param description Описание фабрики
 * @returns Функция фабрики
 *
 * @example
 * ```typescript
 * export const createPlayer = createEntityFactory(
 *   'player',
 *   (world) => {
 *     const entityId = addEntity(world);
 *     // Настройка компонентов сущности
 *     return entityId;
 *   },
 *   'Создает сущность игрока с базовыми компонентами'
 * );
 * ```
 */
export function createEntityFactory(
  name: string,
  factoryFn: (world: World) => number,
  description?: string,
): (world: World) => number {
  EntityFactoryRegistry.getInstance().register(name, factoryFn, description);

  return factoryFn;
}
