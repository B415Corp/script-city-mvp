# FAQ: разработка с ядром Script City MVP

> Перед изменениями сверяйтесь с `docs/core_schema.md` и планами MVP в `docs/development/mvp-plan/`.

## 15 практических сценариев

1) **Создать менеджер** — см. шаги ниже (архитектурная ответственность, регистрация в `GameCore`, геттер).
2) **Создать модуль** — `IModule` в `src/modules/<id>/`, зависимости, регистрация в `SCENE_CONFIGS` через `ModuleManager`.
3) **Получить координаты hover/click** — события `GridModule`: `Events.TileHovered/TileClicked/TileUnhovered`.
4) **Работа с картой** — слушайте события карты, логику держите в ECS/модулях, не мутируйте напрямую из UI.
5) **Скорость/пауза** — `TickManager.setSpeed(0|1|2|3)`, блокировки `lockSpeedChange`.
6) **Жизненный цикл команды** — `enqueueCommand` → `processCommands` → хэндлер → события результата.
7) **Подписка на события** — `eventBus.on(...)`, `unsubscribe()`; одноразово — `once`.
8) **Добавить систему ECS** — создать `ISystem`, `ecs.registerSystem(system)` или вернуть `ecsSystems` из модуля.
9) **Добавить инструмент** — через `ToolManager.registerTool` (категория + tool), требуется `ToolsModule`.
10) **Добавить новую команду** — хэндлер в `command_processor/handlers.ts`, регистрация в `CommandRegistry`, отправка через `enqueueCommand`.
11) **Сделать модуль с зависимостями** — укажите `dependencies`, ModuleManager выполнит топосорт; падение при отсутствии зависимостей.
12) **Использовать SaveManager в модуле** — реализуйте `ISnapshotProvider` (snapshotVersion, createSnapshot, restoreFromSnapshot) для сериализации своего состояния.
13) **UI-модуль, работающий на сцене** — реализуйте `attachToScene(scene)`; GameScene вызовет его после `MapManager.attachToScene()`.
14) **Отдельный вывод в отладку** — используйте `debugLog`/`debugError`; включите `enableDebug` в конфиге ядра.
15) **Работа с ToolManager и картой** — ToolManager подписан на события карты; инструменты должны генерировать команды (например, зонирование) в `CommandProcessor`.

## Как создать новый менеджер?
1. Определите ответственность и публичный API (SOLID, без утечек деталей).
2. Разместите в `src/core/<new_manager>/<new_manager>.ts` (нейминг в стиле `map_manager`, `command_processor`).
3. Инжектируйте зависимости через конструктор, избегайте глобалей.
4. Зарегистрируйте экземпляр в `GameCore.initialize()` в правильном порядке (обычно после `EventBus`, до модулей).
5. Добавьте геттер в `GameCore` для доступа модулей/сцен.
6. При необходимости подписывайтесь на `EventBus` или предоставьте методы, вызываемые из модулей.

## Как создать модуль?
1. Реализуйте `IModule` в `src/modules/<module_id>/<module_file>.ts`, задайте `id` и `dependencies` (массив `id` других модулей).
2. В `initialize(core)` получите нужные менеджеры (`core.getEventBus()`, `core.getECSManager()`, `core.getToolManager()` и т.д.), зарегистрируйте системы/инструменты/хэндлеры.
3. Опционально реализуйте `attachToScene(scene)` для Phaser-интеграции (UI, карта).
4. Зарегистрируйте модуль через `ModuleManager.registerModule(new MyModule(), ['dependencyId'])` в конфигурации сцен (`app/game_app.ts` → `SCENE_CONFIGS`).
5. Если модуль даёт снапшоты, реализуйте `ISnapshotProvider` и убедитесь, что `SaveManager` сможет сериализовать состояние.

## Как получить координаты при наведении или клике на карте?
- Используйте события `EventBus`, которые публикует `GridModule`:
  - `Events.TileHovered` → `{ tileX, tileY, tileType, tileTypeName }`
  - `Events.TileClicked` → `{ tileX, tileY }`
  - `Events.TileUnhovered` → `{ tileX, tileY }`
- Пример подписки в модуле:
  ```ts
  const eventBus = core.getEventBus();
  eventBus.on(Events.TileHovered, ({ tileX, tileY, tileTypeName }) => {
    // логика UI/инструмента
  });
  ```

## Как работать с картой из модуля или менеджера?
- Для визуала/ввода: используйте `GridModule` (через события) и `MapManager.attachToScene(scene)` в `GameScene`.
- Для логики: оперируйте своими данными в ECS или в специфичном менеджере; `GridModule` отвечает за отображение и ввод.
- Отправляйте команды через `CommandProcessor.enqueueCommand(...)` и обрабатывайте в системах/модулях через события (`Events.ZoneTileRequested`, `Events.BuildCommandRequested` и т.п.).
- Не мутируйте состояние напрямую из UI — используйте команды + системы ECS.

## Как работать с TickManager (скорость/пауза)?
- `setSpeed(0)` — пауза, `setSpeed(1|2|3)` — нормальная/ускоренная скорость.
- Блокировать смену скорости: `lockSpeedChange('lock-id', 'reason')`, разблокировать — `unlockSpeedChange('lock-id')`.
- Проверить блокировки: `isSpeedChangeLocked()` и `getSpeedChangeLocks()`.

## Каков жизненный цикл команды?
1. UI/модуль вызывает `commandProcessor.enqueueCommand(dto)`.
2. В начале тика `SimulationLoop` вызывает `commandProcessor.processCommands()`.
3. Хэндлер в `CommandRegistry` валидирует и испускает событие (`CommandProcessed/CommandRejected/CommandFailed`).
4. Логика/системы слушают события или работают с ECS в `apply`.

## Как подписаться на события из модуля?
```ts
const eventBus = core.getEventBus();
const sub = eventBus.on(Events.TickStarted, ({ tick }) => {
  // логика
});
// Отписка
sub.unsubscribe();
```

## Как добавить новую систему ECS?
1. Создайте `ISystem` объект (id, priority, updateInterval, update()).
2. Зарегистрируйте в модуле: `ecs.registerSystem(mySystem);` или верните `ecsSystems` из модуля.
3. Используйте `updateInterval` для редких обновлений (например, каждые 5 тиков).

## Как добавить новый инструмент (Tool)?
1. Убедитесь, что `ToolsModule` зарегистрирован (даёт `ToolManager`).
2. Создайте модуль или хук и регистрируйте инструмент через `toolManager.registerTool({ category, tool })`.
3. Инструмент должен генерировать команды в `CommandProcessor` или публиковать события для логики.

## Где смотреть последовательность запуска?
- См. `docs/development/dev_instructions/workflow.md` и архитектурную схему `docs/core_schema.md`.

## Как добавить новую команду?
1. Создайте хэндлер в `src/core/command_processor/handlers.ts`, реализуйте `validate` и `apply`.
2. Зарегистрируйте в `CommandRegistry` (через `GameCore.registerBaseCommandHandlers()` или модуль, вызывающий `ModuleManager.registerCommandHandler(handler)`).
3. Отправляйте команду из UI/модулей через `CommandProcessor.enqueueCommand`.

## Как подключить систему ECS?
1. Создайте систему `ISystem` (id, priority, updateInterval, update()).
2. Зарегистрируйте её в модуле в `initialize(core)` через `ecs.registerSystem(...)` или верните массив `ecsSystems`.
3. Система получает `deltaTime`, `ECSManager`, `EventBus` в `update`.

## Как работать с сохранениями?
- `SaveManager` сериализует ядро, ECS и модули, которые реализуют `ISnapshotProvider`.
- В модуле реализуйте `snapshotVersion`, `createSnapshot()`, `restoreFromSnapshot(data, version)`.
- Вызовы: `core.getSaveManager().save()`, `load(id)`, `deleteSave(id)`, `getSavesList()`.

## Как отлаживать?
- Включите `enableDebug` в конфиге ядра (см. `bootstrapGame`).
- Смотрите события в `DebugModule` или через `eventBus.getSubscriptions()` и метрики `getEventsPerTick()`.
- Для тиков: `tickManager.getCurrentTick()`, `getTicksPerSecond()`, `isActive()`.
- Логи: `debugLog` в инфраструктуре (`infrastructure/utils/logger`).

## Где посмотреть архитектуру и взаимодействия?
- Таблица взаимодействий: `docs/core_schema.md`.
- План этапов: `docs/development/mvp-plan/`.
- Визуализация потоков: схемы в `core_schema.md` (sequence/mermaid).

