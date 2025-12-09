import { Command } from '@/core/command_processor/types';
import { Events } from '@/core/event_bus/events';

/**
 * Базовые типы и интерфейсы для системы инструментов.
 *
 * **Теги**: `arch:tools`, `arch:ui`, `gameplay:editor`
 *
 * Система инструментов позволяет:
 * - Организовывать инструменты в категории
 * - Регистрировать новые инструменты через модули
 * - Управлять активным инструментом и его жизненным циклом
 * - Генерировать команды при использовании инструментов
 * - Делегировать реакцию на события карты (hover/click) в поведение инструмента
 */

/**
 * Тип инструмента определяет доменное действие, которое он выполняет.
 */
export type ToolType =
  | 'zone_residential_low'
  | 'zone_commercial_low'
  | 'zone_industrial_low'
  | 'zone_remove'
  | 'road'
  | 'bulldoze'
  | 'pipe_water'
  | 'pipe_sewer'
  | 'terrain_raise'
  | 'terrain_lower'
  | 'terrain_flatten'
  | 'select';

/**
 * Категория инструментов.
 * Группирует связанные инструменты вместе.
 */
export interface ToolCategory {
  /** Уникальный идентификатор категории */
  id: string;
  /** Отображаемое название категории */
  name: string;
  /** Иконка категории (emoji или текст) */
  icon: string;
  /** Список инструментов в категории */
  tools: ToolDefinition[];
  /** Порядок отображения (меньше = выше) */
  order?: number;
}

/**
 * Инструмент для работы с картой.
 */
export interface Tool {
  /** Уникальный идентификатор инструмента */
  id: string;
  /** Тип инструмента */
  type: ToolType;
  /** Отображаемое название инструмента */
  name: string;
  /** Иконка инструмента (emoji или текст) */
  icon: string;
  /** Описание инструмента (для подсказок) */
  description?: string;
  /** ID категории, к которой принадлежит инструмент */
  categoryId: string;
  /** Порядок отображения внутри категории (меньше = выше) */
  order?: number;
  /** Горячая клавиша для быстрого доступа */
  hotkey?: string;
}

/**
 * Данные о тайле, которые приходят из событий карты.
 */
export interface ToolPointer {
  x: number;
  y: number;
  tileType?: number;
  tileTypeName?: string;
}

/**
 * Контекст действий инструмента.
 * Передается в обработчики поведения, чтобы они работали через публичный API.
 */
export interface ToolActionContext {
  tile: ToolPointer;
  enqueueCommand: (command: Command) => void;
  emitEvent: (eventType: Events | string, payload?: unknown) => void;
}

/**
 * Поведение инструмента, завязанное на события карты.
 */
export interface ToolBehavior {
  onUse?: (context: ToolActionContext) => void;
  onHover?: (context: ToolActionContext) => void;
  onUnhover?: (context: ToolActionContext) => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

/**
 * Инструмент вместе с поведением.
 */
export interface ToolDefinition extends Tool {
  behavior?: ToolBehavior;
}

/**
 * Состояние активного инструмента.
 */
export interface ActiveToolState {
  /** ID активного инструмента (null если нет активного инструмента) */
  toolId: string | null;
  /** ID категории активного инструмента */
  categoryId: string | null;
}

/**
 * Регистрация инструмента.
 * Используется модулями для добавления своих инструментов.
 */
export interface ToolRegistration {
  /** Категория инструмента (создается, если не существует) */
  category: Omit<ToolCategory, 'tools'>;
  /** Инструмент для регистрации */
  tool: ToolDefinition;
}
