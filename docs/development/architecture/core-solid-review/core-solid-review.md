# Аудит SOLID и чистого кода ядра

**Теги**: `arch:core`, `arch:simulation`, `quality:solid`, `quality:cleancode`, `arch:ecs`, `arch:events`, `arch:commands`

## Контекст

Проверка ядра (`src/core`) на соответствие SOLID, чистому коду и принципам ООП. Сравнивалось с целями из `development/architecture/core.md` и `development/architecture/solid-oop.md`.

## Ключевые проблемы (по убыванию критичности)

- **[5/5] TickManager нарушает SRP/DIP**: в `tick()` исполняет очередь команд и системы ECS (`src/core/tick_manager/tick_manager.ts`), завязываясь на конкретные `CommandProcessor`/`ECSManager`; по `solid-oop.md` он должен управлять только временем и публиковать события тиков.
- **[5/5] CommandProcessor нарушает OCP и смешивает обязанности**: большой `switch` по типам команд, каждый новый тип требует правок класса; держит неиспользуемую ссылку на ECS (`src/core/command_processor/command_processor.ts`), что сигнализирует о размытых зависимостях.
- **[4/5] GameCore связывает рендер с инициализацией**: создаёт и инициализирует `MapManager` (Phaser-зависимый) до ECS/Module (`src/core/game_core/game_core.ts`), из-за чего ядро не может работать headless и нарушается движок-агностика из `core.md`.
- **[4/5] MapManager мультиответственность и сильная связность**: смешаны загрузка карты, рендер, ввод/камера, подсветка; зависит от `GameCore`, `Phaser.Scene` и конкретных текстур (`src/core/map_manager/map_manager.ts`), что усложняет тестирование и переиспользование.
- **[3/5] ModuleManager смешивает симуляцию и UI**: метод `attachModulesToScene` подтягивает Phaser внутрь менеджера (`src/core/module_manager/module_manager.ts`), ослабляя разделение интерфейсов между модульным слоем и сценами.
- **[3/5] SaveManager жёстко зависит от внутренних структур**: сериализует/десериализует компоненты ECS и данные модулей напрямую через `JSON.stringify`, без абстракций снапшотов и миграций (`src/core/save_manager/save_manager.ts`), что ломает версионирование.
- **[2/5] EventBus включает диагностику внутри транспорта**: самоподписка на тики и хранение истории в базовой шине (`src/core/event_bus/event_bus.ts`), смешивая передачу событий и телеметрию; в проде это должно быть опционально.

## Рекомендации (развёрнуто)

- **Разделить цикл**
  - TickManager: только расчёт времени, накопление дельты, эмит `TickStarted/Ended`.
  - SimulationLoop (в GameCore): слушает тики, вызывает `CommandProcessor.process()` перед системами, затем `ECSManager.runSystems()`.
  - GameCore: связывает TickManager события с SimulationLoop, чтобы легко менять источник тиков (Phaser, setInterval, server).

- **Реестр обработчиков команд**
  - Ввести `CommandRegistry` (Map `<type, ICommandHandler>`).
  - `CommandProcessor` ищет хэндлер по типу, валидирует и применяет без `switch`.
  - Модули регистрируют свои хэндлеры при инициализации; CommandProcessor не знает о конкретных командах.
  - Убрать неиспользуемую ссылку на ECS; доступ к контексту давать через `CommandContext` (bus, ecs, core-APIs).

- **Отвязать карту от ядра**
  - Core: `IMapService` (данные, события), без Phaser.
  - Scene слой: `MapRenderer`/`MapInput`/`MapHighlighter` работают с Phaser и подписками на `IMapService`.
  - GameCore создаёт сервис карт; сцена сама создаёт рендер/инпут, чтобы поддерживать headless и тесты.

- **Разделить модули и UI-привязку**
  - ModuleManager отвечает только за `register/initialize/destroy/registerSystems`.
  - `attachToScene` вызывается сценой или адаптером `ISceneAttachable`, Phaser не заходит в ModuleManager.
  - Это сохраняет чистоту модульного слоя и упрощает unit-тесты.

- **Граница сериализации**
  - Ввести `ISnapshotProvider<T>` для ECS/модулей: `snapshot()/restore()`.
  - SaveManager работает только с этими интерфейсами, не с внутренними структурами.
  - Добавить версионирование и миграции per-module/per-ecs, а не `JSON.stringify` на живых объектах.

- **Декоратор для телеметрии EventBus**
  - Базовый `EventBus`: pub/sub без истории.
  - `DevEventBus` (декоратор) добавляет историю/метрики, включается флагом сборки.
  - Избавляет прод от лишнего состояния и самоподписок внутри транспорта.

## Приоритетные шаги

1. Расщепить цикл тика: TickManager → время/ивенты; SimulationLoop → команды/системы.
2. Ввести реестр `ICommandHandler` и регистрацию из модулей.
3. Перенести MapManager в слой сцен, создать интерфейс `IMapService` в core.
4. Убрать Phaser из ModuleManager; UI-привязку делать на уровне сцен.
5. Определить интерфейсы снапшотов для ECS/модулей и адаптировать SaveManager.
6. Сделать диагностический декоратор для EventBus.

## Примеры исправлений (скелеты)

- **Разделить цикл тиков**: TickManager оставляет только тайминг/ивенты, логика команд и систем уходит в координатор.
  - `TickManager.tick`: публикует `TickStarted`/`TickEnded`, не вызывает команд/систем.
  - Новый `SimulationLoop` (в `GameCore`): `onTick` вызывает `commandProcessor.process()` → `ecsManager.runSystems()`.
  - `GameCore`: подписка на `Events.TickStarted` → делегирует в `SimulationLoop`.

- **Реестр команд вместо switch**:
  - Ввести `CommandRegistry` (Map `<type, ICommandHandler>`), `CommandHandler` = `{ type; validate(); apply(ctx) }`.
  - `CommandProcessor.processCommands`: ищет хэндлер по типу, валидирует, применяет; без `switch`.
  - Модули регистрируют свои хэндлеры при инициализации.

- **Отвязать карту от ядра**:
  - Core: `IMapService` (данные/события), без Phaser.
  - Сцена: `MapRenderer`/`MapInput` используют `IMapService` и Phaser для отрисовки/ввода.
  - `GameCore` создаёт сервис карт, но рендер инициализируется сценой, не в `initialize()`.

- **ModuleManager без Phaser**:
  - Удалить `attachModulesToScene` из менеджера.
  - В сцене: если модуль реализует `attachToScene`, сцена сама вызывает.
  - ModuleManager отвечает только за `register/initialize/destroy`.

- **Снапшоты для сохранений**:
  - Интерфейс `ISnapshotProvider<T>`: `snapshot(): T`, `restore(state: T)`.
  - `ECSManager` и модули реализуют провайдер; `SaveManager` опирается на абстракции, не на внутренние структуры; добавляет версии/миграции.

- **Диагностика EventBus как декоратор**:
  - Базовый `EventBus` — только pub/sub.
  - `DevEventBus` оборачивает `EventBus` и ведёт историю/метрики; используется в dev-сборке.
