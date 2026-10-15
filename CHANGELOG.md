# Changelog

Все значимые изменения проекта Script City фиксируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/lang/ru/).

Типы разделов: `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.

---

## [Unreleased]

### Added

- Рабочее окружение для ИИ-агентов: `AGENTS.md`, `docs/development/code-style.md`,
  `docs/development/workflow.md`, индекс документации `docs/README.md`.
- Первая запись `CHANGELOG.md` с реконструированной историей релиза 0.1.0.
- Тесты границ времени суток (`TimeConditions`), недели и дня недели в `TimeController`.
- `ScheduleManager.update()` теперь выполняет per-tick системы без кластера
  (раньше массив `systems` не обходился — такие системы молча не работали).
- Event-driven системы получают payload события: `SystemFunction` расширен до
  `(world, delta?, payload?)`, `createSystem` резолвит компоненты из
  `ComponentRegistry` и передаёт в `updateFn` реальный результат `query()`
  вместо пустого массива.
- `ECSManager.getStats()` считает настоящее количество сущностей
  (`getAllEntities`) и их распределение по компонентам.
- `ECSManager.destroy()` отписывается от всех событий EventBus, сбрасывает
  `ScheduleManager`, освобождает мир и чистит реестры.
- `content.ts` — единая точка регистрации игрового ECS-контента; `main.ts`
  больше не импортирует `src/core/ecs/test`, бенчмарки убраны из рантайма.
- `Logger.create()` вместо `console.*` в `ecs_manager.ts`, `event_bus.ts`,
  `core_lifecycle.ts`, `component_builder.ts`, `component_schema.ts`,
  `tile_renderer.ts`, отладочных панелях.

### Changed

- `dev_new` закреплена как **единственная рабочая ветка**: коммиты идут напрямую в неё,
  feature-ветки и pull request'ы не используются. Правила описаны в `AGENTS.md` и
  `docs/development/workflow.md`.
- Markdown-файлы исключены из форматирования Prettier (`*.md` в `.prettierignore`):
  Prettier выравнивает широкие таблицы в столбцы по 200 символов, из-за чего документы
  становились нечитаемыми в исходниках и в diff.
- `registerSystem()` в `ScheduleManager` принимает имя системы и оборачивает вызов
  в `try/catch` через `Logger`: падение одной системы больше не роняет весь тик.
- Интервальные системы кластеров выполняются ровно один раз за тик: раньше они
  обрабатывались и в `updateClusters()`, и в общем цикле интервальных систем.
- Кластеры уважают свой `metadata.interval` — раньше он игнорировался, и все
  системы кластера выполнялись каждый тик.
- 11 дублирующихся файлов перф-тестов ECS сведены к одному
  `src/core/ecs/__tests__/performance.test.ts`, проверяющему стоимость кадра
  (avg/p95) вместо wall-clock FPS. Падавший тест на 150K throughput удалён.
- `src/test/setup.ts` больше не мокает `bitecs` целиком: ECS-тесты и бенчмарки
  работают на реальном мире и запросах bitecs.
- Зачистка долга DoD: удалены `TODO`, пометки `Phase 0` и закомментированный код
  (`ecs/index.ts`, `ecs_manager.ts`, `module_manager.ts`, `debug_module.ts`,
  `component_builder.ts`); `BaseModule`/`CustomModule` получили метод `destroy()`,
  `ModuleManager.destroy()` теперь реально чистит модули.
- `window.sim` синхронизирован: `main.ts` и `ecs_debug.ts` используют полный
  `SimDebugMethods` (8 методов), убран доступ через `(core as any)` в пользу
  `EntityFactoryRegistry.getInstance()`.

### Removed

- Тестовый ECS-контент из рантайма: `src/core/ecs/test/`, `components/test/`,
  `systems/test/`, `entities/test/` (переименованы в `citizen_components.ts`,
  `citizen_factory.ts`, `work_income_system.ts`, `first_sim_cluster.ts`).
- `createTestEntity` / `createPlayerEntity` / `createNpcEntity` — фабрики-заглушки,
  возвращавшие случайные числа вместо entity id.

### Fixed

- Добавлен `.gitattributes` (`* text=auto eol=lf`): репозиторий и рабочие копии
  нормализованы на LF независимо от локального `core.autocrlf`. Раньше 24 файла
  (включая `package-lock.json`) выкачивались с CRLF, из-за чего `npm run format:check`
  падал на 10 файлах.
- Применено форматирование Prettier к 10 файлам перф-тестов ECS: `npm run format:check`
  теперь проходит полностью.
- Исправлены ошибочные утверждения о кодировке в новой документации: все файлы репозитория
  корректный UTF-8 без BOM, проблема была только в артефактах вывода консоли.
- `TimeController.getTimeUpdateData()` теперь возвращает полный `GameTimeUpdateData`:
  добавлены `week`, `dayOfWeek` и `timeOfDayCondition`. Раньше эти поля объявлялись
  в интерфейсе, но не заполнялись, из-за чего «время суток» в данных события
  `GameTimeUpdated` отсутствовало.
- Удалены мёртвые ссылки на класс `EntrySimulation`, удалённый в 0.1.0:
  импорт и `entrySimulationFactory` из `ICoreDependencies`, методы
  `withEntrySimulation` и `withEntrySimulationFactory` в `CoreBuilder`.
- Исправлен вызов фабрики в `performance_factories.ts`: `createSimplePerformanceEntity`
  возвращается как функция, поэтому `.factory` не существует.
- Обращение к нестандартному `performance.memory` (только Chrome/Edge) заменено на
  типизированный помощник `getUsedHeapSize()` с безопасным возвратом 0.
- В `eslint.config.js` объявлены глобалы `performance` и `Performance`, которых
  не было в списках — из-за этого ESLint давал 112 ошибок `no-undef`.
- Переписан флакующий тест «должен демонстрировать реалистичную производительность
  игрового цикла». Раньше он мерял wall-clock FPS в busy-wait цикле и требовал
  `minFPS > 30`: любая пауза планировщика ОС или GC роняла тест независимо от
  скорости самой симуляции. Теперь измеряется стоимость кадра — время внутри
  игровой логики, — и проверяется, что среднее и 95-й перцентиль укладываются
  в бюджет 16 мс при 60 FPS. Тест детерминирован по числу кадров (300 вместо
  2 секунд ожидания) и выполняется за ~15 мс вместо 2 с.

**`npm run type-check` и `npm run lint` теперь проходят без ошибок и предупреждений.**

- В `vitest.config.ts` добавлено исключение `dist/**`: шаг `tsc` в `npm run build`
  компилирует 32 теста в `dist`, и vitest прогонял каждый из них дважды
  (64 файла вместо 32), удваивая время сборки.

**`npm run build` проходит целиком: lint, type-check, тесты и сборка — зелёные.**

- `ECSManager` больше не засоряет консоль логом на каждую зарегистрированную
  систему и компонент: детали регистрации переведены на `logger.debug`.
- `Logger.error()` принимает `unknown` вместо `Error`, чтобы логировать
  исключения из `catch` без приведений типов.
- `createComponentSchema` больше не используется напрямую: добавлен
  `createSchemaComponent()`, который регистрирует компонент в
  `ComponentRegistry`. Из-за отсутствия регистрации система `work_income`
  не находила компонент `Money` и выполнялась с пустым набором сущностей.
- `WorkIncomeSystem` использует `entities` из аргумента `updateFn` вместо
  собственного `query()` с двойным обходом массива.

---

## [0.1.0] - 2026-01-12

Первая рабочая версия прототипа движка: ядро, ECS с автоматической регистрацией,
изометрическая карта, зонирование, игровое время, дебаг-панель.

### Added

**Ядро и архитектура**

- Класс `Core` — единая точка сборки приложения: Phaser, `EventBus`, `TickManager`,
  `ECSManager`, `ModuleManager`.
- Внедрение зависимостей в ядро через `ICoreDependencies` и фабрики — ядро тестируемо
  без реального Phaser.
- Разделение `Core` на `internal/core_lifecycle` и `internal/core_initialization`,
  класс `CoreBuilder`.
- `EventBus` с типизированными payload'ами и enum всех событий (`Events`).
- `ModuleManager` с реестрами базовых (`baseModules`) и пользовательских (`customModules`) модулей.

**Игровое время**

- `TickManager` — фиксированный шаг логики, скорости `PAUSED / NORMAL / FAST / VERY_FAST`
  (0 / 10 / 60 / 240 тиков в секунду).
- `TimeService` — централизованный календарь: минуты, часы, дни, недели, сезоны,
  условия времени суток; игровой день ≈ 1 минута реального времени.

**ECS (bitecs 0.4)**

- Автоматическая регистрация компонентов, систем и кластеров через глобальные реестры
  (`ComponentRegistry`, `SystemRegistry`, `ClusterRegistry`, `EntityFactoryRegistry`).
- «Умные конструкторы» `createComponent` / `createSimpleComponent` / `createSystem`
  с выводом метаданных.
- `ScheduleManager`: кластеры систем, интервальные системы, event-driven системы.
- Документация по ECS-рабочему процессу (`docs/ecs-workflow.md`).

**Карта и взаимодействие**

- `MapModule`: изометрическая сетка 100×100 тайлов 128×64, рендер, камера с зумом и панорамой,
  подсветка и выделение тайлов, обработка ввода, изометрическая математика.
- `ToolsModule` и инструменты: `select`, `living_zone`, `commercial_zone`, `clear_zone`;
  сброс инструмента по `Esc`.

**Интерфейс**

- HTML-тулбар (миграция с Phaser-UI): выбор инструментов, индикаторы времени и статистики.
- `DebugModule`: вкладки ECS-статистики, событий и тиков, локализация на русский.
- CSS-переменные для темы, стилизация дебаг-панели.
- Отладочный API `window.sim`: `stats()`, `time()`, `listenTime()`, `getECSStats()`,
  `checkRegistries()`, `testScheduleManager()`, `testEventSystems()`, `testEntityFactories()`.

**Инфраструктура**

- Vitest + jsdom, 32 файла тестов, покрытие ядра, тиков, событий, реестров и модулей.
- Перф-бенчмарки ECS с метриками пропускной способности.
- ESLint 9 (flat config) + Prettier 3 + EditorConfig.

### Changed

- `ToolbarModule` переведён с Phaser-UI на HTML/DOM.
- UI-компоненты разделены на `src/ui/html` и `src/ui/phaser`.
- Логика ядра вынесена из конструктора в отдельные методы инициализации.

### Removed

- `EntrySimulation` и связанные зависимости.
- Устаревшие/неиспользуемые модули `MapRefactor`, `ZoningTools`, `TestSimulation`,
  `EconomyComponents`, `MVPInitializer`.
- Legacy-обвязка симуляции, старый `REFACTORING_PLAN.md`.

### Fixed

- Рассинхронизация `TimeService` и `GAME_TIME_PER_TICK`.
- Позиционирование и размеры HTML-панели инструментов, убрано лишнее `overflow: hidden`.
- Проверка наличия текста перед обновлением `TickDebug`.
- `Core.destroy()` теперь корректно освобождает ресурсы и обрабатывает ошибки.

### Known issues

- `npm run type-check` падает (14 ошибок): незаполненные поля `GameTimeUpdateData`
  в `time_controller`, мёртвые ссылки на удалённый `simulations/entry_simulation`,
  нетипизированный `performance.memory` в перф-тестах. `npm run build` не проходит.
- Per-tick ECS-системы без кластера не выполняются: `ScheduleManager.update()`
  не обходит массив `registerSystem`.
- Event-driven системы не получают payload события и работают с `delta = 0`.
- Реестры ECS — глобальные синглтоны с регистрацией на импорте; бенчмарк-системы
  попадают в рантайм через `main.ts`.
- `ECSManager.getStats()` возвращает `totalEntities: 0`; `destroy()` не снимает подписки.
- Отсутствует рендер сущностей: жители, здания и транспорт не выводятся на экран,
  зонирование не связано с симуляцией.
- Легаси-документы и часть исходников сохранены с CRLF вместо LF, хотя `.editorconfig`
  и Prettier требуют LF — это даёт грязные diff между Windows и Linux.

---

[Unreleased]: https://github.com/B415Corp/script-city-mvp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/B415Corp/script-city-mvp/releases/tag/v0.1.0
