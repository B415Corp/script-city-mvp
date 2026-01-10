/**
 * Фабрика сущностей - функция, создающая сущность
 */
export type EntityFactoryFunction = () => number; // Возвращает EntityId

/**
 * Зарегистрированная фабрика сущностей
 */
export interface RegisteredEntityFactory {
  name: string;
  factory: EntityFactoryFunction;
  description?: string;
}

/**
 * Реестр фабрик сущностей
 */
export class EntityFactoryRegistry {
  private static instance: EntityFactoryRegistry;
  private factories = new Map<string, RegisteredEntityFactory>();

  private constructor() {}

  /**
   * Получить единственный экземпляр реестра (Singleton)
   */
  static getInstance(): EntityFactoryRegistry {
    if (!EntityFactoryRegistry.instance) {
      EntityFactoryRegistry.instance = new EntityFactoryRegistry();
    }
    return EntityFactoryRegistry.instance;
  }

  /**
   * Зарегистрировать фабрику сущностей в реестре
   * @param name Уникальное имя фабрики
   * @param factory Функция-фабрика
   * @param description Описание фабрики
   */
  register(name: string, factory: EntityFactoryFunction, description?: string): void {
    if (this.factories.has(name)) {
      throw new Error(`Entity factory "${name}" is already registered`);
    }

    this.factories.set(name, { name, factory, description });
  }

  /**
   * Получить фабрику по имени
   * @param name Имя фабрики
   * @returns Зарегистрированная фабрика или undefined
   */
  get(name: string): RegisteredEntityFactory | undefined {
    return this.factories.get(name);
  }

  /**
   * Создать сущность через зарегистрированную фабрику
   * @param name Имя фабрики
   * @returns EntityId созданной сущности
   */
  create(name: string): number {
    const registeredFactory = this.factories.get(name);
    if (!registeredFactory) {
      throw new Error(`Entity factory "${name}" not found`);
    }
    return registeredFactory.factory();
  }

  /**
   * Получить все зарегистрированные фабрики
   * @returns Map с именами и зарегистрированными фабриками
   */
  getAll(): Map<string, RegisteredEntityFactory> {
    return new Map(this.factories);
  }

  /**
   * Проверить, зарегистрирована ли фабрика
   * @param name Имя фабрики
   * @returns true если фабрика зарегистрирована
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Очистить реестр (для тестирования)
   */
  clear(): void {
    this.factories.clear();
  }

  /**
   * Получить количество зарегистрированных фабрик
   */
  size(): number {
    return this.factories.size;
  }
}