/**
 * Единая темная тема для UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

/**
 * Цветовая палитра темной темы
 */
export const UITheme = {
  /**
   * Основные цвета
   */
  colors: {
    // Фоновые цвета
    background: {
      primary: 0x1a1a1a,
      secondary: 0x2a2a2a,
      tertiary: 0x3a3a3a,
      modal: 0x0a0a0a,
    },

    // Цвета текста
    text: {
      primary: 0xffffff,
      secondary: 0xcccccc,
      tertiary: 0x999999,
      disabled: 0x666666,
    },

    // Акцентные цвета
    accent: {
      primary: 0x4a90e2,
      secondary: 0x5aa0f2,
      hover: 0x6ab0ff,
    },

    // Цвета состояний
    state: {
      success: 0x2a7a2a,
      successHover: 0x3a9a3a,
      warning: 0xe2a34a,
      warningHover: 0xf2b35a,
      error: 0xe24a4a,
      errorHover: 0xf25a5a,
      info: 0x4a90e2,
      infoHover: 0x5aa0f2,
    },

    // Границы и разделители
    border: {
      primary: 0x404040,
      secondary: 0x505050,
      accent: 0x4a90e2,
    },

    // Оверлей (затемнение фона)
    overlay: 0x000000,
  },

  /**
   * Прозрачности
   */
  alpha: {
    full: 1.0,
    high: 0.95,
    medium: 0.8,
    low: 0.6,
    overlay: 0.7,
    disabled: 0.5,
  },

  /**
   * Размеры
   */
  sizes: {
    // Размеры шрифтов
    fontSize: {
      tiny: '10px',
      small: '12px',
      normal: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '24px',
      xxlarge: '32px',
    },

    // Отступы
    spacing: {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },

    // Закругления
    borderRadius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },

    // Границы
    borderWidth: {
      none: 0,
      thin: 1,
      normal: 2,
      thick: 4,
    },

    // Стандартные размеры кнопок
    button: {
      small: { width: 80, height: 32 },
      medium: { width: 120, height: 40 },
      large: { width: 160, height: 50 },
    },

    // Стандартные размеры input полей
    input: {
      small: { width: 120, height: 32 },
      medium: { width: 200, height: 40 },
      large: { width: 300, height: 50 },
    },
  },

  /**
   * Анимации
   */
  animations: {
    duration: {
      instant: 0,
      fast: 150,
      normal: 250,
      slow: 400,
    },

    easing: {
      linear: 'Linear',
      easeIn: 'Quad.easeIn',
      easeOut: 'Quad.easeOut',
      easeInOut: 'Quad.easeInOut',
      bounce: 'Bounce.easeOut',
      elastic: 'Elastic.easeOut',
    },

    scale: {
      hover: 1.05,
      active: 0.95,
    },
  },

  /**
   * Шрифты
   */
  fonts: {
    primary: 'Arial',
    secondary: 'Helvetica',
    monospace: 'Courier New',
  },
} as const;

/**
 * Типы темы
 */
export type UIThemeType = typeof UITheme;
