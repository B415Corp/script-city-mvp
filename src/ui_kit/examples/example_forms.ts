/**
 * Примеры использования компонентов форм UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIInput, UISlider, UIDropdown, UIProgressBar, UIText, UIButton } from '../components';
import { UIContainer } from '../layouts';
import { UITheme } from '../core/ui_theme';

/**
 * Пример создания формы с input полями
 */
export function createInputFormExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'start',
    justify: 'start',
    gap: 16,
    style: {
      x: 200,
      y: 100,
      width: 400,
      height: 300,
      padding: { x: 24, y: 24 },
      background: {
        color: UITheme.colors.background.secondary,
        alpha: 1,
      },
      border: {
        radius: UITheme.sizes.borderRadius.lg,
      },
    },
  });
  container.create();

  // Заголовок формы
  const title = new UIText(scene, core, {
    text: 'User Form',
    fontSize: 'large',
  });
  title.create();
  container.addUIComponent(title);

  // Input для имени
  const nameLabel = new UIText(scene, core, {
    text: 'Name:',
    fontSize: 'small',
  });
  nameLabel.create();
  container.addUIComponent(nameLabel);

  const nameInput = new UIInput(scene, core, {
    placeholder: 'Enter your name',
    size: 'medium',
    events: {
      onChange: (value) => console.warn(`Name: ${value}`),
    },
  });
  nameInput.create();
  container.addUIComponent(nameInput);

  // Input для email
  const emailLabel = new UIText(scene, core, {
    text: 'Email:',
    fontSize: 'small',
  });
  emailLabel.create();
  container.addUIComponent(emailLabel);

  const emailInput = new UIInput(scene, core, {
    placeholder: 'Enter your email',
    size: 'medium',
    type: 'text',
    events: {
      onChange: (value) => console.warn(`Email: ${value}`),
    },
  });
  emailInput.create();
  container.addUIComponent(emailInput);

  // Кнопка отправки
  const submitButton = new UIButton(scene, core, {
    text: 'Submit',
    size: 'medium',
    variant: 'success',
    events: {
      onClick: () => {
        console.warn('Form submitted!');
        console.warn('Name:', nameInput.getValue());
        console.warn('Email:', emailInput.getValue());
      },
    },
  });
  submitButton.create();
  container.addUIComponent(submitButton);

  return container;
}

/**
 * Пример создания слайдеров
 */
export function createSliderExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'start',
    justify: 'start',
    gap: 24,
    style: {
      x: 700,
      y: 100,
      width: 400,
      height: 300,
      padding: { x: 24, y: 24 },
      background: {
        color: UITheme.colors.background.secondary,
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
    text: 'Settings',
    fontSize: 'large',
  });
  title.create();
  container.addUIComponent(title);

  // Слайдер громкости
  const volumeSlider = new UISlider(scene, core, {
    label: 'Volume',
    min: 0,
    max: 100,
    value: 75,
    step: 5,
    width: 300,
    showValue: true,
    events: {
      onChange: (value) => console.warn(`Volume: ${value}`),
    },
  });
  volumeSlider.create();
  container.addUIComponent(volumeSlider);

  // Слайдер яркости
  const brightnessSlider = new UISlider(scene, core, {
    label: 'Brightness',
    min: 0,
    max: 100,
    value: 50,
    step: 10,
    width: 300,
    showValue: true,
    events: {
      onChange: (value) => console.warn(`Brightness: ${value}`),
    },
  });
  brightnessSlider.create();
  container.addUIComponent(brightnessSlider);

  return container;
}

/**
 * Пример создания dropdown меню
 */
export function createDropdownExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'start',
    justify: 'start',
    gap: 16,
    style: {
      x: 200,
      y: 500,
      width: 400,
      height: 200,
      padding: { x: 24, y: 24 },
      background: {
        color: UITheme.colors.background.secondary,
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
    text: 'Select Options',
    fontSize: 'large',
  });
  title.create();
  container.addUIComponent(title);

  // Dropdown для выбора страны
  const countryDropdown = new UIDropdown(scene, core, {
    options: [
      { label: 'United States', value: 'us' },
      { label: 'United Kingdom', value: 'uk' },
      { label: 'Germany', value: 'de' },
      { label: 'France', value: 'fr' },
      { label: 'Russia', value: 'ru' },
    ],
    placeholder: 'Select country',
    size: 'medium',
    style: {
      width: 300,
    },
    events: {
      onChange: (value) => console.warn(`Selected country: ${value}`),
    },
  });
  countryDropdown.create();
  container.addUIComponent(countryDropdown);

  return container;
}

/**
 * Пример создания progress bar
 */
export function createProgressBarExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'start',
    justify: 'start',
    gap: 16,
    style: {
      x: 700,
      y: 500,
      width: 400,
      height: 300,
      padding: { x: 24, y: 24 },
      background: {
        color: UITheme.colors.background.secondary,
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
    text: 'Progress Indicators',
    fontSize: 'large',
  });
  title.create();
  container.addUIComponent(title);

  // Progress bar - normal
  const normalProgress = new UIProgressBar(scene, core, {
    value: 45,
    width: 300,
    variant: 'normal',
    showPercentage: true,
  });
  normalProgress.create();
  container.addUIComponent(normalProgress);

  // Progress bar - success
  const successProgress = new UIProgressBar(scene, core, {
    value: 100,
    width: 300,
    variant: 'success',
    showPercentage: true,
  });
  successProgress.create();
  container.addUIComponent(successProgress);

  // Progress bar - warning
  const warningProgress = new UIProgressBar(scene, core, {
    value: 65,
    width: 300,
    variant: 'warning',
    showPercentage: true,
  });
  warningProgress.create();
  container.addUIComponent(warningProgress);

  // Progress bar - error
  const errorProgress = new UIProgressBar(scene, core, {
    value: 25,
    width: 300,
    variant: 'error',
    showPercentage: true,
  });
  errorProgress.create();
  container.addUIComponent(errorProgress);

  // Кнопка для анимации прогресса
  const animateButton = new UIButton(scene, core, {
    text: 'Animate Progress',
    size: 'small',
    events: {
      onClick: () => {
        normalProgress.setValue(Math.random() * 100);
      },
    },
  });
  animateButton.create();
  container.addUIComponent(animateButton);

  return container;
}
