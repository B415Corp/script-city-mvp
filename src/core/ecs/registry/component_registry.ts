import { EnhancedComponent, ComponentSchema } from '../core/component_schema';

/**
 * Реестр всех компонентов ECS
 * Хранит зарегистрированные компоненты и предоставляет доступ к ним
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components = new Map<string, EnhancedComponent<ComponentSchema>>();

  private constructor() {}

  /**
   * Получить единственный экземпляр реестра (Singleton)
   */
  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Зарегистрировать компонент в реестре
   * @param name Уникальное имя компонента
   * @param component Экземпляр компонента BitECS
   */
  register(name: string, component: EnhancedComponent<ComponentSchema>): void {
    if (this.components.has(name)) {
      throw new Error(`Component "${name}" is already registered`);
    }
    this.components.set(name, component);
  }

  /**
   * Получить компонент по имени
   * @param name Имя компонента
   * @returns Компонент или undefined если не найден
   */
  get(name: string): EnhancedComponent<ComponentSchema> | undefined {
    return this.components.get(name);
  }

  /**
   * Получить все зарегистрированные компоненты
   * @returns Map с именами и компонентами
   */
  getAll(): Map<string, EnhancedComponent<ComponentSchema>> {
    return new Map(this.components);
  }

  /**
   * Проверить, зарегистрирован ли компонент
   * @param name Имя компонента
   * @returns true если компонент зарегистрирован
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Очистить реестр (для тестирования)
   */
  clear(): void {
    this.components.clear();
  }

  /**
   * Получить количество зарегистрированных компонентов
   */
  size(): number {
    return this.components.size;
  }
}
