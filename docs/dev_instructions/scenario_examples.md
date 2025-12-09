# Практические сценарии без кода

> Сверяйтесь с `docs/core_schema.md` и `docs/dev_instructions/workflow.md`. Используйте только публичный API ядра (геттеры GameCore, EventBus, CommandProcessor, ModuleManager, TickManager, MapManager, ECSManager). Добавляйте теги к фичам и механикам.

## Краткие обозначения
- DTO — Data Transfer Object: простой объект с данными, без логики. В UI формируем DTO команды и кладём его в `CommandProcessor.enqueueCommand`.
- Command — действие игрока/системы, проходящее валидацию и исполнение через `CommandProcessor` + `CommandRegistry`.
- Handler — обработчик команды: содержит `validate/apply`, регистрируется в `CommandRegistry` (через GameCore/ModuleManager).
- Event — сообщение в `EventBus`, на которое подписываются модули/сцены/системы.
- Module — расширение игры, реализующее `IModule`, регистрируется в `ModuleManager`, может добавлять системы ECS, команды, подписки и overlay в сцене.
- ECS — Entity-Component-System: сущность = id, компонент = данные, система = логика обновления.
- Overlay — визуальный слой/режим отображения (например, трубы, электросеть), который модуль включает в сцене через публичный API.

## Перекрасить тайлы в области 5×5 по нажатию кнопки
**Теги**: `arch:core`, `arch:events`, `arch:commands`, `gameplay:editor`, `map:isometric`, `status:mvp`

- Что подготовить: UI-кнопка в панели инструментов (`ToolManagerModule`), команда `PaintArea` зарегистрирована через `ModuleManager`; `GridModule` подписан на обновление тайлов.
- Поток: UI отправляет DTO с центром области в `CommandProcessor.enqueueCommand`.
- DTO `PaintArea` (пример полей): `{ type: 'PaintArea', center: { x, y }, size: 5, tileType: 'grass', color?: '#aabbcc', timestamp }`.
- Валидация: хэндлер получает центр, через `MapManager` проверяет, что тайлы существуют; собирает список 5×5.
- Применение: хэндлер публикует `Events.TilesUpdated` с массивом тайлов и целевым материалом/цветом/тайл-тайпом.
- Визуал: подписка в GridModule/сцене ловит событие и перерисовывает тайлы.
- Состояние/сохранения: модуль или ECS-компонент тайла обновляет данные и доступен `SaveManager` для снапшота.
- Диагностика: при включённом `enableDebug` логируйте payload события, чтобы видеть какие клетки перекрашены.
- Пример DTO и вызова из UI:

```ts
// UI (панель инструментов)
const dto = { type: 'PaintArea', center: { x, y }, size: 5, tileType: 'grass', timestamp: Date.now() };
core.getCommandProcessor().enqueueCommand(dto);
```

```ts
// Command handler (скелет)
registerHandler({
  type: 'PaintArea',
  validate: ({ center, size }) => map.validateArea(center, size),
  apply: ({ center, size, tileType }) => {
    const tiles = map.collectArea(center, size);
    eventBus.emit(Events.TilesUpdated, { tiles, tileType });
  },
});
```

## Создать сущность «Дом» по кнопке, автоудаление через 100 тиков
**Теги**: `arch:core`, `arch:ecs`, `arch:commands`, `gameplay:construction`, `building:residential`, `gameplay:time-control`, `status:mvp`

- Что подготовить: модуль строительства (например, `BuildingModule`) зарегистрирован в `ModuleManager`; в `CommandRegistry` есть `SpawnHouse`; система `HouseLifetimeSystem` зарегистрирована в ECS через модуль.
- Поток: UI кнопка «Построить дом» (или инструмент) отправляет DTO `SpawnHouse` в `CommandProcessor`.
- DTO `SpawnHouse` (пример полей): `{ type: 'SpawnHouse', position: { x, y }, houseType: 'residential_level1', rotation?: 0|90|180|270, timestamp }`.
- Валидация: хэндлер проверяет, что клетка свободна, и через `ECSManager` создаёт сущность с компонентами позиции, типа дома и `lifetime=100`.
- Работа системы: `HouseLifetimeSystem` вызывается на каждом тике (через `SimulationLoop`/`EventBus`), декрементирует lifetime; при 0 публикует `Events.EntityRemoved` и удаляет сущность из ECS.
- Визуал: подписка на `EntityRemoved` в модуле/сцене скрывает/удаляет отображение дома.
- Сохранения: компоненты позиции/типа/lifetime сериализуются `SaveManager`, чтобы таймер корректно продолжался после загрузки.
- Диагностика: метрики тиков (`TickManager`) и лог событий помогут отследить, что дом исчезает ровно на 100‑м тике.
- Примеры:

```ts
// UI
core.getCommandProcessor().enqueueCommand({
  type: 'SpawnHouse',
  position: { x, y },
  houseType: 'residential_level1',
  timestamp: Date.now(),
});
```

```ts
// Handler
registerHandler({
  type: 'SpawnHouse',
  validate: ({ position }) => map.isFree(position),
  apply: ({ position, houseType }) => {
    const id = ecs.createEntity();
    ecs.addComponent(id, PositionComponent(position));
    ecs.addComponent(id, HouseComponent({ houseType, lifetime: 100 }));
    eventBus.emit(Events.HouseSpawned, { id, position, houseType });
  },
});
```

```ts
// System (HouseLifetimeSystem)
update(dt, ecs, eventBus) {
  for (const { entity, lifetime } of ecs.view(HouseComponent)) {
    if (lifetime.value <= 0) {
      ecs.destroyEntity(entity);
      eventBus.emit(Events.EntityRemoved, { entity });
    } else {
      lifetime.value -= 1; // один тик
    }
  }
}
```

## Смена слоя сцены (карта труб/электросети) по нажатию кнопки
**Теги**: `arch:core`, `arch:module`, `arch:events`, `arch:renderer`, `gameplay:editor`, `status:mvp`

- Что подготовить: UI-кнопки для выбора слоя; overlay-модули (например, `PipesOverlayModule`, `PowerOverlayModule`) зарегистрированы в `ModuleManager` и умеют `attachToScene`; команда `SwitchLayer` описана в `CommandRegistry`.
- Поток: UI отправляет `SwitchLayer` в `CommandProcessor` (предпочтительно единообразно через команды, а не прямые вызовы).
- DTO `SwitchLayer` (пример полей): `{ type: 'SwitchLayer', layer: 'pipes' | 'power' | 'default', timestamp }`.
- Логика модуля: подписка на `SwitchLayer` переключает активный overlay, меняет набор тайлов/шейдер/палитру или визуальный слой в сцене.
- Визуал: `MapManager` остаётся базовым источником карты; overlay рисует поверх, используя данные ECS/модуля инфраструктуры (например, трубы/кабели), полученные через публичный API.
- Синхронизация UI: модуль публикует `Events.LayerChanged`, чтобы UI обновил активное состояние кнопок и подписи.
- Сохранения: состояние выбранного слоя можно хранить в модуле и сериализовать через `SaveManager`, чтобы при загрузке вернуть тот же overlay.
- Диагностика: при отладке включить `enableDebug`, логировать `SwitchLayer` и `LayerChanged`, убедиться, что `attachToScene` вызывается один раз, а переключения не дублируют слои.
- Примеры:

```ts
// UI
core.getCommandProcessor().enqueueCommand({ type: 'SwitchLayer', layer: 'pipes', timestamp: Date.now() });
```

```ts
// Handler (в модуле overlay)
registerHandler({
  type: 'SwitchLayer',
  validate: ({ layer }) => ['pipes', 'power', 'default'].includes(layer),
  apply: ({ layer }) => {
    overlayManager.setActiveLayer(layer);
    eventBus.emit(Events.LayerChanged, { layer });
  },
});
```

## Создать менеджер инструментов, хранить/расширять инструменты и работать через карту/ECS
**Теги**: `arch:core`, `arch:module`, `arch:commands`, `arch:events`, `arch:ecs`, `gameplay:editor`, `map:isometric`, `status:mvp`

- Что подготовить: `ToolManager` — в ядре; `ToolManagerModule` поднимает его (подписан на `TileHovered/TileClicked/TileUnhovered`) и регистрирует хэндлер `SelectTool` через `CommandRegistry`.
- Структура: `ToolManager` хранит коллекцию `{ id, category, icon, behavior }`, активный инструмент и делегирует события карты в `behavior.onUse/onHover/onUnhover`; команды отправляются через `CommandProcessor` из контекста.
- Расширение: модули регистрируют инструменты через `toolManager.registerTool({ category, tool })`, где `tool.behavior` создаёт команды (`ZoneTile`, `PaintArea`, `SpawnHouse`, `RemoveZone`, трубы/ландшафт).
- Поток выбора: UI отправляет команду `SelectTool` → хэндлер `SelectToolCommandHandler` активирует инструмент → публикуется `Events.ToolActivated`.
- Поток использования: при клике по карте `GridModule` шлёт событие `TileClicked`; `ToolManager` вызывает `behavior.onUse`, инструмент генерирует команды/события, `ToolManager` эмитит `Events.ToolUsed/ToolHovered/ToolUnhovered` для UI.
- Сохранения: активный инструмент можно хранить в `ToolManager` и сериализовать через `SaveManager`, если нужно восстанавливать состояние UI.
- Диагностика: при `enableDebug` видно `ToolActivated/ToolUsed` и команды в `DebugModule`.
- Быстрые вызовы: `toolManager.getCategories()`, `toolManager.getToolsByCategory('zoning')`, `toolManager.getActiveTool()`, `toolManager.deactivateTool()`.

```ts
// Регистрация нового инструмента из модуля
toolManager.registerTool({
  category: {
    id: 'terrain',
    name: 'Ландшафт',
    icon: '⛰️',
    order: 2,
  },
  tool: {
    id: 'paint-5x5',
    type: 'terrain_flatten',
    name: 'Выровнять 5x5',
    icon: '🟩',
    description: 'Выравнивает квадрат 5x5',
    categoryId: 'terrain',
    order: 1,
    hotkey: 'F',
    behavior: {
      onUse: ({ tile, enqueueCommand }) =>
        enqueueCommand({
          type: 'PaintArea',
          center: tile,
          size: 5,
          tileType: 'grass',
          timestamp: Date.now(),
        }),
    },
  },
});
```

```ts
// Хэндлер выбора инструмента
registerHandler({
  type: 'SelectTool',
  validate: ({ toolId }) => toolManager.hasTool(toolId),
  apply: ({ toolId }) => {
    toolManager.activateTool(toolId);
  },
});
```

```ts
// Обработка клика по карте внутри ToolManager
eventBus.on(Events.TileClicked, ({ tileX, tileY }) => {
  const tool = toolManager.getActiveTool();
  // onUse уже вызовется внутри ToolManager; если нужен overlay/log — подпишись на ToolUsed
});
```

### Мини-сценарий: инструмент постройки одного здания
**Теги**: `arch:tools`, `arch:commands`, `gameplay:building`, `status:mvp`

```ts
// В модуле BuildingToolsModule
toolManager.registerTool({
  category: { id: 'build', name: 'Строительство', icon: '🏗️', order: 1 },
  tool: {
    id: 'build_house_small',
    type: 'build_house_small',
    name: 'Дом (мал.)',
    icon: '🏠',
    description: 'Построить одиночный дом',
    categoryId: 'build',
    order: 1,
    hotkey: 'B',
    behavior: {
      onUse: ({ tile, enqueueCommand }) =>
        enqueueCommand({
          type: 'BuildBuilding',
          buildingType: 'house_small',
          position: { x: tile.x, y: tile.y },
          timestamp: Date.now(),
        }),
    },
  },
});
```

Использование:
- UI отправляет `SelectTool` с `toolId: 'build_house_small'`.
- Пользователь кликает по тайлу → `GridModule` эмитит `TileClicked` → `ToolManager` вызывает `onUse` → команда `BuildBuilding` уходит в `CommandProcessor`.
- Сброс: `toolManager.deactivateTool()` или команда `SelectTool` на другой инструмент/кнопка «Отмена».

## Общение модулей между собой (пример)
**Теги**: `arch:module`, `arch:events`, `arch:commands`, `arch:core`, `status:mvp`

- Принцип: модули не импортируют друг друга напрямую — общаются через публичный API, события `EventBus` или команды `CommandProcessor`. Зависимости объявляются в `ModuleManager` для порядка инициализации.
- Пример: `ZoningModule` хочет подсветить зоны в UI (модуль `OverlayModule`).
  - `ZoningModule` публикует `Events.ZonesChanged` с массивом зон или id изменённых чанков.
  - `OverlayModule` подписан на `ZonesChanged`, запрашивает актуальные данные через публичный метод `zoningModule.getZonesSnapshot()` и обновляет overlay.
- Альтернатива через команды: `ZoningModule` регистрирует команду `RequestZonesOverlayUpdate`; `OverlayModule` регистрирует хэндлер, который реагирует и строит слой.
- Если нужно общие сервисы: модуль может отдавать публичный интерфейс через свой геттер в `ModuleManager` (например, `moduleManager.getModule<ZoningModule>('zoning')`) — но только для публичных методов.

```ts
// В ZoningModule
eventBus.emit(Events.ZonesChanged, { changedChunks });

// В OverlayModule
eventBus.on(Events.ZonesChanged, ({ changedChunks }) => {
  const zones = zoningModule.getZonesSnapshot(changedChunks);
  overlay.renderZones(zones);
});
```

```ts
// Вариант через команду
commandProcessor.enqueueCommand({ type: 'RequestZonesOverlayUpdate', timestamp: Date.now() });

registerHandler({
  type: 'RequestZonesOverlayUpdate',
  validate: () => true,
  apply: () => {
    const zones = zoningModule.getZonesSnapshot();
    overlay.renderZones(zones);
  },
});
```

## Построить дом, привязанный к сетке и отображаемый на карте
**Теги**: `arch:core`, `arch:ecs`, `arch:commands`, `arch:renderer`, `gameplay:construction`, `map:isometric`, `status:mvp`

- Что подготовить: `BuildingModule` или аналогичный модуль зарегистрирован в `ModuleManager`; `GridModule` активен и отдаёт `TileClicked` с целочисленными `tileX/tileY`; в `CommandRegistry` есть команда `BuildGridHouse`; в сцене есть система/слой, который рисует здания на основе ECS.
- Поток: UI-кнопка или инструмент отправляет DTO `BuildGridHouse` в `CommandProcessor`; хэндлер валидирует, создаёт сущность и публикует событие для визуализации.
- DTO `BuildGridHouse` (пример полей): `{ type: 'BuildGridHouse', tile: { x, y }, houseType: 'residential_level1', rotation?: 0|90|180|270, timestamp }` — координаты приходят из `TileClicked`, уже привязаны к сетке.
- Валидация: хэндлер проверяет, что клетка свободна (`map.isFree(tile)`), клетка существует на карте, и что `houseType` разрешён. При желании проверяет, что `x`/`y` целые (снап к сетке).
- Применение: через `ECSManager` создаётся сущность с компонентами `PositionComponent({ tileX: x, tileY: y })`, `HouseComponent({ houseType })`, `RenderComponent({ spriteKey: 'house_small', rotation })`; публикуется `Events.HouseSpawned` или аналог, чтобы слой отрисовки мог проставить спрайт.
- Визуал: рендер-система или подписка в сцене ловит `Events.HouseSpawned`, берёт мировые координаты через `MapManager.toWorld({ x, y })` (или существующий helper GridModule) и ставит спрайт в центр тайла. При удалении сущности ловится `Events.EntityRemoved`, чтобы убрать спрайт.
- Сохранения: компоненты позиции/типа/рендера сериализуются через `SaveManager`, чтобы дом оставался на своём тайле после загрузки.
- Диагностика: включите `enableDebug` и логируйте payload команды и события `HouseSpawned`, чтобы убедиться, что координаты остаются целыми и дом не «съезжает» с сетки.

```ts
// UI (кнопка или инструмент)
core.getCommandProcessor().enqueueCommand({
  type: 'BuildGridHouse',
  tile: { x: tileX, y: tileY }, // tileX/tileY из Events.TileClicked
  houseType: 'residential_level1',
  rotation: 0,
  timestamp: Date.now(),
});

// Command handler (в модуле)
registerHandler({
  type: 'BuildGridHouse',
  validate: ({ tile }) => map.isFree(tile) && Number.isInteger(tile.x) && Number.isInteger(tile.y),
  apply: ({ tile, houseType, rotation }) => {
    const id = ecs.createEntity();
    ecs.addComponent(id, PositionComponent({ tileX: tile.x, tileY: tile.y }));
    ecs.addComponent(id, HouseComponent({ houseType }));
    ecs.addComponent(id, RenderComponent({ spriteKey: 'house_small', rotation: rotation ?? 0 }));
    eventBus.emit(Events.HouseSpawned, { entity: id, tile, houseType, rotation });
  },
});

// Рендер (сцена или система)
eventBus.on(Events.HouseSpawned, ({ entity, tile, rotation }) => {
  const { x: worldX, y: worldY } = map.toWorld(tile); // helper из MapManager/GridModule
  const sprite = scene.add.sprite(worldX, worldY, 'house_small').setOrigin(0.5).setRotation(Phaser.Math.DegToRad(rotation ?? 0));
  renderIndex.set(entity, sprite); // храните ссылку, чтобы удалить при Events.EntityRemoved
});
```

## Подробно: Кнопка выбора инструмента в UI
**Теги**: `arch:ui`, `arch:commands`, `arch:events`, `arch:tools`, `gameplay:editor`, `status:mvp`, `doc:detailed`

- Что подготовить: включён `ToolManagerModule` и зарегистрирована команда `SelectTool`; в UI доступен `GameCore`; есть `toolId` зарегистрированного инструмента.
- Поток: кнопка в `UiScene` отправляет DTO `SelectTool` в `CommandProcessor`; после успешной валидации `ToolManager` активирует инструмент и шлёт `Events.ToolActivated`, по которому UI подсвечивает кнопку.
- Шаги:
  1. В `SCENE_CONFIGS` держите `ToolManagerModule` активным.
  2. В `UiScene.create` получите `core`, `commandProcessor`, `eventBus`.
  3. На `pointerup` вызовите `commandProcessor.enqueueCommand({ type: 'SelectTool', toolId, timestamp: Date.now() })`.
  4. Подпишитесь на `Events.ToolActivated`, чтобы менять цвет/состояние кнопки.
  5. При уничтожении UI отпишитесь от событий.
- Где лежит полный пример: файл `docs/dev_instructions/detailed_examples/ui_tool_button.md` (папка `docs/dev_instructions/detailed_examples/`; создайте, если отсутствует).
- Полный разбор с большим примером кода лежит в `docs/dev_instructions/detailed_examples/ui_tool_button.md`.

```ts
// UiScene (фрагмент)
const toolId = 'build_house_small';
const commandProcessor = core.getCommandProcessor();
const eventBus = core.getEventBus();

button.on('pointerup', () =>
  commandProcessor.enqueueCommand({ type: 'SelectTool', toolId, timestamp: Date.now() })
);

const onToolActivated = ({ toolId: activeId }: { toolId: string }) => {
  const isActive = activeId === toolId;
  button.setFillStyle(isActive ? 0x4caf50 : 0x3a86ff);
};

eventBus.on(Events.ToolActivated, onToolActivated);
// ... не забудьте off() при уничтожении UI
```

