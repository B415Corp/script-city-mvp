/**
 * Примеры использования модальных окон и сложных компонентов UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIModal, UITabs, UITooltip, UIButton, UIText, addTooltipToElement } from '../components';
import { UIContainer } from '../layouts';
import { UITheme } from '../core/ui_theme';

/**
 * Пример создания модального окна
 */
export function createModalExample(
  scene: Phaser.Scene,
  core: GameCore,
): {
  button: UIButton;
  modal: UIModal;
} {
  // Кнопка для открытия модального окна
  const openButton = new UIButton(scene, core, {
    text: 'Open Modal',
    size: 'medium',
    style: {
      x: 200,
      y: 100,
    },
  });
  openButton.create();

  // Создаем модальное окно
  const modal = new UIModal(scene, core, {
    width: 500,
    height: 300,
    closeOnOverlayClick: true,
    closeOnEsc: true,
    animation: {
      type: 'scale',
      duration: UITheme.animations.duration.normal,
    },
  });
  modal.create();

  // Создаем контент модального окна
  const modalContent = new UIContainer(scene, core, {
    direction: 'column',
    align: 'center',
    justify: 'center',
    gap: 24,
  });
  modalContent.create();

  // Заголовок
  const title = new UIText(scene, core, {
    text: 'Modal Window',
    fontSize: 'xlarge',
  });
  title.create();
  modalContent.addUIComponent(title);

  // Текст
  const description = new UIText(scene, core, {
    text: 'This is a modal window example.',
    fontSize: 'normal',
  });
  description.create();
  modalContent.addUIComponent(description);

  // Кнопка закрытия
  const closeButton = new UIButton(scene, core, {
    text: 'Close',
    size: 'medium',
    variant: 'error',
    events: {
      onClick: () => modal.close(),
    },
  });
  closeButton.create();
  modalContent.addUIComponent(closeButton);

  modal.addContent(modalContent.container);

  // Привязываем открытие модального окна к кнопке
  openButton.updateStyle({
    ...openButton['style'],
    events: {
      onClick: () => modal.open(),
    },
  });

  return { button: openButton, modal };
}

/**
 * Пример создания вкладок
 */
export function createTabsExample(scene: Phaser.Scene, core: GameCore): UITabs {
  // Создаем контент для каждой вкладки
  const tab1Content = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  tab1Content.create();

  const tab1Text = new UIText(scene, core, {
    text: 'This is Tab 1 content',
    fontSize: 'normal',
  });
  tab1Text.create();
  tab1Content.addUIComponent(tab1Text);

  const tab2Content = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  tab2Content.create();

  const tab2Text = new UIText(scene, core, {
    text: 'This is Tab 2 content',
    fontSize: 'normal',
  });
  tab2Text.create();
  tab2Content.addUIComponent(tab2Text);

  const tab3Content = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  tab3Content.create();

  const tab3Text = new UIText(scene, core, {
    text: 'This is Tab 3 content',
    fontSize: 'normal',
  });
  tab3Text.create();
  tab3Content.addUIComponent(tab3Text);

  // Создаем tabs
  const tabs = new UITabs(scene, core, {
    tabs: [
      { id: 'tab1', label: 'Tab 1', content: tab1Content.container },
      { id: 'tab2', label: 'Tab 2', content: tab2Content.container },
      { id: 'tab3', label: 'Tab 3', content: tab3Content.container },
    ],
    activeTabId: 'tab1',
    style: {
      x: 600,
      y: 200,
      width: 400,
      height: 300,
    },
    onTabChange: (tabId) => console.warn(`Active tab: ${tabId}`),
  });
  tabs.create();

  return tabs;
}

/**
 * Пример создания tooltip
 */
export function createTooltipExample(
  scene: Phaser.Scene,
  core: GameCore,
): {
  button: UIButton;
  tooltip: UITooltip;
} {
  // Кнопка с tooltip
  const button = new UIButton(scene, core, {
    text: 'Hover me',
    size: 'medium',
    style: {
      x: 200,
      y: 400,
    },
  });
  button.create();

  // Добавляем tooltip к кнопке
  const tooltip = addTooltipToElement(scene, core, button.container, {
    text: 'This is a helpful tooltip!',
    position: 'top',
    delay: 500,
  });

  return { button, tooltip };
}

/**
 * Комплексный пример со всеми сложными компонентами
 */
export function createComplexExample(
  scene: Phaser.Scene,
  core: GameCore,
): {
  container: UIContainer;
  modal: UIModal;
  tabs: UITabs;
} {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'center',
    justify: 'start',
    gap: 16,
    style: {
      x: 400,
      y: 100,
      width: 600,
      height: 500,
      padding: { x: 24, y: 24 },
      background: {
        color: UITheme.colors.background.primary,
        alpha: 1,
      },
      border: {
        radius: UITheme.sizes.borderRadius.lg,
      },
    },
  });
  container.create();

  // Заголовок
  const title = new UIText(scene, core, {
    text: 'Complex UI Example',
    fontSize: 'xxlarge',
  });
  title.create();
  container.addUIComponent(title);

  // Кнопка открытия модального окна
  const modalButton = new UIButton(scene, core, {
    text: 'Open Settings',
    size: 'large',
  });
  modalButton.create();

  // Добавляем tooltip к кнопке
  addTooltipToElement(scene, core, modalButton.container, {
    text: 'Click to open settings modal',
    position: 'bottom',
  });

  container.addUIComponent(modalButton);

  // Создаем модальное окно с вкладками
  const modal = new UIModal(scene, core, {
    width: 600,
    height: 400,
    closeOnOverlayClick: true,
    closeOnEsc: true,
  });
  modal.create();

  // Создаем вкладки для модального окна
  const tabs = createTabsForModal(scene, core);
  modal.addContent(tabs.container);

  // Привязываем открытие модального окна
  modalButton.updateStyle({
    ...modalButton['style'],
    events: {
      onClick: () => modal.open(),
    },
  });

  return { container, modal, tabs };
}

/**
 * Вспомогательная функция для создания вкладок для модального окна
 */
function createTabsForModal(scene: Phaser.Scene, core: GameCore): UITabs {
  // Контент вкладки "General"
  const generalContent = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  generalContent.create();

  const generalText = new UIText(scene, core, {
    text: 'General Settings',
    fontSize: 'medium',
  });
  generalText.create();
  generalContent.addUIComponent(generalText);

  // Контент вкладки "Display"
  const displayContent = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  displayContent.create();

  const displayText = new UIText(scene, core, {
    text: 'Display Settings',
    fontSize: 'medium',
  });
  displayText.create();
  displayContent.addUIComponent(displayText);

  // Контент вкладки "Audio"
  const audioContent = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
  });
  audioContent.create();

  const audioText = new UIText(scene, core, {
    text: 'Audio Settings',
    fontSize: 'medium',
  });
  audioText.create();
  audioContent.addUIComponent(audioText);

  // Создаем tabs
  const tabs = new UITabs(scene, core, {
    tabs: [
      { id: 'general', label: 'General', content: generalContent.container },
      { id: 'display', label: 'Display', content: displayContent.container },
      { id: 'audio', label: 'Audio', content: audioContent.container },
    ],
    activeTabId: 'general',
    style: {
      width: 550,
      height: 300,
    },
  });
  tabs.create();

  return tabs;
}
