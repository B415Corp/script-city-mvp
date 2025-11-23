# Как работает ядро Script City: пошаговый разбор на примере модулей

**Теги**: `arch:core`, `arch:module`, `guide:tutorial`, `guide:developer-onboarding`

**Последнее обновление**: 2025-11-23

## О чём этот туториал

Этот документ объясняет, как работает игровое ядро Script City **на реальных примерах** из кода. Мы разберём три модуля:

- **DebugModule** — показывает отладочную информацию
- **BottomBarModule** — управляет нижней панелью с кнопками скорости
- **SpeedIndicatorModule** — визуальный индикатор скорости игры

Вы увидите, как эти модули взаимодействуют с ядром, какие компоненты они используют и **зачем** каждый компонент нужен.

## Для кого этот туториал

Для разработчиков, которые:
- хотят понять архитектуру ядра через практику
- планируют создавать свои модули
- нуждаются в пошаговом объяснении с примерами кода

## Связанные документы

- [Ядро простыми словами](../development/guides/core-for-developers.md) — концептуальное объяснение без кода
- [Архитектура ядра](../development/architecture/core.md) — техническая документация
- [Краткая инструкция по модулям](../development/architecture/core-quickstart.md) — quick start

---

## Часть 1: Компоненты ядра и зачем они нужны

Прежде чем разбирать модули, давайте кратко пройдёмся по основным компонентам ядра.

### GameCore — главный координатор

**Зачем нужен**: это центральная точка входа в ядро. Через него создаются все менеджеры и запускается симуляция.

**Основные методы**:
```typescript
async initialize(config?: CoreConfig): Promise<void>  // Создание всех менеджеров
async start(): Promise<void>                          // Запуск симуляции
stop(): void                                          // Остановка симуляции
destroy(): void                                       // Полная очистка

// Геттеры для доступа к менеджерам
getModuleManager(): ModuleManager
getTickManager(): TickManager
getEventBus(): EventBus
getECSManager(): ECSManager
getCommandProcessor(): CommandProcessor
```

**Что делает при инициализации**:
1. Создаёт `EventBus` (шину событий) — первым, т.к. другие могут его использовать
2. Создаёт `ECSManager` (хранилище данных мира)
3. Создаёт `ModuleManager` (регистратор модулей)
4. Создаёт `CommandProcessor` (обработчик команд игрока)
5. Создаёт `TickManager` (управление временем симуляции)

### ModuleManager — регистратор модулей

**Зачем нужен**: управляет жизненным циклом модулей и их зависимостями.

**Ключевые возможности**:
- Регистрация модулей с указанием зависимостей
- Топологическая сортировка (модули инициализируются в правильном порядке)
- Автоматическая инициализация модулей при запуске ядра
- Прикрепление модулей к Phaser сцене для создания UI

**Основные методы**:
```typescript
registerModule(module: IModule, dependencies?: string[]): void
async initializeModules(core: GameCore): Promise<void>
attachModulesToScene(scene: Phaser.Scene): void
getModule<T>(moduleId: string): T | null
```

### EventBus — почтовая служба

**Зачем нужен**: позволяет модулям общаться без прямых зависимостей друг от друга.

**Принцип работы**: паттерн Publisher-Subscriber
- Модуль публикует событие: `eventBus.emit('SpeedChanged', { newSpeed: 2.0 })`
- Другие модули подписаны на это событие и реагируют на него

**Основные методы**:
```typescript
emit<T>(eventType: string, payload?: T): void           // Отправить событие
on<T>(eventType: string, handler: Function): Subscription  // Подписаться
once<T>(eventType: string, handler: Function): Subscription  // Подписаться один раз
off(eventType: string, handler: Function): void         // Отписаться
```

**Пример**: модуль `BottomBarModule` отправляет событие `SetSimulationSpeedRequested`, а ядро его слушает и меняет скорость через `TickManager`.

### TickManager — дирижёр времени

**Зачем нужен**: обеспечивает фиксированный шаг симуляции, независимо от FPS.

**Что умеет**:
- Запускать тики с заданной частотой (например, 20 тиков в секунду)
- Ставить на паузу / снимать с паузы
- Изменять скорость симуляции (0.5x, 1x, 2x, 3x)
- Блокировать изменение скорости (например, во время важных событий)
- Компенсировать лаги (выполнять несколько тиков за кадр)

**Основные методы**:
```typescript
start(): void                          // Запустить тики
stop(): void                           // Остановить тики
pause(): void                          // Пауза
resume(): void                         // Снять с паузы
setSpeed(multiplier: number): boolean  // Изменить скорость (1.0 = норма, 2.0 = x2)
updateFromPhaser(deltaMs: number): void  // Вызывается каждый кадр из Phaser
```

**Важно**: `TickManager` шлёт события через `EventBus`:
- `TickStarted` — в начале каждого тика
- `TickEnded` — в конце каждого тика
- `SpeedChanged` — при изменении скорости
- `SimulationPaused` / `SimulationResumed` — при паузе/возобновлении

### ECSManager — хранилище данных мира

**Зачем нужен**: структурированное хранение всех данных игры (здания, жители, транспорт и т.д.).

**Концепции ECS**:
- **Entity** (сущность) — уникальный ID объекта
- **Component** (компонент) — кусочек данных (позиция, здоровье, скорость и т.п.)
- **System** (система) — логика, которая обрабатывает сущности с определёнными компонентами

**Пример**: Дом = Entity с компонентами `Position`, `Building`, `Construction`

### CommandProcessor — приёмная для команд игрока

**Зачем нужен**: все действия игрока должны обрабатываться в рамках тиков, а не как попало.

**Принцип работы**:
1. UI отправляет команду: `commandProcessor.addCommand({ type: 'BuildHouse', x: 10, y: 20 })`
2. Команда добавляется в очередь
3. В начале следующего тика `CommandProcessor` обрабатывает все команды
4. Системы симуляции уже видят изменённое состояние мира

---

## Часть 2: Жизненный цикл — от старта до работы

Посмотрим, как это всё работает вместе на примере `GameScene` (главной игровой сцены).

### Шаг 1: Создание и инициализация ядра

```typescript
// src/scenes/game_scene.ts

export class GameScene extends Phaser.Scene {
  private core!: GameCore;

  async create(): Promise<void> {
    // 1. Создаём ядро
    this.core = new GameCore();
    
    // 2. Инициализируем с конфигом
    await this.core.initialize({
      tickRate: 20,              // 20 тиков в секунду
      maxCatchUpTicks: 5,        // Максимум 5 тиков за кадр (защита от "спирали смерти")
      enableDebug: true,         // Режим отладки
    });

    // 3. Получаем менеджер модулей
    const moduleManager = this.core.getModuleManager();

    // ... регистрация модулей ...
  }
}
```

**Что происходит внутри `initialize()`**:
1. Создаётся `EventBus` — теперь можно публиковать и слушать события
2. Создаётся `ECSManager` — готов хранить сущности и компоненты
3. Создаётся `ModuleManager` — готов регистрировать модули
4. Создаётся `CommandProcessor` — готов принимать команды
5. Создаётся `TickManager` — настроен на 20 тиков/сек, но ещё не запущен

### Шаг 2: Регистрация модулей

```typescript
// Продолжение GameScene.create()

const moduleManager = this.core.getModuleManager();

// Регистрируем модули
moduleManager.registerModule(new DebugModule());
moduleManager.registerModule(new BottomBarModule());
moduleManager.registerModule(new SpeedIndicatorModule());
```

**Что происходит**:
- Модули создаются (но ещё не инициализируются)
- `ModuleManager` запоминает их ID и зависимости (если есть)
- Модули пока "спят" и ждут инициализации

### Шаг 3: Запуск ядра

```typescript
// Продолжение GameScene.create()

// Запуск ядра — модули инициализируются автоматически
await this.core.start();
```

**Что происходит внутри `start()`**:

1. **`ModuleManager.initializeModules(core)`** — инициализация всех модулей
   - Проверяет зависимости (все ли модули-зависимости зарегистрированы?)
   - Выполняет топологическую сортировку (определяет порядок инициализации)
   - Для каждого модуля по очереди:
     - Вызывает `module.initialize(core)` — модуль получает доступ к ядру
     - Вызывает `module.registerSystems(ecs)` (если метод есть) — модуль регистрирует ECS системы
     - Помечает модуль как инициализированный

2. **`TickManager.start()`** — запуск игрового цикла
   - `isRunning = true`
   - `isPaused = false`
   - Тики начнут выполняться на следующем `update()`

3. **Публикация события `GameStarted`**
   - Модули, которые подписаны на это событие, могут выполнить стартовую логику

### Шаг 4: Прикрепление модулей к Phaser сцене

```typescript
// Продолжение GameScene.create()

// Прикрепление модулей к сцене (UI, хоткеи и т.п.)
moduleManager.attachModulesToScene(this);
```

**Что происходит**:
- `ModuleManager` проходится по всем модулям
- Если у модуля есть метод `attachToScene(scene)`, вызывает его
- Модули создают UI, подписываются на события Phaser сцены и т.д.

**Важно**: этот шаг происходит **после** запуска ядра, потому что модули уже инициализированы и готовы работать.

### Шаг 5: Игровой цикл (каждый кадр)

```typescript
// В GameScene

update(_: number, delta: number): void {
  // Делегируем шаг симуляции ядру (через TickManager)
  this.core.getTickManager().updateFromPhaser(delta);
}
```

**Что происходит в `updateFromPhaser(delta)`**:
1. Накапливается время: `accumulatedTime += delta * speedMultiplier`
2. Вычисляется, сколько тиков нужно выполнить: `ticksToExecute = floor(accumulatedTime / tickInterval)`
3. Для каждого тика:
   - Публикуется событие `TickStarted`
   - `CommandProcessor` обрабатывает команды из очереди
   - `ECSManager` запускает все зарегистрированные системы
   - Системы читают/меняют компоненты, публикуют события
   - Публикуется событие `TickEnded`
4. Остаток времени сохраняется для следующего кадра

**Важно**: если FPS упал, может выполниться несколько тиков за один кадр (но не больше `maxCatchUpTicks`).

---

## Часть 3: Разбор модулей по шагам

Теперь разберём каждый из трёх модулей, чтобы понять, как они используют компоненты ядра.

---

### Модуль 1: DebugModule

**Назначение**: показывает отладочную информацию (FPS, количество тиков, скорость игры и т.д.)

#### Структура модуля

```typescript
// src/modules/debug/debug_module.ts

export class DebugModule implements IModule {
  id = 'debug';  // Уникальный ID модуля
  dependencies?: string[];  // Нет зависимостей от других модулей

  private core?: GameCore;      // Ссылка на ядро
  private debugWindow?: DebugWindow;  // UI компонент
  private scene?: Phaser.Scene;  // Ссылка на Phaser сцену
}
```

#### Метод 1: initialize — получение доступа к ядру

```typescript
async initialize(core: GameCore): Promise<void> {
  this.core = core;
  console.warn('🐛 DebugModule initialized');
}
```

**Что происходит**:
- Модуль сохраняет ссылку на `GameCore`
- Через эту ссылку он сможет получить доступ к `EventBus`, `TickManager` и т.д.
- Пока UI не создаётся — сцена ещё не прикреплена

**Зачем это нужно**:
- Модуль получает доступ ко всем менеджерам ядра
- Может подписываться на события, регистрировать системы и т.д.

#### Метод 2: attachToScene — создание UI

```typescript
attachToScene(scene: Phaser.Scene): void {
  if (!this.core) {
    throw new Error('DebugModule not initialized');
  }

  this.scene = scene;
  
  // Создаём UI компонент (окно отладки)
  this.debugWindow = new DebugWindow(scene, this.core);
  this.debugWindow.create();

  // Подписка на событие 'update' сцены — обновление UI каждый кадр
  scene.events.on('update', this.handleSceneUpdate, this);

  // Подписка на событие 'shutdown' сцены — очистка при выключении
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

  console.warn('🐛 DebugModule attached to scene', scene.scene.key);
}
```

**Что происходит**:
1. Проверяем, что модуль инициализирован (есть ссылка на `core`)
2. Сохраняем ссылку на Phaser сцену
3. Создаём `DebugWindow` (это отдельный класс, который рисует UI)
4. Подписываемся на событие `update` сцены — каждый кадр будем обновлять UI
5. Подписываемся на событие `shutdown` — при закрытии сцены очистим ресурсы

**Зачем это нужно**:
- **Разделение ответственности**: модуль сам управляет своим UI, не требуя от `GameScene` знать о деталях
- **Автоматическое обновление**: модуль подписывается на события Phaser и обновляется сам
- **Автоматическая очистка**: при закрытии сцены модуль удалит свои подписки

#### Обработчик обновления каждый кадр

```typescript
private handleSceneUpdate(_: number, delta: number): void {
  if (this.debugWindow) {
    this.debugWindow.update(delta);
  }
}
```

**Что происходит**:
- Каждый кадр Phaser вызывает это событие
- Модуль передаёт `delta` (время с прошлого кадра) в `DebugWindow`
- `DebugWindow` обновляет отображаемые данные (FPS, тики и т.д.)

**Важно**: это **не тик симуляции**, а обновление UI! Симуляция идёт в `TickManager`, а UI обновляется каждый кадр.

#### Обработчик закрытия сцены

```typescript
private handleSceneShutdown(): void {
  if (this.debugWindow) {
    this.debugWindow.destroy();  // Удаляем UI объекты Phaser
    this.debugWindow = undefined;
  }

  if (this.scene) {
    this.scene.events.off('update', this.handleSceneUpdate, this);  // Отписываемся
    this.scene = undefined;
  }

  console.warn('🐛 DebugModule detached from scene');
}
```

**Что происходит**:
- Удаляем все Phaser объекты (`DebugWindow.destroy()`)
- Отписываемся от событий сцены
- Очищаем ссылки

**Зачем это нужно**:
- Предотвращает утечки памяти
- Гарантирует, что при переключении сцен модуль не будет пытаться обновлять несуществующий UI

#### Метод destroy — финальная очистка

```typescript
destroy(): void {
  this.handleSceneShutdown();  // Переиспользуем логику очистки сцены
  console.warn('🐛 DebugModule destroyed');
}
```

**Когда вызывается**:
- При полном уничтожении ядра (`GameCore.destroy()`)
- Или при удалении модуля из `ModuleManager`

#### Что мы узнали из DebugModule

1. **Модуль получает ядро в `initialize()`** — может использовать все менеджеры
2. **Модуль создаёт UI в `attachToScene()`** — после инициализации, но до игрового цикла
3. **Модуль сам подписывается на события Phaser** — не требует вмешательства извне
4. **Модуль сам очищает ресурсы** — при закрытии сцены или уничтожении

---

### Модуль 2: BottomBarModule

**Назначение**: управление нижней панелью с кнопками скорости игры (пауза, x1, x2, x3)

#### Структура модуля

```typescript
// src/modules/ui/bottom_bar_module.ts

export class BottomBarModule implements IModule {
  id = 'bottom_bar';
  dependencies?: string[];

  private core?: GameCore;
  private bottomBar?: BottomBar;  // UI компонент
  private scene?: Phaser.Scene;
}
```

**Похоже на `DebugModule`**, но есть отличия в том, что делает UI компонент.

#### Метод initialize

```typescript
async initialize(core: GameCore): Promise<void> {
  this.core = core;
  console.warn('📊 BottomBarModule initialized');
}
```

Аналогично `DebugModule` — сохраняем ссылку на ядро.

#### Метод attachToScene

```typescript
attachToScene(scene: Phaser.Scene): void {
  if (!this.core) {
    throw new Error('BottomBarModule not initialized');
  }

  this.scene = scene;
  
  // Создаём нижнюю панель
  this.bottomBar = new BottomBar(scene, this.core);
  this.bottomBar.create();

  // Подписка на событие resize сцены
  scene.scale.on('resize', this.handleResize, this);
  
  // Подписка на shutdown сцены
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

  console.warn('📊 BottomBarModule attached to scene', scene.scene.key);
}
```

**Отличия от `DebugModule`**:
- Подписывается на `resize` — когда игрок изменяет размер окна, панель должна перерисоваться
- Не подписывается на `update` — панель не обновляется каждый кадр, только при изменении скорости

#### Обработчик изменения размера окна

```typescript
private handleResize(): void {
  if (this.bottomBar && this.bottomBar.resize) {
    this.bottomBar.resize();
  }
}
```

**Зачем это нужно**:
- При изменении размера окна панель должна растянуться на всю ширину
- Без этого UI "сломается" при переключении в оконный режим или изменении разрешения

#### Что делает BottomBar внутри?

Посмотрим на ключевую часть `BottomBar` (это UI компонент, не модуль):

```typescript
// src/ui/bottom_bar/bottom_bar.ts (упрощённо)

export class BottomBar {
  private scene: Phaser.Scene;
  private core: GameCore;
  private speedButtons: Phaser.GameObjects.Text[] = [];
  private currentSpeed: number = 1.0;

  constructor(scene: Phaser.Scene, core: GameCore) {
    this.scene = scene;
    this.core = core;
  }

  create(): void {
    // Создаём кнопки: Пауза, x1, x2, x3
    this.createSpeedButtons();
    
    // Подписываемся на события изменения скорости из ядра
    this.subscribeToEvents();
    
    // Синхронизируем начальное состояние с TickManager
    const tickManager = this.core.getTickManager();
    this.currentSpeed = tickManager.getSpeed();
    this.updateSpeedDisplay();
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();
    
    // Слушаем событие изменения скорости
    eventBus.on('SpeedChanged', (data) => {
      this.currentSpeed = data.newSpeed;
      this.updateSpeedDisplay();  // Обновляем кнопки (подсвечиваем активную)
    });
  }

  private onSpeedButtonClick(speed: number): void {
    // Отправляем событие-запрос на изменение скорости
    const eventBus = this.core.getEventBus();
    eventBus.emit('SetSimulationSpeedRequested', { speedLevel: speed });
  }
}
```

**Важный паттерн взаимодействия**:

1. **UI отправляет запрос**:
   ```typescript
   eventBus.emit('SetSimulationSpeedRequested', { speedLevel: 2.0 });
   ```

2. **Ядро слушает запрос** (в `GameCore.subscribeToCommandEvents()`):
   ```typescript
   eventBus.on('SetSimulationSpeedRequested', (payload) => {
     const success = this.tickManager.setSpeed(payload.speedLevel);
   });
   ```

3. **TickManager изменяет скорость** и публикует событие:
   ```typescript
   eventBus.emit('SpeedChanged', { oldSpeed, newSpeed: this.speedMultiplier });
   ```

4. **UI реагирует на событие** и обновляет кнопки:
   ```typescript
   eventBus.on('SpeedChanged', (data) => {
     this.currentSpeed = data.newSpeed;
     this.updateSpeedDisplay();
   });
   ```

**Зачем так сложно? Почему не просто `tickManager.setSpeed(2.0)`?**

- **Разделение ответственности**: UI не знает о внутренностях `TickManager`
- **Единая точка обработки**: все запросы на изменение скорости проходят через события
- **Блокировка скорости**: ядро может отклонить запрос, если скорость заблокирована (например, во время события)
- **Множественные подписчики**: несколько UI элементов могут реагировать на изменение скорости

#### Что мы узнали из BottomBarModule

1. **Модуль может подписываться на события Phaser** (`resize`, `shutdown` и т.д.)
2. **UI общается с ядром через EventBus** — отправляет запросы и слушает ответы
3. **Паттерн Request-Response через события** — UI не изменяет состояние напрямую
4. **Синхронизация состояния** — при создании UI синхронизируется с текущим состоянием ядра

---

### Модуль 3: SpeedIndicatorModule

**Назначение**: визуальный индикатор скорости игры (анимированный круг в центре экрана)

#### Структура модуля

```typescript
// src/modules/ui/speed_indicator_module.ts

export class SpeedIndicatorModule implements IModule {
  id = 'speed_indicator';
  dependencies?: string[];

  private core?: GameCore;
  private speedIndicator?: SpeedIndicator;
  private scene?: Phaser.Scene;
}
```

#### Методы initialize и attachToScene

```typescript
async initialize(core: GameCore): Promise<void> {
  this.core = core;
  console.warn('⚡ SpeedIndicatorModule initialized');
}

attachToScene(scene: Phaser.Scene): void {
  if (!this.core) {
    throw new Error('SpeedIndicatorModule not initialized');
  }

  this.scene = scene;

  // Создаём индикатор в центре экрана
  const { width, height } = scene.scale;
  this.speedIndicator = new SpeedIndicator(scene, this.core, width / 2, height / 2);
  this.speedIndicator.create();

  // Подписка на событие update — индикатор анимируется каждый кадр
  scene.events.on('update', this.handleSceneUpdate, this);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

  console.warn('⚡ SpeedIndicatorModule attached to scene', scene.scene.key);
}
```

**Похоже на предыдущие модули**, но есть нюанс: индикатор нужно **анимировать каждый кадр**.

#### Обработчик обновления

```typescript
private handleSceneUpdate(_: number, delta: number): void {
  if (this.speedIndicator) {
    this.speedIndicator.update(delta);
  }
}
```

#### Что делает SpeedIndicator внутри?

```typescript
// src/ui/speed_indicator/speed_indicator.ts (упрощённо)

export class SpeedIndicator {
  private scene: Phaser.Scene;
  private core: GameCore;
  private circle!: Phaser.GameObjects.Arc;
  private text!: Phaser.GameObjects.Text;
  private animationTime: number = 0;

  create(): void {
    // Создаём круг и текст
    this.circle = this.scene.add.circle(0, 0, 30, 0x4a90e2);
    this.text = this.scene.add.text(0, 0, '1x', { fontSize: '20px' });

    // Подписываемся на события изменения скорости
    this.subscribeToEvents();
    
    // Синхронизируем состояние
    this.updateSpeedDisplay();
  }

  update(delta: number): void {
    // Получаем текущую скорость игры
    const tickManager = this.core.getTickManager();
    const speed = tickManager.getSpeed();
    
    // Анимируем круг в зависимости от скорости
    this.animationTime += delta * speed * 0.002;
    
    // Вращение круга
    this.circle.rotation = this.animationTime;
    
    // Пульсация (scale зависит от времени)
    const scale = 1.0 + Math.sin(this.animationTime * 2) * 0.1;
    this.circle.setScale(scale);
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();
    
    // Слушаем изменение скорости
    eventBus.on('SpeedChanged', (data) => {
      this.updateSpeedDisplay();
    });
    
    // Слушаем паузу/возобновление
    eventBus.on('SimulationPaused', () => {
      this.circle.setAlpha(0.5);  // Полупрозрачный при паузе
    });
    
    eventBus.on('SimulationResumed', () => {
      this.circle.setAlpha(1.0);  // Возвращаем непрозрачность
    });
  }

  private updateSpeedDisplay(): void {
    const tickManager = this.core.getTickManager();
    const speed = tickManager.getSpeed();
    
    // Обновляем текст
    if (speed === 0) {
      this.text.setText('⏸');  // Иконка паузы
    } else {
      this.text.setText(`${speed}x`);
    }
  }
}
```

**Ключевые моменты**:

1. **Анимация зависит от скорости игры**:
   ```typescript
   this.animationTime += delta * speed * 0.002;
   ```
   Если игра на паузе (`speed = 0`), анимация останавливается.

2. **Реакция на события**:
   - `SpeedChanged` — обновляет текст
   - `SimulationPaused` — делает круг полупрозрачным
   - `SimulationResumed` — возвращает непрозрачность

3. **Прямой доступ к TickManager**:
   ```typescript
   const speed = tickManager.getSpeed();
   ```
   Это безопасно, потому что мы только **читаем** состояние, а не изменяем его.

#### Что мы узнали из SpeedIndicatorModule

1. **Модули могут обновляться каждый кадр** — для анимации UI
2. **Можно читать состояние ядра напрямую** — если не изменяем его
3. **Подписка на множество событий** — модуль реагирует на несколько типов событий
4. **Визуальная индикация состояния** — UI отражает состояние симуляции в реальном времени

---

## Часть 4: Паттерны взаимодействия

Теперь обобщим паттерны, которые мы увидели в примерах.

### Паттерн 1: Инициализация модуля

```typescript
// 1. Регистрация (до запуска ядра)
moduleManager.registerModule(new MyModule());

// 2. Инициализация (при запуске ядра)
async initialize(core: GameCore): Promise<void> {
  this.core = core;
  // Сохраняем ссылки на нужные менеджеры
  this.eventBus = core.getEventBus();
  this.tickManager = core.getTickManager();
  
  // Подписываемся на события симуляции (не UI!)
  this.eventBus.on('TickStarted', this.handleTick, this);
}

// 3. Регистрация систем (опционально)
registerSystems(ecs: ECSManager): void {
  ecs.registerSystem(new MySystem());
}

// 4. Прикрепление к сцене (для UI модулей)
attachToScene(scene: Phaser.Scene): void {
  this.scene = scene;
  // Создаём UI
  // Подписываемся на события Phaser
}
```

### Паттерн 2: Общение через EventBus

**Отправка запроса**:
```typescript
eventBus.emit('ActionRequested', { action: 'build', x: 10, y: 20 });
```

**Обработка запроса**:
```typescript
eventBus.on('ActionRequested', (data) => {
  // Проверяем валидность
  // Изменяем состояние
  // Публикуем событие об успехе/неудаче
  eventBus.emit('ActionCompleted', { success: true });
});
```

**Реакция на событие**:
```typescript
eventBus.on('ActionCompleted', (data) => {
  if (data.success) {
    // Обновляем UI
  }
});
```

### Паттерн 3: Чтение vs Изменение состояния

**✅ Читать состояние напрямую — безопасно**:
```typescript
const speed = this.core.getTickManager().getSpeed();
const tick = this.core.getTickManager().getCurrentTick();
```

**❌ Изменять состояние напрямую — небезопасно**:
```typescript
// НЕ ДЕЛАЙТЕ ТАК!
this.core.getTickManager().setSpeed(2.0);
```

**✅ Изменять через события**:
```typescript
this.core.getEventBus().emit('SetSimulationSpeedRequested', { speedLevel: 2.0 });
```

**Почему?**
- Ядро может отклонить изменение (блокировки, валидация)
- Другие модули получат уведомление об изменении
- Логируется в одном месте

### Паттерн 4: Очистка ресурсов

```typescript
private handleSceneShutdown(): void {
  // 1. Удалить Phaser объекты
  if (this.uiComponent) {
    this.uiComponent.destroy();
    this.uiComponent = undefined;
  }

  // 2. Отписаться от событий Phaser
  if (this.scene) {
    this.scene.events.off('update', this.handleUpdate, this);
    this.scene.scale.off('resize', this.handleResize, this);
    this.scene = undefined;
  }

  // 3. Отписаться от событий EventBus (если нужно)
  // subscription.unsubscribe();
}

destroy(): void {
  this.handleSceneShutdown();
  
  // 4. Очистить подписки на события симуляции
  if (this.core) {
    const eventBus = this.core.getEventBus();
    eventBus.off('TickStarted', this.handleTick);
  }
}
```

**Важно**: всегда очищайте подписки и ссылки, чтобы избежать утечек памяти!

---

## Часть 5: Создание своего модуля — чеклист

Теперь вы знаете, как работает ядро. Вот чеклист для создания своего модуля:

### Шаг 1: Определите назначение модуля

- За что отвечает модуль? (экономика, транспорт, образование и т.д.)
- Какие данные он хранит? (компоненты ECS)
- Какую логику выполняет? (системы ECS)
- Какие события публикует? (для уведомления других модулей)
- Какие события слушает? (для реакции на изменения)

### Шаг 2: Создайте структуру модуля

```typescript
import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';

export class MyModule implements IModule {
  id = 'my_module';  // Уникальный ID
  dependencies?: string[] = ['other_module'];  // Зависимости (опционально)

  private core?: GameCore;

  async initialize(core: GameCore): Promise<void> {
    this.core = core;
    // Подписываемся на события
    const eventBus = core.getEventBus();
    eventBus.on('SomeEvent', this.handleEvent, this);
  }

  registerSystems(ecs: ECSManager): void {
    // Регистрируем системы (если есть)
    ecs.registerSystem(new MySystem());
  }

  destroy(): void {
    // Очищаем подписки
    if (this.core) {
      const eventBus = this.core.getEventBus();
      eventBus.off('SomeEvent', this.handleEvent);
    }
  }

  private handleEvent(data: any): void {
    // Реакция на событие
  }
}
```

### Шаг 3: (Опционально) Добавьте UI

Если модулю нужен UI:

```typescript
attachToScene(scene: Phaser.Scene): void {
  if (!this.core) {
    throw new Error('Module not initialized');
  }

  this.scene = scene;
  
  // Создайте UI компонент
  this.uiComponent = new MyUIComponent(scene, this.core);
  this.uiComponent.create();

  // Подпишитесь на события Phaser
  scene.events.on('update', this.handleSceneUpdate, this);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);
}

private handleSceneUpdate(_: number, delta: number): void {
  if (this.uiComponent) {
    this.uiComponent.update(delta);
  }
}

private handleSceneShutdown(): void {
  if (this.uiComponent) {
    this.uiComponent.destroy();
    this.uiComponent = undefined;
  }

  if (this.scene) {
    this.scene.events.off('update', this.handleSceneUpdate, this);
    this.scene = undefined;
  }
}
```

### Шаг 4: Зарегистрируйте модуль

```typescript
// В GameScene.create()

const moduleManager = this.core.getModuleManager();
moduleManager.registerModule(new MyModule());
```

### Шаг 5: Добавьте теги в документацию

В начало файла модуля:

```typescript
/**
 * Модуль управления образованием.
 *
 * **Теги**: `arch:module`, `gameplay:education`, `economy:employment`
 */
export class EducationModule implements IModule {
  // ...
}
```

И обновите `docs/tags-system.md`.

---

## Заключение

Теперь вы знаете:

1. **Зачем нужны компоненты ядра**:
   - `GameCore` — координатор всего
   - `ModuleManager` — управляет модулями
   - `TickManager` — управляет временем симуляции
   - `EventBus` — обеспечивает общение без зависимостей
   - `ECSManager` — хранит данные мира
   - `CommandProcessor` — обрабатывает команды игрока

2. **Как работает жизненный цикл**:
   - Создание → Инициализация → Регистрация модулей → Запуск → Прикрепление к сцене → Игровой цикл

3. **Паттерны взаимодействия**:
   - Инициализация модуля
   - Общение через `EventBus`
   - Чтение vs изменение состояния
   - Очистка ресурсов

4. **Как создать свой модуль**:
   - Реализовать интерфейс `IModule`
   - Подписаться на события
   - (Опционально) Создать UI через `attachToScene`
   - Зарегистрировать в `ModuleManager`

## Дополнительные материалы

- [Ядро простыми словами](../development/guides/core-for-developers.md) — концептуальное объяснение
- [Архитектура ядра](../development/architecture/core.md) — техническая документация
- [Модули симуляции](../development/architecture/modules.md) — подробнее о модулях
- [Жизненный цикл тика](../development/simulation/lifecycle.md) — детали игрового цикла
- [EventBus API](../development/architecture/event-bus.md) — работа с событиями

---

**Теги**: `arch:core`, `arch:module`, `guide:tutorial`, `guide:developer-onboarding`

© 2025 Script City. Документация обновляется по мере развития проекта.

