import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry, SystemMetadata } from '../registry/system_registry';
import { createSimpleComponent, EnhancedComponent, ComponentSchema } from './component_schema';

/**
 * Тип функции системы
 */
export type SystemFunction = (world: any, delta?: number) => void;

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
  defaults: T
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
export function createSystem(
  name: string,
  components: string[],
  updateFn: (world: any, entities: any, delta: number) => void,
  metadata: SystemMetadata
): SystemFunction {
  // Создаем функцию системы
  const system: SystemFunction = (world, delta) => {
    // Здесь будет логика запроса сущностей и вызова updateFn
    // Пока что просто вызываем updateFn с пустыми параметрами
    updateFn(world, [], delta || 0);
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
  metadata: { enabled: boolean; description?: string; interval?: number }
): void {
  // Импорт здесь во избежание циклических зависимостей
  const { ClusterRegistry } = require('../registry/cluster_registry');

  ClusterRegistry.getInstance().register(name, systemNames, metadata);
}

/**
 * Умный конструктор фабрик сущностей
 * Создает фабрику сущностей и автоматически регистрирует в EntityFactoryRegistry
 *
 * @param name Уникальное имя фабрики
 * @param factoryFn Функция, создающая сущность
 * @param description Описание фабрики
 * @returns Функция фабрики
 *
 * @example
 * ```typescript
 * export const createPlayer = createEntityFactory(
 *   'player',
 *   () => {
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
  factoryFn: () => number,
  description?: string
): () => number {
  // Импорт здесь во избежание циклических зависимостей
  const { EntityFactoryRegistry } = require('../registry/entity_factory_registry');

  EntityFactoryRegistry.getInstance().register(name, factoryFn, description);

  return factoryFn;
}