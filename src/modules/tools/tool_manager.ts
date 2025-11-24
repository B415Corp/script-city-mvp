import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { Tool, ToolCategory, ToolRegistration, ActiveToolState } from './types';

/**
 * Менеджер инструментов.
 * Управляет регистрацией, категоризацией и активацией инструментов.
 *
 * **Теги**: `arch:tools`, `arch:ui`, `gameplay:editor`
 *
 * Принципы работы:
 * - Инструменты регистрируются через модули
 * - Инструменты организованы в категории
 * - Только один инструмент может быть активен одновременно
 * - При активации инструмента генерируется событие ToolActivated
 */
export class ToolManager {
  private categories: Map<string, ToolCategory> = new Map();
  private tools: Map<string, Tool> = new Map();
  private activeTool: ActiveToolState = {
    toolId: null,
    categoryId: null,
  };
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Регистрация инструмента.
   * Если категория не существует, она создается автоматически.
   *
   * @param registration - регистрация инструмента
   */
  registerTool(registration: ToolRegistration): void {
    const { category, tool } = registration;

    // Проверяем, существует ли категория
    let toolCategory = this.categories.get(category.id);
    if (!toolCategory) {
      // Создаем новую категорию
      toolCategory = {
        ...category,
        tools: [],
      };
      this.categories.set(category.id, toolCategory);
    }

    // Проверяем, не зарегистрирован ли уже инструмент с таким ID
    if (this.tools.has(tool.id)) {
      console.warn(`Tool with id "${tool.id}" already registered, skipping`);
      return;
    }

    // Добавляем инструмент в категорию
    toolCategory.tools.push(tool);
    // Сортируем инструменты по order
    toolCategory.tools.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Регистрируем инструмент
    this.tools.set(tool.id, tool);

    // Публикуем событие о регистрации инструмента
    this.eventBus.emit(Events.ToolRegistered, {
      toolId: tool.id,
      categoryId: category.id,
    });
  }

  /**
   * Получение всех категорий.
   * Категории отсортированы по order.
   *
   * @returns массив категорий
   */
  getCategories(): ToolCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  /**
   * Получение категории по ID.
   *
   * @param categoryId - ID категории
   * @returns категория или null
   */
  getCategory(categoryId: string): ToolCategory | null {
    return this.categories.get(categoryId) ?? null;
  }

  /**
   * Получение инструмента по ID.
   *
   * @param toolId - ID инструмента
   * @returns инструмент или null
   */
  getTool(toolId: string): Tool | null {
    return this.tools.get(toolId) ?? null;
  }

  /**
   * Получение всех инструментов в категории.
   *
   * @param categoryId - ID категории
   * @returns массив инструментов
   */
  getToolsByCategory(categoryId: string): Tool[] {
    const category = this.categories.get(categoryId);
    return category ? [...category.tools] : [];
  }

  /**
   * Активация инструмента.
   * Деактивирует предыдущий активный инструмент, если он был.
   *
   * @param toolId - ID инструмента для активации
   * @returns true если инструмент успешно активирован
   */
  activateTool(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) {
      console.warn(`Tool with id "${toolId}" not found`);
      return false;
    }

    // Деактивируем предыдущий инструмент
    if (this.activeTool.toolId) {
      this.deactivateTool();
    }

    // Активируем новый инструмент
    this.activeTool = {
      toolId: tool.id,
      categoryId: tool.categoryId,
    };

    // Публикуем событие об активации инструмента
    this.eventBus.emit(Events.ToolActivated, {
      toolId: tool.id,
      categoryId: tool.categoryId,
      toolType: tool.type,
    });

    return true;
  }

  /**
   * Деактивация текущего активного инструмента.
   */
  deactivateTool(): void {
    if (!this.activeTool.toolId) {
      return;
    }

    const previousToolId = this.activeTool.toolId;
    const previousCategoryId = this.activeTool.categoryId;

    this.activeTool = {
      toolId: null,
      categoryId: null,
    };

    // Публикуем событие о деактивации инструмента
    this.eventBus.emit(Events.ToolDeactivated, {
      toolId: previousToolId,
      categoryId: previousCategoryId,
    });
  }

  /**
   * Получение текущего активного инструмента.
   *
   * @returns состояние активного инструмента
   */
  getActiveTool(): ActiveToolState {
    return { ...this.activeTool };
  }

  /**
   * Проверка, активен ли инструмент.
   *
   * @param toolId - ID инструмента для проверки
   * @returns true если инструмент активен
   */
  isToolActive(toolId: string): boolean {
    return this.activeTool.toolId === toolId;
  }

  /**
   * Очистка всех зарегистрированных инструментов.
   * Используется при перезагрузке или очистке состояния.
   */
  clear(): void {
    this.deactivateTool();
    this.categories.clear();
    this.tools.clear();
  }
}
