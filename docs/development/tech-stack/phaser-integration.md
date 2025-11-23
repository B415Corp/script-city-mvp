# Инструкция по работе с Phaser в проекте Script City MVP

Этот документ описывает, **как использовать Phaser в рамках архитектуры проекта**, а не сам Phaser как игровой движок. За подробностями по общим концепциям движка см. официальную документацию Phaser (`https://docs.phaser.io`) и примеры (`https://phaser.io/examples`).

См. также:  
- `client.md` — общий обзор клиентской части и движка  
- `../architecture/core.md` — устройство `GameCore` и TickManager  
- `../architecture/renderer.md` — слой визуализации (Renderer)

---

## Роль Phaser в архитектуре проекта

В текущем MVP **Phaser — это слой визуализации и игровой цикл**, к которому "прикручено" игровое ядро:

- **Phaser.Scene**:
  - контейнер, внутри которого живут `GameCore`, ECS и модули;
  - источник тиков через `update(time, delta)` или таймеры Phaser.
- **GameCore**:
  - инициализируется внутри одной (или нескольких) сцен;
  - использует Phaser как "двигатель" кадров, но хранит игровое состояние у себя.
- **Renderer**:
  - реализован на Phaser (спрайты, тайлы, камеры);
  - читает данные из ECS-компонентов, **не меняет игровое состояние**.

Ключевой принцип: **вся игровая логика и состояние живут в Core/ECS**, Phaser-сцены и объекты — это только "обёртка" для времени, ввода и отрисовки.

---

## Базовый шаблон Phaser-игры под наш проект

Для создания игры мы используем стандартный конфиг Phaser, но сцены проектируются с учётом `GameCore` и Renderer.

Пример базовой конфигурации (упрощённо, без путей и сборки):

```ts
import Phaser from 'phaser';
import { GameScene } from './GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-root',
  backgroundColor: '#000000',
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } },
  },
};

export function createGame() {
  return new Phaser.Game(config);
}
```

Внутри первой сцены (`GameScene`) мы:

- инициализируем `GameCore`;
- привязываем TickManager к вызовам `update`;
- создаём Renderer и связываем его с ECS.

---

## Связка Phaser.Scene и GameCore

### Жизненный цикл сцены

Важные хуки Phaser:

- `preload()` — загрузка ассетов (тайлы, спрайты, атласы, шрифты);
- `create()` — создание `GameCore`, инициализация систем и Renderer;
- `update(time, delta)` — делегирование шага симуляции в TickManager.

Рекомендуемый шаблон сцены:

```ts
import Phaser from 'phaser';
import { GameCore } from 'src/core/GameCore'; // публичный API ядра

export class GameScene extends Phaser.Scene {
  private core!: GameCore;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Загружаем ассеты только через Phaser Loader
    this.load.setPath('assets/');
    this.load.image('tiles', 'tiles/city.png');
    // ...
  }

  async create() {
    // Инициализируем ядро, передаём в него ссылку на сцену при необходимости
    this.core = new GameCore({
      tickRate: 20,
      enableDebug: process.env.NODE_ENV === 'development',
      phaserScene: this,
    });

    await this.core.initialize();
    this.core.start();
  }

  update(time: number, delta: number) {
    // Делегируем шаг симуляции ядру (через TickManager)
    this.core.getTickManager().updateFromPhaser(delta);
  }
}
```

Важно:

- **Не помещать игровую логику в `GameScene`** — только инициализация/делегирование.
- Все изменения состояния (строительство, экономика и т.п.) идут через `GameCore` и его публичный API.

---

## Управление временем: Phaser vs TickManager

См. `core.md` и документы о тиках (`../simulation/lifecycle.md`, `../simulation/system-frequencies.md`).

Phaser даёт нам `update(time, delta)` с `delta` в миллисекундах. TickManager внутри ядра:

- накапливает прошедшее время;
- считает, сколько фиксированных тиков нужно выполнить;
- выполняет `runSystems()` нужное количество раз.

Рекомендуемая обвязка:

```ts
// внутри GameCore или отдельного адаптера
updateFromPhaser(deltaMs: number) {
  this.tickManager.step(deltaMs);
}
```

Где `TickManager.step(deltaMs)`:

- переводит `deltaMs` в "тик-единицы" с учётом `tickRate`;
- вызывает один или несколько тиков симуляции (catch-up).

**Нельзя** напрямую вызывать логику систем из Phaser-сцены; всегда проходить через TickManager / GameCore.

---

## Renderer: использование Phaser для отрисовки ECS

См. `renderer.md` для концепции. Здесь — практические правила.

### Где создаём спрайты и тайлы

- Создаём тайловые слои и спрайты **только в Renderer-слое**, который:
  - получает ссылку на `Phaser.Scene`;
  - читает ECS-компоненты (`PositionComponent`, `RenderComponent` и т.д.);
  - синхронизирует объекты Phaser с данными ECS.

Пример адаптера рендера:

```ts
export class PhaserRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ecs: ECSManager,
  ) {}

  init() {
    // создаём слои, камеры и т.п.
  }

  renderFrame() {
    // читаем ECS и обновляем спрайты
  }
}
```

Вызов `renderFrame` можно "подвесить" либо к каждому тику симуляции, либо к `update` сцены, в зависимости от производительности.

### Запреты

- **Никакой боевой логики в колбэках Phaser** (`pointerdown`, `overlap`, `physics` и т.п.) — только генерация команд/событий для ядра.
- **Не хранить состояние игры в полях Phaser-объектов** (только тех. данные для рендера).

---

## Ввод (мышь/клавиатура) через Phaser

Phaser предоставляет API ввода, но в нашей архитектуре он используется как источник событий для UI/команд.

Рекомендуемый паттерн:

1. В сцене/Renderer подписываемся на события ввода (`pointermove`, `pointerdown`, клавиши).
2. Переводим координаты экрана в координаты мира/тайлов.
3. Генерируем **команды для Core** через `CommandProcessor`:
   - `BuildBuilding`, `BulldozeArea`, `SetSimulationSpeed` и т.д.

Пример:

```ts
this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const tilePos = this.worldToTile(worldPoint.x, worldPoint.y);

  this.core
    .getCommandProcessor()
    .enqueueCommand({
      type: 'BuildBuilding',
      timestamp: Date.now(),
      position: tilePos,
      buildingType: 'residential_low',
    });
});
```

Таким образом:

- Phaser отвечает за низкоуровневый ввод;
- Core принимает решение, что делать (валидирует команду, обновляет ECS).

---

## Многосценовый подход (меню, игра, оверлеи)

Phaser поддерживает несколько сцен. В контексте проекта:

- **GameScene** — основная сцена мира + ядро;
- **UIScene** (опционально) — отдельный HUD/меню, общающийся с Core через EventBus/команды;
- **LoadingScene / MenuScene** — стартовые сцены без ядра или с "облегчённым" Core.

Рекомендации:

- Не создавать несколько независимых экземпляров `GameCore` для разных сцен;
- Если нужна параллельная UI-сцена — передавать ей ссылку на Core или абстрактный фасад (публичный API).

---

## Работа с ассетами и путями

Phaser Loader (`this.load`) — **единственный способ** загрузки игровых ассетов в сценах:

- тайловые карты (`tilemapTiledJSON`, `tilemapCSV`);
- спрайты и атласы (`image`, `atlas`);
- шрифты и спрайт-листы.

Практические правила:

- Все ключи ассетов и пути централизуем (константы/конфиги), чтобы не размазывать строки по коду.
- Не обращаться к ассетам напрямую из Core/ECS; они известны только Renderer-слою.

---

## Использование Phaser API: что можно и что нельзя

### Можно

- использовать `Phaser.Scene`, камеры, тайловые карты, спрайты, контейнеры;
- использовать систему ввода Phaser как источник событий для команд ядру;
- использовать таймеры/Clock Phaser для вспомогательных визуальных эффектов;
- использовать физику (Arcade/другая) **только для визуальных/упрощённых задач**, не как основной источник правды о состоянии.

### Нельзя

- хранить "истинное" состояние игры в объектах Phaser (позиции, ресурсы, экономика и т.п.);
- вызывать бизнес-логику напрямую из Phaser без прохождения через Core/ECS;
- смешивать загрузку ассетов и игровую инициализацию в одном месте — загрузка в `preload`, инициализация ядра в `create`.

---

## Как расширять интеграцию Phaser

При добавлении новых фич, связанных с Phaser:

1. **Проверить связанные документы**:
   - `client.md` — общая картина клиентской части;
   - `core.md` — обязанности ядра и публичный API;
   - `renderer.md` — правила слоя визуализации;
   - документы по симуляции (`../simulation/*.md`) — если фича затрагивает логику.
2. **Распределить ответственность**:
   - что должно лежать в Core/ECS (логика, состояние);
   - что должно быть в Renderer/Scene (визуализация, ввод).
3. **Использовать публичный API ядра**:
   - для чтения состояния — фасады/агрегированные данные;
   - для изменений — только через команды и события.

Если при интеграции возникает желание "проще сделать всё прямо в Phaser-сцене" — почти всегда это сигнал, что нужно сначала расширить Core/Renderer и их API, а уже потом вызывать их из сцены.

---

## Полезные ссылки по Phaser (через Context7)

- Официальный "Hello World" и быстрая настройка окружения — см. раздел *Getting Started* в документации Phaser.
- Инициализация игры и конфиг `Phaser.Game` — см. примеры типа "making your first Phaser game".
- Документация по сценам (`Scenes`), загрузчику (`Loader`), вводу (`Input`) и тайловым картам (`Tilemaps`) — основные разделы, которые используются в нашем Renderer.


