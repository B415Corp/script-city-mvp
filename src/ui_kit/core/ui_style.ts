/**
 * Система стилей для UI Kit.
 * Содержит утилиты для работы со стилями и их нормализацией.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import { UISpacing, UISpacingSimple, UIStyle } from './types';
import { UITheme } from './ui_theme';

/**
 * Преобразует упрощенные отступы в полные
 */
export function normalizeSpacing(spacing?: UISpacing | UISpacingSimple): UISpacing {
  if (!spacing) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  // Если это UISpacingSimple
  if ('x' in spacing || 'y' in spacing) {
    const x = spacing.x ?? 0;
    const y = spacing.y ?? 0;
    return {
      top: y,
      right: x,
      bottom: y,
      left: x,
    };
  }

  // Если это UISpacing
  return {
    top: spacing.top ?? 0,
    right: spacing.right ?? 0,
    bottom: spacing.bottom ?? 0,
    left: spacing.left ?? 0,
  };
}

/**
 * Получает общую ширину отступов (left + right)
 */
export function getSpacingWidth(spacing?: UISpacing | UISpacingSimple): number {
  const normalized = normalizeSpacing(spacing);
  return normalized.left + normalized.right;
}

/**
 * Получает общую высоту отступов (top + bottom)
 */
export function getSpacingHeight(spacing?: UISpacing | UISpacingSimple): number {
  const normalized = normalizeSpacing(spacing);
  return normalized.top + normalized.bottom;
}

/**
 * Создает стиль по умолчанию для кнопки
 */
export function createButtonStyle(size: 'small' | 'medium' | 'large' = 'medium'): UIStyle {
  const buttonSize = UITheme.sizes.button[size];

  return {
    width: buttonSize.width,
    height: buttonSize.height,
    padding: { x: UITheme.sizes.spacing.md, y: UITheme.sizes.spacing.sm },
    background: {
      color: UITheme.colors.accent.primary,
      alpha: UITheme.alpha.full,
    },
    border: {
      radius: UITheme.sizes.borderRadius.md,
      width: UITheme.sizes.borderWidth.none,
    },
    interactive: true,
    hover: {
      background: {
        color: UITheme.colors.accent.hover,
      },
      scale: UITheme.animations.scale.hover,
    },
    active: {
      background: {
        color: UITheme.colors.accent.secondary,
      },
      scale: UITheme.animations.scale.active,
    },
    disabled: {
      background: {
        color: UITheme.colors.background.secondary,
      },
      alpha: UITheme.alpha.disabled,
    },
  };
}

/**
 * Создает стиль по умолчанию для текста
 */
export function createTextStyle(
  size: 'tiny' | 'small' | 'normal' | 'medium' | 'large' | 'xlarge' | 'xxlarge' = 'normal',
): Partial<Phaser.Types.GameObjects.Text.TextStyle> {
  return {
    fontSize: UITheme.sizes.fontSize[size],
    color: `#${UITheme.colors.text.primary.toString(16).padStart(6, '0')}`,
    fontFamily: UITheme.fonts.primary,
  };
}

/**
 * Создает стиль по умолчанию для input поля
 */
export function createInputStyle(size: 'small' | 'medium' | 'large' = 'medium'): UIStyle {
  const inputSize = UITheme.sizes.input[size];

  return {
    width: inputSize.width,
    height: inputSize.height,
    padding: { x: UITheme.sizes.spacing.sm, y: UITheme.sizes.spacing.sm },
    background: {
      color: UITheme.colors.background.secondary,
      alpha: UITheme.alpha.full,
    },
    border: {
      radius: UITheme.sizes.borderRadius.sm,
      width: UITheme.sizes.borderWidth.thin,
      color: UITheme.colors.border.primary,
    },
    interactive: true,
  };
}

/**
 * Создает стиль по умолчанию для контейнера
 */
export function createContainerStyle(): UIStyle {
  return {
    padding: { x: UITheme.sizes.spacing.md, y: UITheme.sizes.spacing.md },
    background: {
      color: UITheme.colors.background.primary,
      alpha: UITheme.alpha.high,
    },
    border: {
      radius: UITheme.sizes.borderRadius.md,
    },
  };
}

/**
 * Создает стиль по умолчанию для модального окна
 */
export function createModalStyle(): UIStyle {
  return {
    padding: { x: UITheme.sizes.spacing.xl, y: UITheme.sizes.spacing.xl },
    background: {
      color: UITheme.colors.background.primary,
      alpha: UITheme.alpha.full,
    },
    border: {
      radius: UITheme.sizes.borderRadius.lg,
      width: UITheme.sizes.borderWidth.normal,
      color: UITheme.colors.border.accent,
    },
  };
}

/**
 * Создает стиль для оверлея (затемнения фона)
 */
export function createOverlayStyle(): UIStyle {
  return {
    background: {
      color: UITheme.colors.overlay,
      alpha: UITheme.alpha.overlay,
    },
    interactive: true,
  };
}

/**
 * Объединяет два стиля (второй перезаписывает первый)
 */
export function mergeStyles(base: UIStyle, override: UIStyle): UIStyle {
  return {
    ...base,
    ...override,
    padding: override.padding ?? base.padding,
    margin: override.margin ?? base.margin,
    background: { ...base.background, ...override.background },
    border: { ...base.border, ...override.border },
    hover: { ...base.hover, ...override.hover },
    active: { ...base.active, ...override.active },
    disabled: { ...base.disabled, ...override.disabled },
  };
}
