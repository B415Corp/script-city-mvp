import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { Events } from '@/core/event_bus/events';
import { DevEventBus, EventHistoryEntry } from '@/core/event_bus/dev_event_bus';
import { DEBUG_WINDOW_CONSTANTS } from './constants';

/**
 * Рендерер контента для вкладок debug окна
 * Теги: debug:renderer, arch:ui
 */

const EXCLUDED_EVENTS = new Set<string>([Events.TickStarted, Events.TickEnded]);

/**
 * Вычисляет высоту текстового элемента с учетом переносов строк.
 */
function getTextHeight(textObject: Phaser.GameObjects.Text): number {
  const text = textObject.text;
  if (!text) {
    return 0;
  }
  const lines = text.split('\n').length;
  const lineHeight = textObject.style.fontSize
    ? parseInt(textObject.style.fontSize.toString().replace('px', ''))
    : 11;
  const lineSpacing = 2;
  return lines * (lineHeight + lineSpacing);
}

/**
 * Рендерит контент для вкладки "Common"
 */
export function renderCommonTab(
  core: GameCore,
  tickText: Phaser.GameObjects.Text,
  toolText: Phaser.GameObjects.Text,
  hoveredTile: { x: number; y: number; type?: number; typeName?: string } | null,
): void {
  const tickManager = core.getTickManager();
  const eventBus = core.getEventBus();

  // Информация о тиках
  const currentTick = tickManager.getCurrentTick();
  const tickRate = tickManager.getTickRate();
  const effectiveTickRate = tickManager.getEffectiveTickRate();
  const ticksPerSecond = tickManager.getTicksPerSecond();
  const speed = tickManager.getSpeed();
  const isPaused = !tickManager.isActive();
  const avgEventsPerTick = eventBus.getAverageEventsPerTick();

  // Информация о выделенном тайле
  let tileInfo = 'Tile: None';
  if (hoveredTile) {
    tileInfo = `Tile: (${hoveredTile.x}, ${hoveredTile.y})`;
    if (hoveredTile.typeName) {
      tileInfo += `\n  Type: ${hoveredTile.typeName}`;
      if (hoveredTile.type !== undefined) {
        tileInfo += ` [${hoveredTile.type}]`;
      }
    }
  }

  tickText.setVisible(true);
  tickText.setY(0);
  tickText.setText(
    `Tick: ${currentTick}\nRate: ${tickRate}/s\nEffective: ${effectiveTickRate.toFixed(1)}/s\nActual: ${ticksPerSecond}/s\nSpeed: ${isPaused ? '⏸' : `${speed}x`}\nAvg events: ${avgEventsPerTick}/tick\n\n${tileInfo}\n`,
  );

  // Информация об активном инструменте
  try {
    const toolManager = core.getToolManager();
    const activeTool = toolManager.getActiveTool();
    if (activeTool.toolId) {
      const tool = toolManager.getTool(activeTool.toolId);
      if (tool) {
        toolText.setVisible(true);
        toolText.setY(getTextHeight(tickText) + DEBUG_WINDOW_CONSTANTS.SECTION_SPACING);
        toolText.setText(
          `Tool: ${tool.icon} ${tool.name}\nType: ${tool.type}\nCategory: ${tool.categoryId}`,
        );
      } else {
        toolText.setVisible(true);
        toolText.setY(getTextHeight(tickText) + DEBUG_WINDOW_CONSTANTS.SECTION_SPACING);
        toolText.setText('Tool: Unknown');
      }
    } else {
      toolText.setVisible(true);
      toolText.setY(getTextHeight(tickText) + DEBUG_WINDOW_CONSTANTS.SECTION_SPACING);
      toolText.setText('Tool: None');
    }
  } catch {
    // ToolManager может быть не инициализирован
    toolText.setVisible(true);
    toolText.setY(getTextHeight(tickText) + DEBUG_WINDOW_CONSTANTS.SECTION_SPACING);
    toolText.setText('Tool: N/A');
  }
}

/**
 * Рендерит контент для вкладки "ECS"
 */
export function renderECSTab(core: GameCore, ecsText: Phaser.GameObjects.Text): void {
  const ecs = core.getECSManager();
  const eventBus = core.getEventBus();

  const entitiesCount = ecs.getAllEntities().length;
  const systemsCount = ecs.getAllSystems().length;
  const eventsPerTick = eventBus.getEventsPerTick();

  ecsText.setVisible(true);
  ecsText.setY(0);
  ecsText.setText(
    `Entities: ${entitiesCount}\nSystems: ${systemsCount}\n\nEvents/tick: ${eventsPerTick}`,
  );
}

/**
 * Рендерит контент для вкладки "Modules"
 */
export function renderModulesTab(core: GameCore, modulesText: Phaser.GameObjects.Text): void {
  const moduleManager = core.getModuleManager();
  const modules = moduleManager.getAllModules();

  modulesText.setVisible(true);
  modulesText.setY(0);

  if (modules.length === 0) {
    modulesText.setText('(no modules)');
  } else {
    const modulesList = modules.map((module) => `• ${module.id}`).join('\n');
    modulesText.setText(`Total: ${modules.length}\n\n${modulesList}`);
  }
}

/**
 * Рендерит контент для вкладки "Tools"
 */
export function renderToolsTab(core: GameCore, toolsText: Phaser.GameObjects.Text): void {
  toolsText.setVisible(true);
  toolsText.setY(0);

  try {
    const toolManager = core.getToolManager();
    const categories = toolManager.getCategories();
    const activeToolState = toolManager.getActiveTool();
    const activeTool = activeToolState.toolId ? toolManager.getTool(activeToolState.toolId) : null;

    const activeLine = activeTool
      ? `Active: ${activeTool.icon} ${activeTool.name} [${activeTool.type}]`
      : 'Active: None';

    if (categories.length === 0) {
      toolsText.setText(`${activeLine}\n\nNo tools registered`);
      return;
    }

    const categoriesText = categories
      .map((category) => {
        const tools = toolManager.getToolsByCategory(category.id);

        if (tools.length === 0) {
          return `${category.icon} ${category.name} (0)\n  (no tools)`;
        }

        const toolLines = tools.map((tool) => {
          const marker = tool.id === activeToolState.toolId ? '👉' : '•';
          return `  ${marker} ${tool.icon} ${tool.name} [${tool.type}]`;
        });

        return `${category.icon} ${category.name} (${tools.length})\n${toolLines.join('\n')}`;
      })
      .join('\n\n');

    toolsText.setText(`${activeLine}\n\nCategories: ${categories.length}\n\n${categoriesText}`);
  } catch {
    toolsText.setText('ToolManager unavailable');
  }
}

/**
 * Рендерит контент для вкладки "Events"
 */
export function renderEventsTab(core: GameCore, eventsText: Phaser.GameObjects.Text): void {
  const eventBus = core.getEventBus();

  // Проверяем, является ли EventBus DevEventBus с поддержкой истории
  const eventHistory: EventHistoryEntry[] =
    eventBus instanceof DevEventBus ? eventBus.getEventHistory() : [];
  const filteredEvents = eventHistory.filter((entry) => !EXCLUDED_EVENTS.has(entry.eventType));

  // Если история недоступна (обычный EventBus), показываем соответствующее сообщение
  if (eventHistory.length === 0 && !(eventBus instanceof DevEventBus)) {
    eventsText.setVisible(true);
    eventsText.setY(0);
    eventsText.setText(
      'Event history disabled in production build.\n\nUse DevEventBus for debugging.',
    );
    return;
  }

  eventsText.setVisible(true);
  eventsText.setY(0);

  if (filteredEvents.length === 0) {
    eventsText.setText('(no events yet)');
  } else {
    const eventsList = filteredEvents
      .slice()
      .reverse() // Показываем последние сверху
      .slice(0, 15) // Показываем максимум 15 событий
      .map((entry: EventHistoryEntry, index: number) => {
        const timeAgo = Date.now() - entry.timestamp;
        const timeStr = timeAgo < 1000 ? `${timeAgo}ms` : `${(timeAgo / 1000).toFixed(1)}s`;
        return `${index + 1}. ${entry.eventType}\n   ${timeStr} ago`;
      })
      .join('\n');
    eventsText.setText(`Last ${filteredEvents.length} events:\n\n${eventsList}`);
  }
}
