# Игровое ядро (Core)

**Теги**: `arch:core`, `arch:simulation`, `arch:ecs`, `arch:events`, `arch:module`, `arch:commands`

Ядро — это минимальный, но жёстко определённый центр игры.

## Основные обязанности

- **Управление временем и тиками**:
  - фиксированный шаг симуляции (например, 10–20 тиков/сек);
  - учёт реального времени, компенсация лагов (несколько тиков за кадр).
- **Запуск и оркестрация систем ECS**:
  - хранит реестр систем;
  - определяет порядок выполнения (например: население → экономика → транспорт → инфраструктура).
- **Хранение глобальных менеджеров**:
  - ECS (entities, components, systems);
  - Event Bus (событийная шина);
  - менеджер модулей (регистрация и инициализация модулей).
- **Работа в разных режимах**:
  - однопользовательский локальный режим (всё в браузере);
  - в будущем — клиент, синхронизирующийся с сервером (мультиплеер).

В текущем MVP ядро **монолитно интегрировано с Phaser**:

- ядро и его менеджеры живут внутри одной или нескольких `Phaser.Scene`;
- игровой цикл Phaser (`update`/таймеры) используется как источник тиков;
- работа с вводом и камерой проходит через API Phaser.

При этом ядро по-прежнему оперирует ECS-системами и абстрактными компонентами; выделение его в полностью движок-агностичный слой рассматривается как задача post-MVP.

## Структура Core

**Теги**: `arch:core`, `arch:simulation`, `arch:ecs`, `arch:events`, `arch:module`, `arch:commands`

Core состоит из главного класса `GameCore` и нескольких специализированных менеджеров:

- **`GameCore`** — главная точка входа, координирует все компоненты

**Теги**: `arch:core`

- **`TickManager`** — управление временем и тиками

**Теги**: `arch:simulation`, `arch:core`, `gameplay:time-control`

- **`ECSManager`** — управление ECS (entities, components, systems)

**Теги**: `arch:ecs`, `arch:core`

- **`EventBus`** — событийная шина для межмодульной коммуникации

**Теги**: `arch:events`, `arch:core`

- **`ModuleManager`** — регистрация и управление модулями

**Теги**: `arch:module`, `arch:core`

- **`CommandProcessor`** — обработка команд от UI

**Теги**: `arch:commands`, `arch:core`

Все эти компоненты инициализируются и управляются через `GameCore`, который предоставляет единый публичный API для взаимодействия с игровым ядром.

## TickManager

**Теги**: `arch:simulation`, `arch:core`, `gameplay:time-control`

Управляет игровым временем и циклом тиков симуляции.

### Принципы работы

- Использует фиксированный шаг симуляции (10–20 тиков в секунду)
- Отслеживает реальное время и компенсирует лаги через catch-up тики
- Поддерживает режимы времени: пауза, нормальная скорость, ускорение
- Вызывает основной цикл тика через `requestAnimationFrame` или `setInterval`
- Поддерживает блокировку изменения скорости со стороны ядра (для важных уведомлений, меню, мультиплеера и т.д.)

### Интерфейс

- `start()` — запуск цикла тиков
- `pause()` — приостановка симуляции
- `resume()` — возобновление симуляции
- `setSpeed(multiplier: number)` — установка множителя скорости (1.0 = нормальная, 2.0 = 2x, 0.0 = пауза). Возвращает `boolean` — успешно ли установлена скорость (может быть заблокирована)
- `tick()` — выполнение одного тика (вызывается внутренне)
- `getCurrentTick(): number` — получение номера текущего тика
- `getGameTime(): number` — получение игрового времени в тиках
- `getRealTime(): number` — получение реального времени в миллисекундах
- `lockSpeedChange(lockId: string, reason?: string): void` — блокировка изменения скорости (например, при открытом меню, важном уведомлении, синхронизации с сервером)
- `unlockSpeedChange(lockId: string): void` — разблокировка изменения скорости
- `isSpeedChangeLocked(): boolean` — проверка, заблокировано ли изменение скорости
- `getSpeedChangeLocks(): string[]` — получение списка активных блокировок (для отладки)

### Блокировка изменения скорости

Ядро может блокировать изменение скорости симуляции в следующих случаях:

- **Важные уведомления** — когда игрок должен увидеть критическое сообщение
- **Открытые меню** — когда открыто модальное окно или важное меню
- **Мультиплеер** — когда клиент синхронизируется с сервером и не может изменить скорость локально
- **Критические события** — когда происходит важное игровое событие, требующее внимания игрока

Блокировка работает по принципу множественных блокировок: несколько источников могут одновременно заблокировать изменение скорости. Скорость разблокируется только когда все блокировки сняты.

### События

- `TickStarted` — публикуется в начале каждого тика
- `TickEnded` — публикуется в конце каждого тика
- `SimulationPaused` — публикуется при паузе
- `SimulationResumed` — публикуется при возобновлении
- `SpeedChanged` — публикуется при изменении скорости
- `SpeedChangeLocked` — публикуется при блокировке изменения скорости
- `SpeedChangeUnlocked` — публикуется при разблокировке изменения скорости

См. также: [Жизненный цикл тика](../simulation/lifecycle.md), [Разные частоты для подсистем](../simulation/system-frequencies.md)

## ECSManager

**Теги**: `arch:ecs`, `arch:core`, `tech:ecs`

Управляет Entity Component System (ECS) архитектурой.

### Принципы работы

- Хранит реестр всех сущностей (entities) в игре
- Управляет компонентами, привязанными к сущностям
- Регистрирует и запускает системы в определённом порядке
- Поддерживает разные частоты обновления систем (не все системы обновляются каждый тик)
- Обеспечивает изоляцию данных между системами

### Интерфейс

#### Управление сущностями

- `createEntity(): EntityId` — создание новой сущности
- `destroyEntity(id: EntityId): void` — удаление сущности
- `hasEntity(id: EntityId): boolean` — проверка существования сущности
- `getAllEntities(): EntityId[]` — получение всех сущностей

#### Управление компонентами

- `addComponent<T>(entityId: EntityId, component: T): void` — добавление компонента к сущности
- `removeComponent<T>(entityId: EntityId, componentType: ComponentType): void` — удаление компонента
- `getComponent<T>(entityId: EntityId, componentType: ComponentType): T | null` — получение компонента
- `hasComponent(entityId: EntityId, componentType: ComponentType): boolean` — проверка наличия компонента
- `getEntitiesWithComponent(componentType: ComponentType): EntityId[]` — получение всех сущностей с компонентом

#### Управление системами

- `registerSystem(system: ISystem, priority?: number): void` — регистрация системы с опциональным приоритетом
- `unregisterSystem(systemId: string): void` — удаление системы из реестра
- `runSystems(deltaTime: number): void` — запуск всех систем в порядке приоритета
- `getSystem(systemId: string): ISystem | null` — получение системы по ID

### Порядок выполнения систем

Системы выполняются в порядке приоритета (меньшее число = выше приоритет). Примерный порядок:

1. Население (`PopulationSystem`)
2. Экономика (`EconomySystem`)
3. Транспорт (`TransportSystem`)
4. Инфраструктура (`InfrastructureSystem`)

Каждая система может иметь свой интервал обновления (например, экономика обновляется раз в N тиков).

См. также: [Разные частоты для разных подсистем](../simulation/system-frequencies.md)

## EventBus

**Теги**: `arch:events`, `arch:core`

Событийная шина для межмодульной коммуникации без жёстких связей.

### Принципы работы

- Реализует паттерн Publisher-Subscriber
- Позволяет модулям публиковать события и подписываться на них
- События типизированы и могут содержать данные
- Поддержка одноразовых подписок (`once`)
- Возможность отмены подписок

### Интерфейс

- `emit<T>(eventType: string, payload?: T): void` — публикация события
- `on<T>(eventType: string, handler: (payload?: T) => void): Subscription` — подписка на событие
- `once<T>(eventType: string, handler: (payload?: T) => void): Subscription` — одноразовая подписка
- `off(eventType: string, handler: Function): void` — отмена подписки
- `clear(eventType?: string): void` — очистка всех подписок (или для конкретного типа события)

### Типы событий

- **Игровые события**: `ConstructionStarted`, `ConstructionCompleted`, `TrafficJamStarted`, `TrafficJamResolved`, `PolicyApplied`, `PolicyRevoked`
- **Системные события**: `TickStarted`, `TickEnded`, `SimulationPaused`, `SimulationResumed`, `SpeedChanged`
- **UI-команды**: `BuildCommandRequested`, `DemolishCommandRequested`, `ChangeTaxRequested`

См. также: [Событийная модель (Event Bus)](./events.md), [Команды и события](../simulation/commands-events.md)

## ModuleManager

**Теги**: `arch:module`, `arch:core`

Управляет регистрацией и инициализацией модулей симуляции.

### Принципы работы

- Хранит реестр всех зарегистрированных модулей
- Управляет порядком инициализации модулей (зависимости должны инициализироваться раньше)
- Предоставляет доступ к модулям через публичный API
- Обеспечивает изоляцию модулей друг от друга

### Интерфейс

- `registerModule(module: IModule, dependencies?: string[]): void` — регистрация модуля с опциональными зависимостями
- `initializeModules(): Promise<void>` — инициализация всех модулей в правильном порядке
- `getModule<T>(moduleId: string): T | null` — получение модуля по ID
- `hasModule(moduleId: string): boolean` — проверка наличия модуля
- `getAllModules(): IModule[]` — получение всех зарегистрированных модулей

### Порядок инициализации

Модули инициализируются с учётом зависимостей. Если модуль A зависит от модуля B, то B инициализируется раньше A.

См. также: [Модули симуляции](./modules.md)

## CommandProcessor

**Теги**: `arch:commands`, `arch:core`, `arch:ui`

Обрабатывает команды от UI и применяет их к игровому состоянию.

### Принципы работы

- Принимает команды от UI слоя
- Валидирует команды перед применением
- Применяет команды через соответствующие системы (не напрямую мутирует данные)
- Генерирует события при успешном применении команд
- Поддерживает очередь команд для обработки в рамках одного тика

### Интерфейс

- `enqueueCommand(command: ICommand): void` — добавление команды в очередь
- `processCommands(): void` — обработка всех команд в очереди (вызывается в начале тика)
- `validateCommand(command: ICommand): ValidationResult` — валидация команды
- `clearQueue(): void` — очистка очереди команд

### Типы команд

- `BuildBuilding { position, buildingType }`
- `BulldozeArea { area }`
- `ChangeTaxRate { taxType, newRate }`
- `SetPolicy { policyId, enabled }`
- `SetSimulationSpeed { speedLevel }`

См. также: [Команды и события](../simulation/commands-events.md), [Жизненный цикл тика](../simulation/lifecycle.md)

## Жизненный цикл Core

### Инициализация (`initialize()`)

1. Создание всех менеджеров (TickManager, ECSManager, EventBus, ModuleManager, CommandProcessor)
2. Регистрация базовых систем (если есть)
3. Подготовка к работе (но без запуска цикла тиков)

### Запуск (`start()`)

1. Инициализация всех зарегистрированных модулей
2. Запуск TickManager (начало цикла тиков)
3. Публикация события `GameStarted`

### Остановка (`stop()`)

1. Остановка TickManager (прекращение цикла тиков)
2. Публикация события `GameStopped`
3. Сохранение состояния (если необходимо)

### Очистка (`destroy()`)

1. Остановка всех систем
2. Удаление всех сущностей и компонентов
3. Очистка всех подписок на события
4. Освобождение ресурсов

### Интерфейс GameCore

- `initialize(config?: CoreConfig): Promise<void>` — инициализация ядра
- `start(): void` — запуск игры
- `stop(): void` — остановка игры
- `destroy(): void` — полная очистка и освобождение ресурсов
- `getTickManager(): TickManager` — получение TickManager
- `getECSManager(): ECSManager` — получение ECSManager
- `getEventBus(): EventBus` — получение EventBus
- `getModuleManager(): ModuleManager` — получение ModuleManager
- `getCommandProcessor(): CommandProcessor` — получение CommandProcessor
- `lockSpeedChange(lockId: string, reason?: string): void` — блокировка изменения скорости (удобный метод через ядро)
- `unlockSpeedChange(lockId: string): void` — разблокировка изменения скорости
- `isSpeedChangeLocked(): boolean` — проверка, заблокировано ли изменение скорости

См. также: [Жизненный цикл тика](../simulation/lifecycle.md)

## Интерфейсы и типы

### ISystem

Интерфейс для систем ECS:

- `id: string` — уникальный идентификатор системы
- `priority: number` — приоритет выполнения (меньше = выше)
- `updateInterval: number` — интервал обновления в тиках (1 = каждый тик)
- `update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void` — метод обновления системы

### IModule

Интерфейс для модулей симуляции:

- `id: string` — уникальный идентификатор модуля
- `dependencies?: string[]` — список ID модулей-зависимостей
- `initialize(core: GameCore): Promise<void>` — инициализация модуля
- `destroy(): void` — очистка модуля
- `registerSystems?(ecs: ECSManager): void` — регистрация систем модуля (опционально)

### ICommand

Базовый интерфейс для команд:

- `type: string` — тип команды
- `timestamp: number` — время создания команды
- `validate?(): ValidationResult` — опциональная валидация команды

### ValidationResult

Результат валидации команды:

- `valid: boolean` — валидна ли команда
- `error?: string` — сообщение об ошибке (если невалидна)

### CoreConfig

Конфигурация ядра:

- `tickRate: number` — частота тиков в секунду (по умолчанию 10–20)
- `maxCatchUpTicks: number` — максимальное количество catch-up тиков за кадр
- `enableDebug: boolean` — включение режима отладки

### Типы данных

- `EntityId: number | string` — идентификатор сущности
- `ComponentType: string | symbol` — тип компонента
- `Subscription: { unsubscribe(): void }` — подписка на событие

---

## См. также

- [Примеры работы ядра](./core-example.md) — практические примеры использования GameCore и его компонентов

---

[← Назад к индексу](./index.md)

