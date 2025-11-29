/**
 * Примеры использования базовых компонентов UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIButton, UIText, UICheckbox, UIRadio } from '../components';
import { UIContainer } from '../layouts';

/**
 * Пример создания кнопок
 */
export function createButtonExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    gap: 16,
    style: {
      x: 100,
      y: 100,
      padding: { x: 24, y: 24 },
    },
  });
  container.create();

  // Primary кнопка
  const primaryButton = new UIButton(scene, core, {
    text: 'Primary Button',
    size: 'medium',
    variant: 'primary',
    events: {
      onClick: () => console.warn('Primary button clicked!'),
    },
  });
  primaryButton.create();
  container.addUIComponent(primaryButton);

  // Success кнопка
  const successButton = new UIButton(scene, core, {
    text: 'Success Button',
    size: 'medium',
    variant: 'success',
    events: {
      onClick: () => console.warn('Success button clicked!'),
    },
  });
  successButton.create();
  container.addUIComponent(successButton);

  // Warning кнопка
  const warningButton = new UIButton(scene, core, {
    text: 'Warning Button',
    size: 'medium',
    variant: 'warning',
    events: {
      onClick: () => console.warn('Warning button clicked!'),
    },
  });
  warningButton.create();
  container.addUIComponent(warningButton);

  // Error кнопка
  const errorButton = new UIButton(scene, core, {
    text: 'Error Button',
    size: 'medium',
    variant: 'error',
    events: {
      onClick: () => console.warn('Error button clicked!'),
    },
  });
  errorButton.create();
  container.addUIComponent(errorButton);

  return container;
}

/**
 * Пример создания текстов
 */
export function createTextExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    gap: 8,
    style: {
      x: 400,
      y: 100,
    },
  });
  container.create();

  // Разные размеры текста
  const sizes: Array<'tiny' | 'small' | 'normal' | 'medium' | 'large' | 'xlarge' | 'xxlarge'> = [
    'tiny',
    'small',
    'normal',
    'medium',
    'large',
    'xlarge',
    'xxlarge',
  ];

  sizes.forEach((size) => {
    const text = new UIText(scene, core, {
      text: `Text ${size}`,
      fontSize: size,
    });
    text.create();
    container.addUIComponent(text);
  });

  return container;
}

/**
 * Пример создания чекбоксов
 */
export function createCheckboxExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
    style: {
      x: 700,
      y: 100,
    },
  });
  container.create();

  // Чекбоксы с разными опциями
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  options.forEach((label) => {
    const checkbox = new UICheckbox(scene, core, {
      label,
      events: {
        onChange: (checked) => console.warn(`${label}: ${checked}`),
      },
    });
    checkbox.create();
    container.addUIComponent(checkbox);
  });

  return container;
}

/**
 * Пример создания радио-кнопок
 */
export function createRadioExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    gap: 12,
    style: {
      x: 900,
      y: 100,
    },
  });
  container.create();

  // Радио-кнопки в одной группе
  const options = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' },
  ];

  options.forEach((option) => {
    const radio = new UIRadio(scene, core, {
      label: option.label,
      value: option.value,
      group: 'example-group',
      events: {
        onChange: (value) => console.warn(`Selected: ${value}`),
      },
    });
    radio.create();
    container.addUIComponent(radio);
  });

  return container;
}
