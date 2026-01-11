# UI Components Architecture

Папка `src/ui` разделена на два типа UI компонентов для разных целей:

## 📁 Структура

```
src/ui/
├── html/          # HTML/CSS/JS компоненты для веб-интерфейса
├── phaser/        # Phaser UI компоненты для игровых элементов
├── index.ts       # Экспорт всех компонентов
└── README.md      # Эта документация
```

## 🌐 HTML Components (`src/ui/html/`)

Компоненты для создания веб-интерфейса с использованием HTML, CSS и JavaScript/TypeScript. Используются для панелей инструментов, модальных окон, форм и других элементов управления.

### Основные компоненты:

#### `BaseHTMLElement`
Базовый класс для всех HTML компонентов. Предоставляет общий функционал для создания, стилизации и управления DOM элементами.

#### `HTMLButton`
HTML кнопка с поддержкой различных стилей, размеров и состояний.

```typescript
import { HTMLButton } from '@/ui/html';

const button = new HTMLButton({
  label: 'Click me',
  variant: 'primary',
  size: 'medium',
  onClick: () => console.log('Clicked!')
});

button.appendTo('#toolbar');
```

#### `HTMLToolbar`
Панель инструментов для группировки кнопок и элементов управления.

```typescript
import { HTMLToolbar } from '@/ui/html';

const toolbar = new HTMLToolbar({
  position: 'top',
  orientation: 'horizontal',
  tools: [
    { label: 'Select', onClick: () => {} },
    { label: 'Move', onClick: () => {} },
    { label: 'Delete', onClick: () => {} }
  ]
});

toolbar.appendTo(document.body);
```

### Стилизация

Все стили определены в `styles.css`. Компоненты используют CSS классы для гибкой кастомизации.

## 🎮 Phaser Components (`src/ui/phaser/`)

Компоненты для создания UI элементов внутри Phaser игры. Используются для игровых интерфейсов, HUD, меню и других элементов, рендерящихся в игровом мире.

### Основные компоненты:

#### `BaseUI`
Базовый класс для всех Phaser UI компонентов. Управляет позиционированием, состоянием и интерактивностью в Phaser сцене.

#### `ButtonUI`
Phaser кнопка с поддержкой hover, press состояний и различных стилей.

```typescript
import { ButtonUI } from '@/ui/phaser';

const button = new ButtonUI(scene, {
  xPos: 100,
  yPos: 100,
  w: 150,
  h: 40,
  text: 'Play Game',
  onClick: () => startGame()
});
```

#### `BadgeUI`
Phaser бейдж для отображения статической или динамической информации.

```typescript
import { BadgeUI } from '@/ui/phaser';

const scoreBadge = new BadgeUI(scene, {
  xPos: 10,
  yPos: 10,
  w: 100,
  h: 30,
  text: 'Score: 0'
});

// Обновление текста
scoreBadge.update('Score: 100');
```

## 🔧 Использование

### Импорт всех компонентов:

```typescript
// Все компоненты
import * as UI from '@/ui';

// Только HTML компоненты
import { HTMLButton, HTMLToolbar } from '@/ui/html';

// Только Phaser компоненты
import { ButtonUI, BadgeUI } from '@/ui/phaser';
```

### Примеры использования:

#### HTML Toolbar в браузере:

```typescript
import { HTMLToolbar } from '@/ui/html';

// Создание панели инструментов
const toolbar = new HTMLToolbar({
  position: 'top',
  orientation: 'horizontal'
});

// Добавление инструментов
toolbar.addTool({
  label: '🏠',
  onClick: () => selectTool('house')
});

toolbar.addTool({
  label: '🏭',
  onClick: () => selectTool('factory')
});

// Добавление в DOM
toolbar.appendTo(document.body);
```

#### Phaser UI в игре:

```typescript
import { ButtonUI } from '@/ui/phaser';

export class GameScene extends Phaser.Scene {
  create() {
    // Создание игровой кнопки
    const playButton = new ButtonUI(this, {
      xPos: 400,
      yPos: 300,
      w: 200,
      h: 50,
      text: 'Начать игру',
      onClick: () => this.startGame()
    });

    // Кнопка автоматически добавляется в сцену
  }
}
```

## 🎨 Стили и темы

### HTML компоненты
- Поддерживают CSS переменные для кастомизации цветов и размеров
- Адаптивный дизайн для разных экранов
- Плавные анимации переходов

### Phaser компоненты
- Используют Phaser.Graphics для рендеринга
- Поддерживают различные состояния (normal, hover, pressed, disabled)
- Интегрируются с системой глубины Phaser

## 📱 Адаптивность

HTML компоненты автоматически адаптируются под размер экрана через CSS медиа-запросы. Phaser компоненты масштабируются относительно размера камеры Phaser.

## 🔄 Миграция

При миграции с существующей панели инструментов на HTML компоненты:

1. Замените Phaser кнопки на `HTMLButton`
2. Используйте `HTMLToolbar` для группировки инструментов
3. Подключите CSS стили в основной HTML файл
4. Обновите обработчики событий для работы с DOM

## 🏷️ Теги компонентов

- `#ui:html` - HTML веб-компоненты
- `#ui:phaser` - Phaser игровые компоненты
- `#ui:toolbar` - Панели инструментов
- `#ui:button` - Кнопки различных типов
- `#ui:badge` - Элементы отображения информации