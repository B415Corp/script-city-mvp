/**
 * Экспорты UI компонентов UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

// Базовые компоненты
export { UIButton } from './ui_button';
export type { UIButtonConfig } from './ui_button';

export { UIText } from './ui_text';
export type { UITextConfig } from './ui_text';

export { UICheckbox } from './ui_checkbox';
export type { UICheckboxConfig } from './ui_checkbox';

export { UIRadio } from './ui_radio';
export type { UIRadioConfig } from './ui_radio';

// Компоненты форм
export { UIInput } from './ui_input';
export type { UIInputConfig } from './ui_input';

export { UISlider } from './ui_slider';
export type { UISliderConfig } from './ui_slider';

export { UIDropdown } from './ui_dropdown';
export type { UIDropdownConfig, UIDropdownOption } from './ui_dropdown';

export { UIProgressBar } from './ui_progress_bar';
export type { UIProgressBarConfig } from './ui_progress_bar';

// Сложные компоненты
export { UIModal } from './ui_modal';
export type { UIModalConfig } from './ui_modal';

export { UITooltip, addTooltipToElement } from './ui_tooltip';
export type { UITooltipConfig, UITooltipPosition } from './ui_tooltip';

export { UITabs } from './ui_tabs';
export type { UITabsConfig, UITab } from './ui_tabs';

export { UINotification, showNotification } from './ui_notification';
export type {
  UINotificationConfig,
  UINotificationType,
  UINotificationPosition,
} from './ui_notification';
