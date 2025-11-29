# UI Kit для Phaser

**Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`

Легковесная система UI компонентов для Phaser, разработанная специально для проекта Script City.

## ✨ Особенности

- 🎨 **CSS-подобные свойства**: padding, margin, border-radius, background и др.
- 📦 **Flexbox-like layout**: автоматическое позиционирование элементов
- 🎬 **Продвинутые анимации**: fade, scale, slide с использованием Phaser Tweens
- 🎯 **Единая тема**: консистентный стиль всего UI
- 🧩 **Модульная архитектура**: легко расширять и кастомизировать
- 📱 **Responsive**: поддержка изменения размеров экрана
- ⚡ **Производительность**: оптимизированный код, минимум overhead

## 📦 Установка

UI Kit уже включен в проект. Просто импортируйте нужные компоненты:

```typescript
import { UIButton, UIText, UIContainer } from '@/ui_kit';
```

## 🚀 Быстрый старт

```typescript
import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIButton, UIContainer } from '@/ui_kit';

class MyScene extends Phaser.Scene {
  private core!: GameCore;

  create() {
    // Создаем контейнер
    const container = new UIContainer(this, this.core, {
      direction: 'column',
      gap: 16,
      style: {
        x: 400,
        y: 300,
        padding: { x: 24, y: 24 },
      },
    });
    container.create();

    // Создаем кнопку
    const button = new UIButton(this, this.core, {
      text: 'Click Me!',
      size: 'medium',
      variant: 'primary',
      events: {
        onClick: () => console.warn('Button clicked!'),
      },
    });
    button.create();

    // Добавляем кнопку в контейнер
    container.addUIComponent(button);
  }
}
```

## 📚 Документация

- **[UI Kit Guide](../../docs/tutorials/ui-kit-guide.md)** - Полное руководство по использованию
- **[Refactoring Example](./examples/refactoring_example.md)** - Пример рефакторинга существующих компонентов

## 🧩 Компоненты

### Базовые компоненты

- **UIButton** - Кнопка с hover/active эффектами
- **UIText** - Текст с различными размерами
- **UICheckbox** - Чекбокс с label
- **UIRadio** - Радио-кнопка с группировкой

### Компоненты форм

- **UIInput** - Текстовое поле ввода
- **UISlider** - Слайдер с показом значения
- **UIDropdown** - Выпадающий список
- **UIProgressBar** - Индикатор прогресса

### Сложные компоненты

- **UIModal** - Модальное окно
- **UITooltip** - Всплывающая подсказка
- **UITabs** - Вкладки с переключением

### Layout

- **UIContainer** - Flexbox-подобный контейнер
  - `sizeMode.width/height`: `content` (по умолчанию, если размер не задан) заставляет контейнер подстраиваться под содержимое, `fixed` уважает заданные `style.width`/`style.height` и позволяет растягивать контейнер, например, на всю ширину экрана.

## 📁 Структура

```
ui_kit/
├── core/                  # Базовая инфраструктура
│   ├── types.ts          # Типы и интерфейсы
│   ├── ui_theme.ts       # Единая тема
│   ├── ui_style.ts       # Система стилей
│   ├── ui_animator.ts    # Система анимаций
│   └── ui_base_component.ts  # Базовый компонент
├── layouts/              # Layout системы
│   └── ui_container.ts   # Flexbox-like контейнер
├── components/           # UI компоненты
│   ├── ui_button.ts
│   ├── ui_text.ts
│   ├── ui_checkbox.ts
│   ├── ui_radio.ts
│   ├── ui_input.ts
│   ├── ui_slider.ts
│   ├── ui_dropdown.ts
│   ├── ui_progress_bar.ts
│   ├── ui_modal.ts
│   ├── ui_tooltip.ts
│   └── ui_tabs.ts
├── examples/             # Примеры использования
│   ├── example_basic.ts
│   ├── example_layouts.ts
│   ├── example_forms.ts
│   ├── example_modal.ts
│   └── refactoring_example.md
├── index.ts             # Главный экспорт
└── README.md           # Этот файл
```

## 🎨 Темы

UI Kit использует единую темную тему, определенную в `UITheme`:

```typescript
import { UITheme } from '@/ui_kit';

// Цвета
UITheme.colors.accent.primary; // Акцентный цвет
UITheme.colors.text.primary; // Цвет текста
UITheme.colors.background.primary; // Цвет фона

// Размеры
UITheme.sizes.spacing.md; // 16px
UITheme.sizes.borderRadius.lg; // 12px
UITheme.sizes.fontSize.normal; // '14px'

// Анимации
UITheme.animations.duration.normal; // 250ms
UITheme.animations.easing.easeOut; // 'Quad.easeOut'
```

## 🎯 Примеры

### Кнопка

```typescript
const button = new UIButton(scene, core, {
  text: 'Click Me',
  size: 'medium',
  variant: 'success',
  events: {
    onClick: () => console.warn('Clicked!'),
  },
});
button.create();
```

### Форма

```typescript
const container = new UIContainer(scene, core, {
  direction: 'column',
  gap: 16,
});
container.create();

const input = new UIInput(scene, core, {
  placeholder: 'Enter name',
});
input.create();
container.addUIComponent(input);

const button = new UIButton(scene, core, {
  text: 'Submit',
  events: {
    onClick: () => console.warn('Name:', input.getValue()),
  },
});
button.create();
container.addUIComponent(button);
```

### Модальное окно

```typescript
const modal = new UIModal(scene, core, {
  width: 500,
  height: 300,
});
modal.create();

const content = new UIText(scene, core, {
  text: 'Modal content',
});
content.create();
modal.addContent(content.container);

modal.open();
```

## 🔧 Интеграция

UI Kit интегрируется с существующей архитектурой проекта:

- Наследуется от `UIComponent` из `@/core/ui/ui_component`
- Использует существующую систему depth layers
- Совместим с `GameCore` и системой событий
- Поддерживает все функции Phaser

## 📖 Best Practices

1. **Используйте темы**: Не хардкодите цвета, используйте `UITheme`
2. **Группируйте компоненты**: Используйте `UIContainer` для организации
3. **События вместо прямых вызовов**: Используйте `events` параметр
4. **Очищайте ресурсы**: Вызывайте `destroy()` при удалении
5. **Вложенные layouts**: Используйте контейнеры внутри контейнеров

## 🚧 Развитие

Планируемые функции:

- [ ] Поддержка кастомных тем
- [ ] Drag & Drop компоненты
- [ ] Scroll контейнеры
- [ ] Context меню
- [ ] Notification система
- [ ] Дополнительные анимации
- [ ] Светлая тема

## 📝 Лицензия

Часть проекта Script City. Все права защищены.

---

**Автор**: Script City Team
**Дата создания**: 2025-11-27
**Версия**: 1.0.0
