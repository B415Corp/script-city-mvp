# Пример рефакторинга существующего UI компонента

**Теги**: `arch:ui`, `arch:ui-kit`, `guide:refactoring`

## До: Старый подход (main_menu_button.ts)

```typescript
// src/ui/main_menu_buttons/main_menu_button.ts
import Phaser from 'phaser';

export interface MainMenuButtonStyle {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  padding?: { x: number; y: number };
}

export interface MainMenuButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  onClick: () => void;
  style?: MainMenuButtonStyle;
}

export function createMainMenuButton(config: MainMenuButtonConfig): Phaser.GameObjects.Text {
  const { scene, x, y, text, onClick, style = {} } = config;

  const defaultStyle: Required<MainMenuButtonStyle> = {
    fontSize: '32px',
    color: '#ffffff',
    fontFamily: 'Arial',
    backgroundColor: '#34495e',
    hoverBackgroundColor: '#2c3e50',
    padding: { x: 20, y: 10 },
  };

  const finalStyle = {
    fontSize: style.fontSize ?? defaultStyle.fontSize,
    color: style.color ?? defaultStyle.color,
    fontFamily: style.fontFamily ?? defaultStyle.fontFamily,
    backgroundColor: style.backgroundColor ?? defaultStyle.backgroundColor,
    padding: style.padding ?? defaultStyle.padding,
  };

  const hoverBackgroundColor = style.hoverBackgroundColor ?? defaultStyle.hoverBackgroundColor;

  const button = scene.add
    .text(x, y, text, finalStyle)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      button.setStyle({ backgroundColor: hoverBackgroundColor });
    })
    .on('pointerout', () => {
      button.setStyle({ backgroundColor: finalStyle.backgroundColor });
    })
    .on('pointerdown', onClick);

  return button;
}
```

### Проблемы старого подхода:

1. ❌ Ручное управление стилями и состояниями
2. ❌ Дублирование кода для каждой кнопки
3. ❌ Нет поддержки анимаций
4. ❌ Хардкод цветов и размеров
5. ❌ Нет использования единой темы
6. ❌ Ограниченные возможности кастомизации
7. ❌ Нет поддержки disabled состояния
8. ❌ Возвращает Phaser.GameObjects.Text вместо компонента

## После: Новый подход с UI Kit

```typescript
// src/ui/main_menu_buttons/main_menu_button_v2.ts
import Phaser from 'phaser';
import { UIButton, UITheme } from '@/ui_kit';
import { GameCore } from '@/core/game_core/game_core';

export function createMainMenuButton(
  scene: Phaser.Scene,
  core: GameCore,
  config: {
    x: number;
    y: number;
    text: string;
    onClick: () => void;
  },
): UIButton {
  const button = new UIButton(scene, core, {
    text: config.text,
    size: 'large',
    style: {
      x: config.x,
      y: config.y,
      // Используем тему вместо хардкода
      background: {
        color: UITheme.colors.background.tertiary,
        alpha: 1,
      },
      hover: {
        background: {
          color: UITheme.colors.background.secondary,
        },
        scale: 1.05, // Добавили анимацию hover
      },
      active: {
        background: {
          color: UITheme.colors.background.primary,
        },
        scale: 0.95, // Добавили анимацию нажатия
      },
    },
    events: {
      onClick: config.onClick,
    },
    animation: {
      type: 'fade', // Добавили анимацию появления
      duration: UITheme.animations.duration.normal,
    },
  });

  button.create();
  return button;
}
```

### Преимущества нового подхода:

1. ✅ Автоматическое управление состояниями (hover, active, disabled)
2. ✅ Единый стиль через UITheme
3. ✅ Встроенные анимации
4. ✅ Меньше кода (в 2 раза короче)
5. ✅ Больше возможностей кастомизации
6. ✅ Поддержка всех функций UIButton
7. ✅ Консистентность с остальным UI
8. ✅ Возвращает компонент с полным API

## Использование

### До:

```typescript
// В MainMenu
const startButton = createMainMenuButton({
  scene: this,
  x: centerX,
  y: centerY - 60,
  text: 'Start Game',
  onClick: () => this.scene.start('GameScene'),
});
```

### После:

```typescript
// В MainMenu (требуется GameCore)
const startButton = createMainMenuButton(
  this,
  this.core, // Предполагается, что core передается в сцену
  {
    x: centerX,
    y: centerY - 60,
    text: 'Start Game',
    onClick: () => this.scene.start('GameScene'),
  },
);

// Дополнительные возможности:
startButton.setDisabled(false);
startButton.setText('New Game');
startButton.updateStyle({
  /* ... */
});
```

## Рефакторинг существующих компонентов

### Пошаговый процесс:

1. **Определите компонент для рефакторинга**
   - Начните с простых компонентов (кнопки, тексты)
   - Затем переходите к сложным (формы, панели)

2. **Найдите соответствующий компонент UI Kit**
   - UIButton для кнопок
   - UIText для текста
   - UIContainer для панелей
   - UIInput для полей ввода

3. **Перепишите компонент**
   - Замените прямые вызовы Phaser API на UI Kit
   - Используйте UITheme вместо хардкода
   - Добавьте анимации где нужно

4. **Обновите вызовы**
   - Обновите места где используется компонент
   - Добавьте передачу GameCore если нужно

5. **Тестируйте**
   - Проверьте визуал
   - Проверьте функциональность
   - Проверьте производительность

### Рекомендуемый порядок рефакторинга:

1. ✅ Кнопки главного меню (main_menu_button)
2. Кнопки управления скоростью (speed_controls)
3. Панели (bottom_bar, top_bar)
4. Модальные окна (game_menu_modal)
5. Сложные компоненты (debug_window)

## Важные заметки

### Когда НЕ нужно рефакторить:

- Компонент работает стабильно и не планируется изменять
- Компонент сильно завязан на специфическую логику Phaser
- Компонент используется в критических местах и рефакторинг может внести баги

### Когда НУЖНО рефакторить:

- Компонент часто изменяется
- Нужно добавить анимации или улучшить UX
- Компонент дублирует функциональность UI Kit
- Нужно унифицировать стиль UI

## Миграционная стратегия

### Подход 1: Постепенный (Рекомендуется)

```typescript
// Создайте новую версию компонента
// src/ui/main_menu_buttons/main_menu_button_v2.ts
export function createMainMenuButtonV2(...) { /* UI Kit */ }

// Оставьте старую версию
// src/ui/main_menu_buttons/main_menu_button.ts
export function createMainMenuButton(...) { /* Old code */ }

// Постепенно мигрируйте использования
```

### Подход 2: Полная замена

```typescript
// Замените всю реализацию сразу
// src/ui/main_menu_buttons/main_menu_button.ts
export function createMainMenuButton(...) { /* UI Kit */ }

// Обновите все использования за один раз
```

### Подход 3: Обертка (Временное решение)

```typescript
// Оберните UI Kit компонент в старый API
export function createMainMenuButton(config: OldConfig): Phaser.GameObjects.Text {
  const button = new UIButton(scene, core, {
    // конвертируем config
  });
  button.create();

  // Возвращаем контейнер для обратной совместимости
  return button.container as any; // HACK: временное решение
}
```

---

**Рекомендация**: Используйте Подход 1 (постепенный) для минимизации рисков и возможности откатиться в случае проблем.
