# Workflow: запуск и использование ядра

> Сверяйтесь с базовой архитектурой: `docs/core_schema.md`, `docs/development/mvp-plan/mvp/stage-0-foundation.md`.

## Последовательность запуска ядра (без привязки ко времени)
1. `bootstrapGame()` инициализирует `GameCore`.
2. `GameCore.initialize()` создаёт менеджеры в строгом порядке: `EventBus` → `CommandRegistry` → `MapManager` → `ECSManager` → `ModuleManager` → `CommandProcessor` → `SaveManager` → `SimulationLoop` → `TickManager`.
3. Регистрируются базовые хэндлеры команд (`command_processor/handlers.ts`).
4. `SaveManager` получает доступ к ядру и `EventBus`.
5. `ModuleManager` остаётся пустым до регистрации модулей сцены.
6. `GameCore.start()`:
   - `ModuleManager.initializeModules(core)` — топологическая инициализация модулей по зависимостям.
   - `TickManager.start()` — активирует цикл тиков.
   - Публикуется событие `Events.GameStarted`.
7. `SceneController` запускает `GameScene`, где:
   - `MapManager.attachToScene()` подключает карту.
   - `ModuleManager.attachModulesToScene()` вызывает `attachToScene()` у всех модулей.
   - В `update()` сцены дергается `TickManager.updateFromPhaser(delta)`.

## Ключевые менеджеры и примеры работы
- **GameCore**: единая точка доступа к менеджерам и конфигу. Геттеры предпочтительнее прямых импортов.
- **TickManager**: фиксированный шаг, обработка скорости, события `TickStarted/TickEnded`, блокировки `lockSpeedChange(lockId)`. Пример: `core.getTickManager().setSpeed(2);`
- **EventBus**: pub/sub. Пример: `eventBus.on(Events.TileClicked, handler); eventBus.emit(Events.TileClicked, { tileX, tileY });`
- **CommandProcessor**: очередь команд + валидация через `CommandRegistry`. Пример: `commandProcessor.enqueueCommand({ type: 'ZoneTile', position, zoneType, timestamp: Date.now() });`
- **ECSManager**: сущности/компоненты/системы. Пример: `const id = ecs.createEntity(); ecs.addComponent(id, { level:1 }, LevelType);`
- **ModuleManager**: регистрация модулей с зависимостями. Пример: `moduleManager.registerModule(new ToolsModule()); moduleManager.registerModule(new ZoningToolsModule(), ['tools']);`
- **MapManager**: подключает `GridModule` к сцене, отдаёт доступ к карте. Пример: `core.getMapManager().attachToScene(scene);`
- **SaveManager**: сериализация ядра/ECS/модулей. Пример: `await core.getSaveManager().save();`
- **ToolManager** (создаётся `ToolsModule`): хранит инструменты, подписан на события карты.

## Поток симуляции на тик
1. Phaser вызывает `TickManager.updateFromPhaser(delta)`.
2. `TickManager` при необходимости испускает `TickStarted`.
3. `SimulationLoop` (подписан на `TickStarted`) вызывает `CommandProcessor.processCommands()` и `ECSManager.runSystems(1, eventBus)`.
4. После расчёта `TickManager` испускает `TickEnded`.
5. UI/модули реагируют на события через `EventBus`.

## Расширение
- Новые системы ECS: регистрируются в модуле через `registerSystems(ecs)` или поле `ecsSystems`.
- Новые команды: добавить хэндлер в `command_processor/handlers.ts`, зарегистрировать в `CommandRegistry` (обычно в `GameCore.registerBaseCommandHandlers` или в модуле через `ModuleManager.registerCommandHandler`).
- Новые модули: см. FAQ.

## Быстрые сценарии
- **Изменить скорость/паузу**: `core.getTickManager().setSpeed(0); // пауза`, `setSpeed(1|2|3)` для нормальной/ускоренной; блокировать через `lockSpeedChange('ui-lock')`.
- **Поставить команду из UI**: сформировать DTO, вызвать `commandProcessor.enqueueCommand(dto)`, далее команда попадёт в хэндлер и в событие `CommandProcessed/CommandRejected`.
- **Сохранить игру**: `await core.getSaveManager().save();` или `autoSave()` — сохранит ядро, ECS, модули со снапшотами.
- **Подписаться на карту**: `eventBus.on(Events.TileHovered, ...)` / `TileClicked` / `TileUnhovered` — данные координат и типа тайла доступны в payload.
- **Поднять отладку**: добавить `DebugModule` в `SCENE_CONFIGS` (уже включён по умолчанию), открыть окно отладки через модуль.
- **Включить карту/инструменты**: раскомментировать `GridModule`, `ToolsModule`, `ZoningToolsModule` в `SCENE_CONFIGS` (`app/game_app.ts`) и регистрировать их через `ModuleManager`.

## Мини-справка по интеграции сцен
- Сцены регистрируются в `SCENE_CONFIGS` (`app/game_app.ts`), там же указывается список модулей для сцены.
- `SceneController` создаёт сцены, пробрасывает `SceneInitData` (`core`, `sceneController`).
- `GameScene` обязана дергать `core.getTickManager().updateFromPhaser(delta)` в `update`.
- `UiScene` и другие сцены могут читать состояние через публичные API менеджеров (через `core`).
- Если модуль имеет `attachToScene`, он будет вызван из `GameScene.attachModulesToScene()` после `MapManager.attachToScene()`.

## Диагностика и отладка
- Включайте `enableDebug` в конфиге ядра, чтобы видеть расширенные логи.
- Метрики событий: `eventBus.getEventsPerTick()` / `getAverageEventsPerTick()`.
- Метрики тиков: `tickManager.getCurrentTick()`, `getGameTime()`, `getTicksPerSecond()`, `isSpeedChangeLocked()`.
- Проверка подписок: `eventBus.getSubscriptions()`.
- SimulationLoop: подписан на `TickStarted`, если нужно отключить — используйте `simulationLoop.destroy()` (по умолчанию создаётся в `GameCore.initialize`).

## Требования к расширениям
- Использовать публичный API (`GameCore` геттеры, события, команды). Не обращаться к приватным полям менеджеров.
- Поддерживать OOP/SOLID, избегать прямой мутации из UI — только через команды и системы.
- Следовать неймингу папок/классов: `core_folder`, `command_processor`, один компонент — одна папка.

