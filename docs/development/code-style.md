# Правила написания кода — Script City

Основной документ — [AGENTS.md](../../AGENTS.md). Здесь — конкретика по оформлению кода.

## 1. Форматирование

Форматирование **не обсуждается**: Prettier + ESLint решают его автоматически.

- Отступы: 2 пробела, табов нет
- Кавычки: одинарные
- Точка с запятой: всегда
- `printWidth`: 100
- Trailing commas: `all`
- Перевод строки: **LF** (Windows-проект: `.gitattributes`/`.editorconfig` требуют LF —
  не дай редактору записать CRLF, это ломает diff)
- Кодировка: **UTF-8 без BOM**, перевод строки **LF** (проверено: часть легаси-файлов
  до сих пор в CRLF — не повторяй)

Команды: `npm run format`, `npm run lint:fix`. Запускай перед коммитом.

## 2. Именование

| Сущность                  | Стиль                            | Пример                                 |
| ------------------------- | -------------------------------- | -------------------------------------- |
| Файл/папка                | `kebab_case`                     | `tile_highlighter.ts`, `tools_module/` |
| Класс/интерфейс/тип-алиас | `PascalCase`                     | `MapModule`, `ToolActivatedPayload`    |
| Функция/метод/переменная  | `camelCase`                      | `createCitizen`, `getTileInfo`         |
| Константа                 | `SCREAMING_SNAKE_CASE`           | `GAME_TIME_PER_TICK`, `DEFAULT_SPEED`  |
| Компонент ECS             | `PascalCase + суффикс Component` | `MoneyComponent`, `PositionComponent`  |
| Система ECS               | `PascalCase + суффикс System`    | `WorkIncomeSystem`                     |
| Фабрика сущностей         | `PascalCase + суффикс Factory`   | `createCitizen`                        |
| Имя в реестрах/кластерах  | `snake_case`-строка              | `'work_income'`, `'first_sim'`         |
| Событие в enum `Events`   | `PascalCase`                     | `GameTimeUpdated`, `ToolActivated`     |
| CSS-классы                | `kebab-case` / `BEM`             | `.toolbar__button--active`             |

Приватные поля — без подчёркивания (`private world: World`), если нет причины.
Историческое `_`-префиксное внутреннее API (`_phaser`, `_eventBus` в `Core`) —
существующая дыра, не образец для копирования.

## 3. Типы

- `strict: true` — не отключать и не добавлять `any`.
- Явные return-типы у экспортируемых функций и методов (правило ESLint
  `@typescript-eslint/explicit-function-return-type`).
- Неизвестные внешние данные — `unknown` + сужение (`typeof`, `in`, пользовательский type guard).
- Объявляй интерфейсы рядом с местом использования или в `types.ts` модуля.
- Generics — для переиспользуемых структур, не для читаемости ради.

## 4. Импорты

- Алиас `@/*` → `src/*`. Относительные импорты глубже одного уровня от `src/` не используем.
- Порядок: внешние → `@/` → относительные, с пустой строкой между группами.
- Типы импортируй через `import type { ... }`, если это не создаёт цикл.
- Без barrel-импортов ради удобства, если они тянут циклы (`ecs/index.ts`, `modules/extends/index.ts`
  — существующие точки циклов, не добавляй новые).

## 5. Комментарии и документация

- Комментарий объясняет **почему**, не пересказывает код (`// увеличиваем на 1` — мусор,
  `// день длится 1 реальную минуту, поэтому шаг фиксирован` — полезно).
- TSDoc для публичных классов и методов: что делает, какие параметры, что возвращает,
  какие события эмитит/слушает.
- **Запрещено**: закомментированный код, `// TODO` без ссылки на задачу, комментарии
  вида «Phase 0», «временно», «позже переделаем».

## 6. Логирование

Только через `Logger.create('<ИмяМодуля>')` (`src/core/utils/logger.ts`).
Уровни: `debug` (детали), `info` (старт/жизненный цикл), `warn`, `error`.

```ts
private logger: Logger = Logger.create('MapModule');

// ❌ console.log('tiles', tiles.length);
// ✅ this.logger.debug(`Отрисовано тайлов: ${tiles.length}`);
```

Логировать **редко**: константный лог на каждый тик или каждую сущность — источник тормозов.

## 7. ECS: как писать

Полный гайд — [../ecs-workflow.md](../ecs-workflow.md). Главное:

```ts
// Компонент — только TypedArray-данные
export const MoneyComponent = createComponent({ money: 'i32' }, 'MoneyComponent');

// Система — чистая функция (world, entities, delta), без побочных эффектов
export const WorkIncomeSystem = createSystem(
  'work_income',
  ['Money'],
  (world, entities, delta) => {
    for (const id of query(world, [MoneyComponent])) {
      MoneyComponent.money[id] += salary;
    }
  },
  { cluster: 'economy', interval: 5000, enabled: true },
);
```

- У каждой системы **обязан** быть `cluster` — без него per-tick система не выполнится
  (известный баг `ScheduleManager`, см. AGENTS.md).
- Не используй массивы объектов и `Map` внутри компонентов — только SoA-массивы.
- Запросы (`query`) создавай один раз на систему, а не внутри горячего цикла.

## 8. Модули

```ts
export class MyModule extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    // подписки на события
  }
}
```

- Один модуль — одна зона ответственности.
- Модуль не лезет в внутренние поля другого модуля: только события и публичный API.
- Если модуль нужен не всем — регистрируй его в `customModules`, а не в `baseModules`.
- У каждой подписки на событие должен быть способ отписаться (`destroy()`/`off`).

## 9. События

- Новое событие → добавить в `Events` (`event_bus/events.ts`) **и** payload в `event_bus/types.ts`.
- Имя события — про **что произошло** (`TilePainted`), а не что делать.
- Подписчик обязан быть идемпотентным: событие может прийти повторно.

## 10. Тесты

- Расположение: `__tests__/` рядом с кодом или `*.test.ts` рядом с модулем.
- Имена: `describe('Что проверяем')` → `it('должен делать X')`.
- Юнит-тест не поднимает Phaser. Нужен Phaser — только интеграционный тест с моками
  через `ICoreDependencies`/`createWorld` из bitecs.
- Перф-бенчмарк — один файл на тему (сейчас их 4 дубля, не добавляй пятый).
- Новый баг в логике = сначала падающий тест, потом фикс.

## 11. Ассеты и ресурсы

- Ассеты — в `src/assets/<категория>/`, только в нижнем регистре, латиницей.
- Тайлы — 128×64 (изометрия), здания выравниваются по сетке.
- Не хардкодить пути к ассетам в нескольких местах — выносить в константу.

## 12. Чек-лист перед коммитом

```bash
npm run format      # привести к стилю
npm run type-check  # 0 ошибок
npm run lint        # 0 новых проблем
npm run test:run    # всё зелёное
```

И запись в `CHANGELOG.md` под `[Unreleased]`.
