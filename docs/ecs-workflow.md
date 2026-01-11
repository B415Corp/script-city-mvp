# ECS Workflow: Создание компонентов, сущностей, систем и модулей

## 📋 Обзор архитектуры

Проект использует ECS (Entity Component System) архитектуру с автоматической регистрацией всех элементов. Система построена на следующих принципах:

- **Автоматическая регистрация**: Все компоненты, системы, кластеры и фабрики сущностей регистрируются автоматически при создании
- **Метаданные-driven**: Поведение элементов управляется через метаданные
- **Модульная структура**: Каждый элемент находится в своей папке с файлами
- **Smart constructors**: Умные конструкторы для создания и регистрации элементов

## 🏗️ Структура проекта

```
src/core/
├── ecs/
│   ├── test/             # Автоматический импорт всех тестовых ECS элементов
│   ├── components/        # Компоненты (данные сущностей)
│   ├── entities/         # Фабрики сущностей
│   ├── systems/          # Системы (логика)
│   ├── clusters/         # Кластеры систем
│   ├── registry/         # Реестры для автоматической регистрации
│   └── core/             # Smart constructors и schema
├── simulations/          # Классы симуляций (EntrySimulation и др.)
├── modules/              # Модули (высокоуровневые компоненты)
│   ├── base_modules/     # Базовые модули (MapModule, ToolsModule, SimulationModule и т.д.)
│   └── custom_modules/   # Кастомные модули
```

## 🧩 1. Создание компонентов

### Шаг 1: Структура папок

```
src/core/ecs/components/
└── [category]/
    └── [component_name].ts
```

### Шаг 2: Использование smart constructor

```typescript
import { createComponent } from '../../core/smart_constructors';

/**
 * Компонент позиции
 * Хранит координаты X, Y сущности
 */
export const Position = createComponent('Position', {
  x: 0, // X координата
  y: 0, // Y координата
  z: 0, // Z координата (высота)
});

/**
 * Компонент здоровья
 * Управляет здоровьем сущности
 */
export const Health = createComponent('Health', {
  current: 100, // Текущее здоровье
  max: 100, // Максимальное здоровье
  regeneration: 1, // Регенерация в секунду
});
```

### ✅ Что происходит автоматически:

- Компонент регистрируется в `ComponentRegistry`
- Создается BitECS компонент с заданными полями
- Компонент становится доступен для систем

### 📝 Соглашения:

- Имена компонентов в PascalCase
- Поля компонентов в camelCase
- Все поля должны быть числами (BitECS ограничение)
- Использовать осмысленные названия полей

## ⚙️ 2. Создание систем

### Шаг 1: Структура папок

```
src/core/ecs/systems/
└── [category]/
    └── [system_name].ts
```

### Шаг 2: Типы систем

#### Обычная система (каждый тик)

```typescript
import { createSystem } from '../../core/smart_constructors';

export const MovementSystem = createSystem(
  'movement', // Уникальное имя
  ['Position', 'Velocity'], // Зависимые компоненты
  (world, entities, delta) => {
    // Логика обновления
    for (const entityId of entities) {
      // Обновить позицию на основе скорости
      // position.x += velocity.x * delta;
    }
  },
  {
    cluster: 'physics', // Кластер принадлежности
    enabled: true, // Включена по умолчанию
  },
);
```

#### Интервальная система

```typescript
export const SaveSystem = createSystem(
  'auto_save',
  ['PlayerData'],
  (world, entities, delta) => {
    // Логика автосохранения
    console.log('Auto-saving game...');
  },
  {
    cluster: 'persistence',
    interval: 30000, // Каждые 30 секунд
    enabled: true,
  },
);
```

#### Event-driven система

```typescript
export const LevelUpSystem = createSystem(
  'level_up',
  ['Player', 'Experience'],
  (world, entities, delta) => {
    // Логика повышения уровня
    console.log('Player leveled up!');
  },
  {
    cluster: 'gameplay',
    eventTriggers: ['player:level_up', 'experience:gained'],
    enabled: true,
  },
);
```

### ✅ Что происходит автоматически:

- Система регистрируется в `SystemRegistry` с метаданными
- На основе метаданных система добавляется в соответствующий кластер
- Интервальные системы настраиваются для периодического выполнения
- Event-driven системы подписываются на указанные события

### 📝 Соглашения:

- Имена систем в snake_case
- Метаданные обязательны для каждой системы
- `cluster` определяет группировку систем
- `enabled: false` отключает систему

## 🏭 3. Создание фабрик сущностей

Фабрики сущностей - это функции, которые создают новые сущности в мире BitECS. Каждая фабрика принимает `world: World` как параметр и возвращает `entityId` созданной сущности.

**Важно**: Начиная с версии где фабрики принимают `world` параметр, это breaking change. Ранее фабрики не принимали параметров.

### Шаг 1: Структура папок

```
src/core/ecs/entities/
└── [category]/
    └── [entity_factory_name].ts
```

### Шаг 2: Создание фабрики

```typescript
import { addEntity, addComponent } from 'bitecs';
import { createEntityFactory } from '../../core/smart_constructors';
import { Position } from '../components/Position';
import { Health } from '../components/Health';

export const createPlayer = createEntityFactory(
  'player', // Уникальное имя фабрики
  (world) => {
    // Создание сущности
    const entityId = addEntity(world);

    // Добавление компонентов
    addComponent(world, entityId, Position);
    Position.x[entityId] = 0;
    Position.y[entityId] = 0;

    addComponent(world, entityId, Health);
    Health.current[entityId] = 100;
    Health.max[entityId] = 100;

    return entityId;
  },
  'Создает сущность игрока с базовыми компонентами', // Описание
);

export const createEnemy = createEntityFactory(
  'enemy',
  (world) => {
    const entityId = addEntity(world);

    addComponent(world, entityId, Position);
    addComponent(world, entityId, Health);

    // Настройка компонентов врага
    Health.max[entityId] = 50;
    Health.current[entityId] = 50;

    return entityId;
  },
  'Создает сущность врага',
);
```

### ✅ Что происходит автоматически:

- Фабрика регистрируется в `EntityFactoryRegistry`
- Фабрика становится доступна для создания сущностей через `registry.create(name, world)`
- Фабрика доступна для тестирования через `core.ecsRegistries().entityFactories()`

### 📝 Соглашения:

- Имена фабрик в snake_case
- Описание обязательно для документации
- Фабрика должна возвращать `entityId`
- Фабрика принимает `world: World` как первый параметр для работы с BitECS

## 📦 4. Создание кластеров

### Автоматическое создание кластеров

Кластеры создаются автоматически на основе метаданных систем:

```typescript
// Системы автоматически группируются в кластеры
const physicsSystems = createSystem('movement', ['Position'], logic, {
  cluster: 'physics',
});

const renderSystems = createSystem('sprite_render', ['Sprite'], logic, {
  cluster: 'rendering',
});

// Автоматически создается кластер 'physics' с системой 'movement'
// Автоматически создается кластер 'rendering' с системой 'sprite_render'
```

### Ручное создание кластеров

```typescript
import { createCluster } from '../../core/smart_constructors';

export const PhysicsCluster = createCluster(
  'physics',
  ['movement', 'collision', 'gravity'], // Имена систем
  {
    enabled: true,
    description: 'Физические расчеты и столкновения',
    interval: undefined, // Каждый тик
  },
);

export const RenderingCluster = createCluster('rendering', ['sprite_render', 'particle_render'], {
  enabled: true,
  description: 'Рендеринг спрайтов и частиц',
});
```

### ✅ Что происходит автоматически:

- Кластер регистрируется в `ClusterRegistry`
- Системы кластера выполняются вместе
- Интервальные кластеры выполняются по расписанию

## 🧩 5. Создание модулей

### Структура модулей

```
src/core/modules/
├── base_modules/           # Базовые модули (ядро)
│   └── [module_name]/
│       ├── [module_name].ts
│       ├── components/
│       ├── types.ts
│       └── ...
└── custom_modules/         # Кастомные модули
    └── [module_name].ts
```

### Базовый модуль

```typescript
import { BaseModule } from '../extends/base_module';
import { EventBus } from '../../event_bus/event_bus';
import { ECSManager } from '../../ecs/ecs_manager';

export class MapModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  protected ecsManager!: ECSManager;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.logger.info('MapModule initialized');

    // Инициализация модуля
    this.initMapRendering();
    this.initCameraControls();
  }

  private initMapRendering(): void {
    // Логика рендеринга карты
  }

  private initCameraControls(): void {
    // Логика управления камерой
  }

  // Public API для других модулей
  public zoomIn(): void {
    // Увеличить масштаб
  }

  public moveCamera(direction: 'up' | 'down' | 'left' | 'right'): void {
    // Переместить камеру
  }
}
```

### Кастомный модуль

```typescript
import { CustomModule } from '../extends/custom_module';
import { ECSManager } from '../../ecs/ecs_manager';

export class MyCustomModule extends CustomModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.logger.info('MyCustomModule initialized');

    // Кастомная логика
    this.addCustomUI();
  }

  private addCustomUI(): void {
    // Добавление кастомного UI
    this.scene.add.text(10, 10, 'Custom Module Active');
  }
}
```

### ✅ Что происходит автоматически:

- Модуль регистрируется в `ModuleManager`
- Модуль получает доступ к сцене и event bus
- Базовые модули инициализируются автоматически
- Кастомные модули можно включать/выключать

## 🔄 6. Автоматическая регистрация

### Как работает автоматическая регистрация

1. **При создании компонента** (`createComponent`):
   - Создается BitECS компонент
   - Регистрируется в `ComponentRegistry`

2. **При создании системы** (`createSystem`):
   - Создается функция системы
   - Регистрируется в `SystemRegistry` с метаданными
   - На основе метаданных добавляется в кластер

3. **При создании кластера** (`createCluster`):
   - Регистрируется в `ClusterRegistry`
   - Системы группируются для совместного выполнения

4. **При инициализации ECS** (`ECSManager.initECSManager`):
   - Все зарегистрированные компоненты доступны в мире
   - Все системы настроены согласно метаданным
   - Кластеры созданы и готовы к работе

### Правильный импорт для автоматической регистрации

Для автоматической регистрации все ECS элементы должны быть импортированы. Рекомендуется использовать **index.ts файлы** для группового импорта:

#### Создание index.ts файла для категории

```typescript
// src/core/ecs/test/index.ts
// Автоматический импорт всех тестовых ECS элементов

// Компоненты
import '../components/test/test_component';
import '../components/test/firts_sim_components';

// Системы
import '../systems/test/test_system';
import '../systems/test/firts_sim_system';

// Фабрики сущностей
import '../entities/test/test_entity_factory';
import '../entities/test/firts_sim_factory';

// Кластеры
import '../clusters/firts_sim_cluster';
```

#### Импорт в main.ts

```typescript
// Импорт всех тестовых ECS элементов (автоматическая регистрация)
import './core/ecs/test';
```

### Преимущества index.ts подхода:

- ✅ **Один импорт** вместо множества отдельных
- ✅ **Автоматическое подключение** новых файлов при добавлении в index.ts
- ✅ **Масштабируемость** - легко добавить новые категории
- ✅ **Организованность** - все импорты в одном месте

### Реестры

```typescript
// Доступ к реестрам через Core
const registries = core.ecsRegistries();

// Получить все компоненты
const components = registries.components().getAll();

// Получить все системы
const systems = registries.systems().getAll();

// Получить все кластеры
const clusters = registries.clusters().getAll();

// Получить фабрики сущностей
const factories = registries.entityFactories().getAll();

// Создать сущность через фабрику
const entityId = registries.entityFactories().create('player', world);
```

## 🎯 7. Workflow разработки

### Добавление новой фичи

1. **Определить компоненты** (данные)
2. **Создать системы** (логика обработки данных)
3. **Сгруппировать в кластеры** (организация систем)
4. **Создать фабрики сущностей** (конструкторы объектов)
5. **Добавить в модули** (интеграция с игрой)
6. **Настроить автоматическую регистрацию** (добавить в index.ts)
7. **Запустить симуляцию** (через SimulationModule или EntrySimulation)

### Запуск симуляции

Симуляции запускаются через **модули** или **EntrySimulation классы**:

#### Через модули (рекомендуется)

```typescript
// src/core/modules/base_modules/simulation_module/simulation_module.ts
export class SimulationModule extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.startSimulation(); // Запуск симуляции в конструкторе
  }

  public startSimulation(): void {
    // Создание сущностей
    this.createCitizens();
    this.createFactories();

    // Системы запускаются автоматически через ECS
  }
}
```

#### Через EntrySimulation класс

```typescript
// src/core/simulations/entry_simulation.ts
export class EntrySimulation {
  constructor(
    private ecsManager: ECSManager,
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {}

  public start(): void {
    // Логика запуска симуляции
  }
}
```

### Пример: Система инвентаря

```typescript
// 1. Компоненты
export const Inventory = createComponent('Inventory', {
  size: 20,
  gold: 0,
});

export const Item = createComponent('Item', {
  itemId: 0,
  quantity: 1,
});

// 2. Системы
export const InventorySystem = createSystem(
  'inventory_management',
  ['Inventory', 'Item'],
  (world, entities, delta) => {
    // Логика управления инвентарем
  },
  { cluster: 'gameplay' },
);

// 3. Фабрика сущностей
export const createItem = createEntityFactory(
  'item',
  (world) => {
    const entityId = addEntity(world);
    addComponent(world, entityId, Item);
    return entityId;
  },
  'Создает предмет в мире',
);

// 4. Автоматическая регистрация
// Добавить в src/core/ecs/test/index.ts:
import '../components/test/inventory_components';
import '../systems/test/inventory_system';
import '../entities/test/item_factory';

// 5. Модуль для запуска симуляции
export class InventoryModule extends BaseModule {
  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.startInventorySimulation();
  }

  private startInventorySimulation(): void {
    const world = this.ecsManager.getWorld();

    // Создание предметов через фабрики
    const registries = this.ecsManager.getRegistries();
    const itemId = registries.entityFactories().create('item', world);
  }
}
```

## 🧪 8. Тестирование

### Тестирование компонентов

```typescript
import { TestComponent } from '../components/test/test_component';

describe('TestComponent', () => {
  it('should be registered', () => {
    const registry = ComponentRegistry.getInstance();
    expect(registry.has('TestComponent')).toBe(true);
  });
});
```

### Тестирование систем

```typescript
describe('TestSystem', () => {
  it('should be registered with correct metadata', () => {
    const registry = SystemRegistry.getInstance();
    const system = registry.get('test');

    expect(system?.metadata.cluster).toBe('test');
    expect(system?.metadata.enabled).toBe(true);
  });
});
```

### Тестирование ECS Manager

```typescript
describe('ECSManager', () => {
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Очистка реестров перед каждым тестом
    ComponentRegistry.getInstance().clear();
    SystemRegistry.getInstance().clear();
  });

  it('should auto-register components', () => {
    ecsManager = new ECSManager(eventBus, tickManager);
    const stats = ecsManager.getStats();

    expect(stats.totalSystemsCount).toBeGreaterThan(0);
  });
});
```

## 📚 9. Документация и теги

### Теги компонентов

- `#component:position` - компонент позиции
- `#component:health` - компонент здоровья
- `#component:inventory` - компонент инвентаря

### Теги систем

- `#system:movement` - система движения
- `#system:combat` - система боя
- `#system:rendering` - система рендеринга

### Теги кластеров

- `#cluster:physics` - физические расчеты
- `#cluster:rendering` - рендеринг
- `#cluster:gameplay` - игровая логика

## 🔧 10. Полезные команды

```bash
# Запуск тестов
npm test

# Запуск конкретных тестов ECS
npm test -- src/core/ecs

# Линтинг
npm run lint

# Сборка проекта
npm run build
```

## 📋 Checklist создания новой фичи

- [ ] Определены необходимые компоненты
- [ ] Созданы системы с правильными метаданными
- [ ] Компоненты и системы протестированы
- [ ] Фабрики сущностей созданы (если нужны)
- [ ] Системы сгруппированы в кластеры
- [ ] **Добавлены импорты в index.ts для автоматической регистрации**
- [ ] **Создан/обновлен модуль для запуска симуляции**
- [ ] Добавлена документация с тегами
- [ ] Написаны тесты
- [ ] Проведено ручное тестирование

---

**Примечание**: Все компоненты, системы и кластеры регистрируются автоматически при импорте их файлов. Для удобства используйте index.ts файлы для группового импорта. Создайте файл и добавьте его импорт в соответствующий index.ts файл для автоматической регистрации.
