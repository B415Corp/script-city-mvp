import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import {
  ToolCategory,
  ToolRegistration,
  ActiveToolState,
  ToolDefinition,
  ToolPointer,
  ToolActionContext,
} from './types';
import { CommandProcessor } from '@/core/command_processor/command_processor';
import { Subscription } from '@/core/event_bus/types';
import { debugLog } from '@/infrastructure/utils/logger';

interface ToolManagerDependencies {
  eventBus: EventBus;
  commandProcessor: CommandProcessor;
}

interface TilePointerEventPayload {
  tileX: number;
  tileY: number;
  tileType?: number;
  tileTypeName?: string;
}

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
 * Потоки:
 * - UI активирует инструмент (команда SelectTool или прямой вызов) → ToolActivated
 * - GridModule шлёт TileHovered/TileClicked → активный инструмент получает событие через поведение
 * - Инструмент генерирует команды в CommandProcessor или события в EventBus
 */
export class ToolManager {
  private categories: Map<string, ToolCategory> = new Map();
  private tools: Map<string, ToolDefinition> = new Map();
  private activeTool: ActiveToolState = {
    toolId: null,
    categoryId: null,
  };
  private readonly eventBus: EventBus;
  private readonly commandProcessor: CommandProcessor;
  private subscriptions: Subscription[] = [];

  constructor(deps: ToolManagerDependencies) {
    this.eventBus = deps.eventBus;
    this.commandProcessor = deps.commandProcessor;
    this.subscribeToMapEvents();
  }

  /**
   * Регистрация инструмента.
   * Если категория не существует, она создается автоматически.
   *
   * @param registration - регистрация инструмента
   */
  registerTool(registration: ToolRegistration): void {
    const { category, tool } = registration;

    let toolCategory = this.categories.get(category.id);
    if (!toolCategory) {
      toolCategory = {
        ...category,
        tools: [],
      };
      this.categories.set(category.id, toolCategory);
    }

    if (this.tools.has(tool.id)) {
      console.warn(`Tool with id "${tool.id}" already registered, skipping`);
      return;
    }

    toolCategory.tools.push(tool);
    toolCategory.tools.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    this.tools.set(tool.id, tool);

    this.eventBus.emit(Events.ToolRegistered, {
      toolId: tool.id,
      categoryId: category.id,
      toolType: tool.type,
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
  getTool(toolId: string): ToolDefinition | null {
    return this.tools.get(toolId) ?? null;
  }

  /**
   * Проверка наличия инструмента.
   *
   * @param toolId - ID инструмента
   * @returns true если инструмент зарегистрирован
   */
  hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * Получение всех инструментов в категории.
   *
   * @param categoryId - ID категории
   * @returns массив инструментов
   */
  getToolsByCategory(categoryId: string): ToolDefinition[] {
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

    if (this.activeTool.toolId === toolId) {
      return true;
    }

    if (this.activeTool.toolId) {
      this.deactivateTool();
    }

    this.activeTool = {
      toolId: tool.id,
      categoryId: tool.categoryId,
    };

    tool.behavior?.onActivate?.();

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
    const previousTool = previousToolId ? this.tools.get(previousToolId) : null;

    this.activeTool = {
      toolId: null,
      categoryId: null,
    };

    previousTool?.behavior?.onDeactivate?.();

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

  /**
   * Полная очистка ресурса с отпиской от событий.
   */
  destroy(): void {
    this.clear();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  private subscribeToMapEvents(): void {
    debugLog('🔧 ToolManager: подписка на события карты');
    this.subscriptions = [
      this.eventBus.on<TilePointerEventPayload>(Events.TileClicked, this.handleTileClick),
      this.eventBus.on<TilePointerEventPayload>(Events.TileHovered, this.handleTileHover),
      this.eventBus.on<TilePointerEventPayload>(Events.TileUnhovered, this.handleTileUnhover),
    ];
  }

  private handleTileClick = (payload?: TilePointerEventPayload): void => {
    if (!payload || !this.activeTool.toolId) {
      return;
    }

    const tool = this.tools.get(this.activeTool.toolId);
    if (!tool?.behavior?.onUse) {
      return;
    }

    const context = this.buildActionContext(payload);
    tool.behavior.onUse(context);

    this.eventBus.emit(Events.ToolUsed, {
      toolId: tool.id,
      categoryId: tool.categoryId,
      tile: context.tile,
    });
  };

  private handleTileHover = (payload?: TilePointerEventPayload): void => {
    if (!payload || !this.activeTool.toolId) {
      return;
    }

    const tool = this.tools.get(this.activeTool.toolId);
    if (!tool?.behavior?.onHover) {
      return;
    }

    const context = this.buildActionContext(payload);
    tool.behavior.onHover(context);

    this.eventBus.emit(Events.ToolHovered, {
      toolId: tool.id,
      categoryId: tool.categoryId,
      tile: context.tile,
    });
  };

  private handleTileUnhover = (payload?: TilePointerEventPayload): void => {
    if (!payload || !this.activeTool.toolId) {
      return;
    }

    const tool = this.tools.get(this.activeTool.toolId);
    if (!tool?.behavior?.onUnhover) {
      return;
    }

    const context = this.buildActionContext(payload);
    tool.behavior.onUnhover(context);

    this.eventBus.emit(Events.ToolUnhovered, {
      toolId: tool.id,
      categoryId: tool.categoryId,
      tile: context.tile,
    });
  };

  private buildActionContext(payload: TilePointerEventPayload): ToolActionContext {
    const tile: ToolPointer = {
      x: payload.tileX,
      y: payload.tileY,
      tileType: payload.tileType,
      tileTypeName: payload.tileTypeName,
    };

    return {
      tile,
      enqueueCommand: (command) => this.commandProcessor.enqueueCommand(command),
      emitEvent: (eventType, eventPayload) => this.eventBus.emit(eventType, eventPayload),
    };
  }
}
