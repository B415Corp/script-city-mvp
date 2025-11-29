/**
 * Примеры использования layout систем UI Kit.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIButton, UIText } from '../components';
import { UIContainer } from '../layouts';
import { UITheme } from '../core/ui_theme';

/**
 * Пример вертикального layout (column)
 */
export function createColumnLayoutExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'column',
    align: 'center',
    justify: 'start',
    gap: 16,
    style: {
      x: 200,
      y: 300,
      width: 300,
      height: 400,
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
    text: 'Column Layout',
    fontSize: 'large',
  });
  title.create();
  container.addUIComponent(title);

  // Кнопки
  for (let i = 1; i <= 3; i++) {
    const button = new UIButton(scene, core, {
      text: `Button ${i}`,
      size: 'medium',
      events: {
        onClick: () => console.warn(`Button ${i} clicked!`),
      },
    });
    button.create();
    container.addUIComponent(button);
  }

  return container;
}

/**
 * Пример горизонтального layout (row)
 */
export function createRowLayoutExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'row',
    align: 'center',
    justify: 'start',
    gap: 16,
    style: {
      x: 600,
      y: 300,
      width: 600,
      height: 100,
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

  // Кнопки в ряд
  for (let i = 1; i <= 4; i++) {
    const button = new UIButton(scene, core, {
      text: `${i}`,
      size: 'small',
      events: {
        onClick: () => console.warn(`Button ${i} clicked!`),
      },
    });
    button.create();
    container.addUIComponent(button);
  }

  return container;
}

/**
 * Пример space-between выравнивания
 */
export function createSpaceBetweenExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const container = new UIContainer(scene, core, {
    direction: 'row',
    align: 'space-between',
    justify: 'center',
    gap: 0,
    style: {
      x: 600,
      y: 450,
      width: 600,
      height: 100,
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

  // Кнопки с равными отступами между ними
  for (let i = 1; i <= 3; i++) {
    const button = new UIButton(scene, core, {
      text: `${i}`,
      size: 'medium',
      events: {
        onClick: () => console.warn(`Button ${i} clicked!`),
      },
    });
    button.create();
    container.addUIComponent(button);
  }

  return container;
}

/**
 * Пример вложенных layouts
 */
export function createNestedLayoutExample(scene: Phaser.Scene, core: GameCore): UIContainer {
  const mainContainer = new UIContainer(scene, core, {
    direction: 'column',
    align: 'center',
    justify: 'start',
    gap: 16,
    style: {
      x: 200,
      y: 700,
      width: 400,
      height: 300,
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
  mainContainer.create();

  // Заголовок
  const title = new UIText(scene, core, {
    text: 'Nested Layout',
    fontSize: 'large',
  });
  title.create();
  mainContainer.addUIComponent(title);

  // Вложенный горизонтальный контейнер
  const rowContainer = new UIContainer(scene, core, {
    direction: 'row',
    align: 'center',
    justify: 'center',
    gap: 12,
    style: {
      padding: { x: 12, y: 12 },
      background: {
        color: UITheme.colors.background.secondary,
        alpha: 1,
      },
      border: {
        radius: UITheme.sizes.borderRadius.md,
      },
    },
  });
  rowContainer.create();

  // Кнопки во вложенном контейнере
  for (let i = 1; i <= 3; i++) {
    const button = new UIButton(scene, core, {
      text: `${i}`,
      size: 'small',
      events: {
        onClick: () => console.warn(`Nested button ${i} clicked!`),
      },
    });
    button.create();
    rowContainer.addUIComponent(button);
  }

  mainContainer.addUIComponent(rowContainer);

  return mainContainer;
}
