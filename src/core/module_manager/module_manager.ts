import { GameCore } from '../game_core/game_core';
import { IModule, ModuleEntry } from './types';

/**
 * Менеджер модулей симуляции.
 *
 * Управляет регистрацией и инициализацией модулей с учётом зависимостей.
 * Обеспечивает правильный порядок инициализации: модули-зависимости
 * инициализируются раньше модулей, которые от них зависят.
 *
 * **Теги**: `arch:module`, `arch:core`
 *
 * @example
 * const moduleManager = new ModuleManager();
 * moduleManager.registerModule(myModule, ['dependencyModuleId']);
 * await moduleManager.initializeModules(core);
 */
export class ModuleManager {
  /**
   * Реестр всех зарегистрированных модулей.
   * Ключ - ID модуля, значение - информация о модуле.
   */
  private modules: Map<string, ModuleEntry> = new Map();

  constructor() {
    console.warn('ModuleManager initialized');
  }

  /**
   * Регистрация модуля с опциональными зависимостями.
   *
   * @param module - модуль для регистрации
   * @param dependencies - список ID модулей-зависимостей (опционально)
   * @throws {Error} если модуль с таким ID уже зарегистрирован
   */
  registerModule(module: IModule, dependencies?: string[]): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with id "${module.id}" is already registered`);
    }

    // Используем зависимости из параметра или из самого модуля
    const moduleDependencies = dependencies ?? module.dependencies ?? [];

    this.modules.set(module.id, {
      module,
      dependencies: moduleDependencies,
      initialized: false,
    });

    console.warn('ModuleManager registered module', module.id, {
      dependencies: moduleDependencies,
    });
  }

  /**
   * Инициализация всех модулей в правильном порядке с учётом зависимостей.
   *
   * Использует топологическую сортировку для определения порядка инициализации.
   * Модули-зависимости инициализируются раньше модулей, которые от них зависят.
   *
   * @param core - экземпляр GameCore для передачи в модули
   * @throws {Error} если обнаружены циклические зависимости или отсутствующие зависимости
   */
  async initializeModules(core: GameCore): Promise<void> {
    if (this.modules.size === 0) {
      console.warn('ModuleManager: no modules to initialize');
      return;
    }

    // Проверка наличия всех зависимостей
    this.validateDependencies();

    // Топологическая сортировка для определения порядка инициализации
    const initOrder = this.topologicalSort();

    console.warn('ModuleManager: initializing modules in order', initOrder);

    // Инициализация модулей в правильном порядке
    for (const moduleId of initOrder) {
      const entry = this.modules.get(moduleId);
      if (!entry) {
        throw new Error(`Module "${moduleId}" not found in registry`);
      }

      if (entry.initialized) {
        console.warn(`ModuleManager: module "${moduleId}" already initialized, skipping`);
        continue;
      }

      try {
        console.warn(`ModuleManager: initializing module "${moduleId}"`);
        await entry.module.initialize(core);

        // Регистрация систем модуля, если метод определен
        if (entry.module.registerSystems) {
          const ecs = core.getECSManager();
          entry.module.registerSystems(ecs);
          console.warn(`ModuleManager: registered systems for module "${moduleId}"`);
        }

        entry.initialized = true;
        console.warn(`ModuleManager: module "${moduleId}" initialized successfully`);
      } catch (error) {
        console.error(`ModuleManager: failed to initialize module "${moduleId}"`, error);
        throw error;
      }
    }

    console.warn('ModuleManager: all modules initialized');
  }

  /**
   * Получение модуля по ID.
   *
   * @param moduleId - ID модуля
   * @returns модуль или null, если модуль не найден
   */
  getModule<T extends IModule = IModule>(moduleId: string): T | null {
    const entry = this.modules.get(moduleId);
    return (entry?.module as T) ?? null;
  }

  /**
   * Проверка наличия модуля.
   *
   * @param moduleId - ID модуля
   * @returns true, если модуль зарегистрирован
   */
  hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Получение всех зарегистрированных модулей.
   *
   * @returns массив всех модулей
   */
  getAllModules(): IModule[] {
    return Array.from(this.modules.values()).map((entry) => entry.module);
  }

  /**
   * Очистка всех модулей и освобождение ресурсов.
   *
   * Вызывает destroy() для всех инициализированных модулей.
   */
  clear(): void {
    console.warn('ModuleManager: clearing all modules');

    // Вызываем destroy() для всех инициализированных модулей
    for (const entry of this.modules.values()) {
      if (entry.initialized) {
        try {
          entry.module.destroy();
          console.warn(`ModuleManager: destroyed module "${entry.module.id}"`);
        } catch (error) {
          console.error(`ModuleManager: error destroying module "${entry.module.id}"`, error);
        }
      }
    }

    this.modules.clear();
    console.warn('ModuleManager cleared');
  }

  /**
   * Проверка наличия всех зависимостей для зарегистрированных модулей.
   *
   * @throws {Error} если найдены отсутствующие зависимости
   */
  private validateDependencies(): void {
    for (const [moduleId, entry] of this.modules.entries()) {
      for (const depId of entry.dependencies) {
        if (!this.modules.has(depId)) {
          throw new Error(`Module "${moduleId}" depends on missing module "${depId}"`);
        }
      }
    }
  }

  /**
   * Топологическая сортировка модулей для определения порядка инициализации.
   *
   * Использует алгоритм Kahn для топологической сортировки.
   * Модули без зависимостей инициализируются первыми.
   *
   * @returns массив ID модулей в порядке инициализации
   * @throws {Error} если обнаружены циклические зависимости
   */
  private topologicalSort(): string[] {
    // Создаём граф зависимостей (обратный: какой модуль зависит от каких)
    const inDegree: Map<string, number> = new Map();
    const graph: Map<string, string[]> = new Map();

    // Инициализация
    for (const moduleId of this.modules.keys()) {
      inDegree.set(moduleId, 0);
      graph.set(moduleId, []);
    }

    // Построение графа
    for (const [moduleId, entry] of this.modules.entries()) {
      for (const depId of entry.dependencies) {
        // depId -> moduleId (зависимость указывает на модуль)
        const dependents = graph.get(depId) ?? [];
        dependents.push(moduleId);
        graph.set(depId, dependents);

        // Увеличиваем inDegree для moduleId
        inDegree.set(moduleId, (inDegree.get(moduleId) ?? 0) + 1);
      }
    }

    // Алгоритм Kahn
    const queue: string[] = [];
    const result: string[] = [];

    // Находим все модули без зависимостей (inDegree === 0)
    for (const [moduleId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(moduleId);
      }
    }

    // Обрабатываем модули
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Уменьшаем inDegree для всех зависимых модулей
      const dependents = graph.get(current) ?? [];
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // Проверка на циклические зависимости
    if (result.length !== this.modules.size) {
      const missing = Array.from(this.modules.keys()).filter((id) => !result.includes(id));
      throw new Error(`Circular dependency detected. Modules not sorted: ${missing.join(', ')}`);
    }

    return result;
  }
}
