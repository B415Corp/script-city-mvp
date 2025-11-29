/**
 * Общие типы и интерфейсы для UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

/**
 * Позиционирование элемента
 */
export type UIPosition = 'absolute' | 'relative';

/**
 * Направление flex-контейнера
 */
export type UIFlexDirection = 'row' | 'column';

/**
 * Выравнивание элементов по главной оси
 */
export type UIFlexAlign = 'start' | 'center' | 'end' | 'space-between' | 'space-around';

/**
 * Выравнивание элементов по поперечной оси
 */
export type UIFlexJustify = 'start' | 'center' | 'end';

/**
 * Отступы (padding/margin)
 */
export interface UISpacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * Упрощенные отступы (все стороны или горизонталь/вертикаль)
 */
export interface UISpacingSimple {
  x?: number;
  y?: number;
}

/**
 * Фон элемента
 */
export interface UIBackground {
  color?: number;
  alpha?: number;
}

/**
 * Граница элемента
 */
export interface UIBorder {
  width?: number;
  color?: number;
  alpha?: number;
  radius?: number;
}

/**
 * Размеры элемента
 */
export interface UISize {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Тип анимации
 */
export type UIAnimationType = 'fade' | 'scale' | 'slide' | 'none';

/**
 * Направление анимации слайда
 */
export type UISlideDirection = 'left' | 'right' | 'top' | 'bottom';

/**
 * Параметры анимации
 */
export interface UIAnimationConfig {
  type: UIAnimationType;
  duration?: number;
  ease?: string;
  delay?: number;
  slideDirection?: UISlideDirection;
  from?: number;
  to?: number;
}

/**
 * Стили hover состояния
 */
export interface UIHoverStyle {
  background?: UIBackground;
  scale?: number;
  alpha?: number;
}

/**
 * Стили active состояния
 */
export interface UIActiveStyle {
  background?: UIBackground;
  scale?: number;
  alpha?: number;
}

/**
 * Стили disabled состояния
 */
export interface UIDisabledStyle {
  background?: UIBackground;
  alpha?: number;
}

/**
 * Полный набор стилей для UI элемента
 */
export interface UIStyle {
  position?: UIPosition;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  padding?: UISpacing | UISpacingSimple;
  margin?: UISpacing | UISpacingSimple;
  background?: UIBackground;
  border?: UIBorder;
  alpha?: number;
  visible?: boolean;
  interactive?: boolean;
  hover?: UIHoverStyle;
  active?: UIActiveStyle;
  disabled?: UIDisabledStyle;
}

/**
 * Обработчики событий UI элемента
 */
export interface UIEventHandlers {
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onChange?: (value: string | number | boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Конфигурация UI компонента
 */
export interface UIComponentConfig {
  style?: UIStyle;
  events?: UIEventHandlers;
  animation?: UIAnimationConfig;
  depth?: number;
}

/**
 * Результат расчета размеров элемента
 */
export interface UIComputedSize {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
}

/**
 * Позиция элемента после расчета
 */
export interface UIComputedPosition {
  x: number;
  y: number;
}
