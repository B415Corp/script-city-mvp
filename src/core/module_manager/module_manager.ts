import { GameCore } from '../game_core/game_core';
import { IModule, ModuleEntry } from './types';
import Phaser from 'phaser';
import { debugLog, debugGroup, debugGroupEnd } from '@/infrastructure/utils/logger';
import { ISystem } from '../ecs_manager/types';

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
    debugLog('📦 ModuleManager создан');
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

    debugLog('📦 ModuleManager: модуль зарегистрирован', {
      moduleId: module.id,
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
    debugGroup('📦 ModuleManager: инициализация модулей');
    if (this.modules.size === 0) {
      debugLog('Нет модулей для инициализации');
      debugGroupEnd();
      return;
    }

    // Проверка наличия всех зависимостей
    debugGroup('Проверка зависимостей');
    this.validateDependencies();
    debugLog('Все зависимости найдены');
    debugGroupEnd();

    // Топологическая сортировка для определения порядка инициализации
    debugGroup('Топологическая сортировка');
    const initOrder = this.topologicalSort();
    debugLog('Порядок инициализации определён', { order: initOrder });
    debugGroupEnd();

    // Инициализация модулей в правильном порядке
    debugGroup('Инициализация модулей');
    for (const moduleId of initOrder) {
      const entry = this.modules.get(moduleId);
      if (!entry) {
        throw new Error(`Module "${moduleId}" not found in registry`);
      }

      if (entry.initialized) {
        debugLog('Модуль уже инициализирован, пропускаем', { moduleId });
        continue;
      }

      try {
        debugGroup(`Инициализация модуля: ${moduleId}`);
        debugLog('Вызов initialize()', { moduleId, dependencies: entry.dependencies });
        await entry.module.initialize(core);

        const ecs = core.getECSManager();

        // Регистрация систем модуля, если метод определен
        if (entry.module.registerSystems) {
          debugGroup('Регистрация систем модуля (registerSystems)');
          entry.module.registerSystems(ecs);
          debugLog('Системы зарегистрированы через registerSystems', { moduleId });
          debugGroupEnd();
        }

        // Регистрация систем модуля, если ecsSystems определены
        const systems = (entry.module as { ecsSystems?: ISystem[] }).ecsSystems;
        if (systems && systems.length > 0) {
          debugGroup('Регистрация систем модуля (ecsSystems)');
          systems.forEach((system) => ecs.registerSystem(system));
          debugLog('Системы зарегистрированы через ecsSystems', {
            moduleId,
            systems: systems.map((s) => s.id),
          });
          debugGroupEnd();
        }

        entry.initialized = true;
        debugGroupEnd();
      } catch (error) {
        debugLog('Ошибка инициализации модуля', { moduleId, error });
        debugGroupEnd();
        throw error;
      }
    }
    debugGroupEnd();

    debugLog('📦 ModuleManager: все модули инициализированы', { count: this.modules.size });
    debugGroupEnd();
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
   * Прикрепление модулей к Phaser сцене.
   *
   * Вызывает метод `attachToScene(scene)` для всех модулей, которые его реализуют.
   * Это позволяет модулям создавать UI, подписываться на события сцены и т.д.
   *
   * @param scene - Phaser сцена для прикрепления модулей
   */
  attachModulesToScene(scene: Phaser.Scene): void {
    debugGroup('📦 ModuleManager: прикрепление модулей к сцене');
    for (const entry of this.modules.values()) {
      const module = entry.module as unknown as { attachToScene?: (scene: Phaser.Scene) => void };
      if (typeof module.attachToScene === 'function') {
        try {
          module.attachToScene(scene);
          debugLog('Модуль прикреплён к сцене', { moduleId: entry.module.id });
        } catch (error) {
          debugLog('Ошибка прикрепления модуля к сцене', { moduleId: entry.module.id, error });
        }
      }
    }
    debugGroupEnd();
  }

  /**
   * Очистка всех модулей и освобождение ресурсов.
   *
   * Вызывает destroy() для всех инициализированных модулей.
   */
  clear(): void {
    debugGroup('📦 ModuleManager: очистка модулей');
    const modulesCount = this.modules.size;
    const initializedCount = Array.from(this.modules.values()).filter((e) => e.initialized).length;

    // Вызываем destroy() для всех инициализированных модулей
    debugGroup('Уничтожение модулей');
    for (const entry of this.modules.values()) {
      if (entry.initialized) {
        try {
          entry.module.destroy();
          debugLog('Модуль уничтожен', { moduleId: entry.module.id });
        } catch (error) {
          debugLog('Ошибка уничтожения модуля', { moduleId: entry.module.id, error });
        }
      }
    }
    debugGroupEnd();

    this.modules.clear();
    debugLog('📦 ModuleManager очищен', { modulesCount, initializedCount });
    debugGroupEnd();
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
          throw new Error(`📦 Module "${moduleId}" depends on missing module "${depId}"`);
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
      throw new Error(`📦 Circular dependency detected. Modules not sorted: ${missing.join(', ')}`);
    }

    return result;
  }
}
