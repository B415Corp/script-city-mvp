# Дерево событий при старте ядра

**Теги**: `arch:core`, `arch:events`, `arch:simulation`, `arch:startup`

Этот документ описывает последовательность событий, которые происходят при инициализации и запуске игрового ядра Script City MVP.

## Обзор

При старте ядра происходит следующая последовательность:

1. **Создание компонентов** — создаются все менеджеры (без событий)
2. **Инициализация ядра** — настройка компонентов (без событий)
3. **Регистрация модулей** — модули регистрируются в ModuleManager (без событий)
4. **Запуск ядра** — инициализация модулей и запуск TickManager
5. **Первый тик** — начало игрового цикла

## Дерево событий

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GameScene.create()                                        │
│    └─> Создание GameCore (без событий)                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GameCore.initialize()                                     │
│    ├─> Создание EventBus (без событий)                       │
│    ├─> Создание ECSManager (без событий)                     │
│    ├─> Создание ModuleManager (без событий)                  │
│    ├─> Создание CommandProcessor (без событий)                │
│    ├─> Создание SaveManager (без событий)                     │
│    ├─> Создание TickManager (без событий)                    │
│    └─> Подписка на SetSimulationSpeedRequested (без событий) │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GameScene: регистрация модулей                            │
│    └─> moduleManager.registerModule() (без событий)          │
│        • ToolsModule                                          │
│        • DebugModule                                          │
│        • BottomBarModule                                      │
│        • GridModule                                           │
│        • ZoningToolsModule                                    │
│        • TestSimulationModule                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GameCore.start()                                          │
│    │                                                          │
│    ├─> 4.1. ModuleManager.initializeModules()               │
│    │    │                                                     │
│    │    ├─> 4.1.1. Валидация зависимостей (без событий)     │
│    │    │                                                     │
│    │    ├─> 4.1.2. Топологическая сортировка (без событий)   │
│    │    │                                                     │
│    │    └─> 4.1.3. Инициализация модулей в порядке:          │
│    │         │                                                │
│    │         ├─> ToolsModule.initialize()                    │
│    │         │   └─> Создание ToolManager (без событий)       │
│    │         │                                                │
│    │         ├─> DebugModule.initialize()                    │
│    │         │   └─> (без событий)                           │
│    │         │                                                │
│    │         ├─> BottomBarModule.initialize()                │
│    │         │   └─> (без событий)                           │
│    │         │                                                │
│    │         ├─> GridModule.initialize()                     │
│    │         │   └─> (без событий)                           │
│    │         │                                                │
│    │         ├─> ZoningToolsModule.initialize()             │
│    │         │   ├─> Регистрация инструментов зонирования    │
│    │         │   └─> EventBus.emit(ToolRegistered)          │
│    │         │       └─> { toolId, categoryId }              │
│    │         │           • zone_residential_low              │
│    │         │           • zone_commercial_low                │
│    │         │           • zone_industrial_low               │
│    │         │           • zone_remove                       │
│    │         │                                                │
│    │         └─> TestSimulationModule.initialize()          │
│    │             └─> (без событий)                           │
│    │                                                     │
│    ├─> 4.2. TickManager.start()                             │
│    │    └─> Установка isRunning = true (без событий)         │
│    │                                                     │
│    └─> 4.3. EventBus.emit(GameStarted)                      │
│         └─> ⚡ GameStarted (без payload)                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. GameScene.attachModulesToScene()                          │
│    └─> Модули прикрепляются к Phaser сцене (без событий)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. GameScene.update() (первый кадр)                         │
│    └─> TickManager.updateFromPhaser(delta)                   │
│        │                                                      │
│        └─> TickManager.tick() (первый тик)                   │
│            │                                                  │
│            ├─> EventBus.emit(TickStarted)                     │
│            │   └─> ⚡ TickStarted                             │
│            │       └─> { tick: 0, gameTime: 0 }              │
│            │                                                  │
│            ├─> CommandProcessor.processCommands()             │
│            │   └─> (обработка команд, если есть)              │
│            │                                                  │
│            ├─> ECSManager.runSystems()                        │
│            │   └─> Выполнение систем ECS (могут генерировать │
│            │       события, например BuildingCreated)        │
│            │                                                  │
│            └─> EventBus.emit(TickEnded)                      │
│                └─> ⚡ TickEnded                               │
│                    └─> { tick: 0, gameTime: 0 }              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Детальное описание событий

### GameStarted

**Когда**: После успешной инициализации всех модулей и запуска TickManager

**Источник**: `GameCore.start()`

**Payload**: отсутствует

**Подписчики**:

- UI модули (для инициализации интерфейса)
- Модули симуляции (для начала работы)
- Debug модули (для отслеживания состояния)

**Пример подписки**:

```typescript
eventBus.once(Events.GameStarted, () => {
  console.log('Игра запущена!');
});
```

### ToolRegistered

**Когда**: При регистрации инструмента в ToolManager

**Источник**: `ToolManager.registerTool()`

**Payload**:

```typescript
{
  toolId: string;
  categoryId: string;
}
```

**Подписчики**:

- UI компоненты (TopBar) — для обновления списка инструментов
- Debug модули — для отображения зарегистрированных инструментов

**Пример подписки**:

```typescript
eventBus.on(Events.ToolRegistered, (data) => {
  console.log(`Инструмент зарегистрирован: ${data.toolId} в категории ${data.categoryId}`);
});
```

**При старте**: Генерируется для каждого инструмента, зарегистрированного модулями при инициализации (например, ZoningToolsModule регистрирует инструменты зонирования).

### TickStarted

**Когда**: В начале каждого тика симуляции

**Источник**: `TickManager.tick()`

**Payload**:

```typescript
{
  tick: number; // Номер текущего тика (начинается с 0)
  gameTime: number; // Игровое время в тиках
}
```

**Подписчики**:

- EventBus (внутренняя подписка для отслеживания событий за тик)
- Системы ECS (для синхронизации работы)
- UI модули (для обновления индикаторов)

**Пример подписки**:

```typescript
eventBus.on(Events.TickStarted, (data) => {
  console.log(`Тик ${data.tick} начался`);
});
```

**При старте**: Генерируется при первом вызове `TickManager.updateFromPhaser()` после `GameCore.start()`.

### TickEnded

**Когда**: В конце каждого тика симуляции

**Источник**: `TickManager.tick()`

**Payload**:

```typescript
{
  tick: number; // Номер завершенного тика
  gameTime: number; // Игровое время в тиках
}
```

**Подписчики**:

- UI модули (для обновления статистики)
- Системы агрегации (для подсчета итогов)
- Debug модули (для отображения метрик)

**Пример подписки**:

```typescript
eventBus.on(Events.TickEnded, (data) => {
  console.log(`Тик ${data.tick} завершен`);
});
```

**При старте**: Генерируется сразу после `TickStarted` при первом тике.

## Последовательность во времени

```
Время →
│
├─ [0ms]   GameCore.initialize()
│          └─> Создание всех менеджеров (без событий)
│
├─ [1ms]   Регистрация модулей
│          └─> registerModule() для каждого модуля (без событий)
│
├─ [2ms]   GameCore.start()
│          │
│          ├─ [2.1ms] ModuleManager.initializeModules()
│          │          │
│          │          ├─ ToolsModule.initialize() (без событий)
│          │          ├─ DebugModule.initialize() (без событий)
│          │          ├─ BottomBarModule.initialize() (без событий)
│          │          ├─ GridModule.initialize() (без событий)
│          │          │
│          │          ├─ ZoningToolsModule.initialize()
│          │          │  └─> ToolRegistered (zone_residential_low)
│          │          │  └─> ToolRegistered (zone_commercial_low)
│          │          │  └─> ToolRegistered (zone_industrial_low)
│          │          │  └─> ToolRegistered (zone_remove)
│          │          │
│          │          └─ TestSimulationModule.initialize() (без событий)
│          │
│          ├─ [2.2ms] TickManager.start() (без событий)
│          │
│          └─ [2.3ms] EventBus.emit(GameStarted) ⚡
│
├─ [3ms]   attachModulesToScene() (без событий)
│
├─ [16ms]  GameScene.update() (первый кадр, ~60 FPS)
│          └─> TickManager.updateFromPhaser(16ms)
│              └─> TickManager.tick()
│                  │
│                  ├─> TickStarted ⚡ { tick: 0, gameTime: 0 }
│                  ├─> CommandProcessor.processCommands()
│                  ├─> ECSManager.runSystems()
│                  └─> TickEnded ⚡ { tick: 0, gameTime: 0 }
│
└─ [32ms]  GameScene.update() (второй кадр)
           └─> TickManager.updateFromPhaser(16ms)
               └─> TickManager.tick()
                   │
                   ├─> TickStarted ⚡ { tick: 1, gameTime: 1 }
                   ├─> CommandProcessor.processCommands()
                   ├─> ECSManager.runSystems()
                   └─> TickEnded ⚡ { tick: 1, gameTime: 1 }
```

## События, которые НЕ генерируются при старте

Следующие события могут генерироваться во время работы игры, но **не генерируются** при старте:

- `GameStopped` — только при остановке игры
- `SimulationPaused` / `SimulationResumed` — только при изменении состояния паузы
- `SpeedChanged` — только при изменении скорости симуляции
- `ToolActivated` / `ToolDeactivated` — только при активации/деактивации инструмента пользователем
- `TileClicked` / `TileHovered` — только при взаимодействии с картой
- `BuildingCreated` / `BuildingLevelUp` — только при создании/улучшении зданий
- `CommandProcessed` / `CommandRejected` — только при обработке команд

## Зависимости между событиями

```
GameStarted
  └─> Запускает игровой цикл
      │
      └─> TickStarted (первый тик)
          │
          ├─> CommandProcessor.processCommands()
          │   └─> Может генерировать CommandProcessed/CommandRejected
          │
          ├─> ECSManager.runSystems()
          │   └─> Системы могут генерировать события (BuildingCreated и т.д.)
          │
          └─> TickEnded
              │
              └─> Следующий тик (TickStarted → ... → TickEnded)
```

## Отладка событий при старте

Для отслеживания событий при старте можно использовать:

```typescript
// В GameScene или DebugModule
const eventBus = core.getEventBus();

// Подписка на все события при старте
eventBus.on(Events.GameStarted, () => {
  console.log('✅ GameStarted');
});

eventBus.on(Events.ToolRegistered, (data) => {
  console.log(`✅ ToolRegistered: ${data.toolId}`);
});

eventBus.on(Events.TickStarted, (data) => {
  console.log(`✅ TickStarted: tick=${data.tick}`);
});

eventBus.on(Events.TickEnded, (data) => {
  console.log(`✅ TickEnded: tick=${data.tick}`);
});

// Просмотр истории событий
const history = eventBus.getEventHistory();
console.log('История событий:', history);
```

## Связанные документы

- [Жизненный цикл тика](./lifecycle.md) — описание работы тика симуляции
- [Команды и события](./commands-events.md) — полный список событий и команд
- [Схема взаимодействий ядра](../../core_schema.md) — взаимодействия между компонентами
- [Архитектура ядра](../architecture/core.md) — общее описание архитектуры

---

[← Назад к индексу](./index.md)
