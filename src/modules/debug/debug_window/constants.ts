/**
 * Константы для debug окна
 * Теги: debug:config, arch:ui
 */

export const DEBUG_WINDOW_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  TOGGLE_BUTTON_WIDTH: 30,
  TOGGLE_BUTTON_HEIGHT: 60,
  PADDING: 12,
  FONT_SIZE: '11px',
  UPDATE_INTERVAL: 100, // обновление каждые 100ms реального времени
  SECTION_SPACING: 10, // отступ между секциями
  TAB_HEIGHT: 32,
  TAB_SPACING: 4,

  // Цвета
  COLORS: {
    BACKGROUND: 0x1a1a1a,
    ACCENT: 0x4a90e2,
    TAB_INACTIVE: 0x2a2a2a,
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#999999',
    TEXT_ECS: '#ffcc66',
    TEXT_TOOL: '#90ee90',
    TEXT_EVENTS: '#cccccc',
  },
} as const;
