# Как использовать ECS (Entity Component System)

**Теги**: `guide:tutorial`, `guide:ecs`, `arch:ecs`, `tech:ecs`

Этот туториал показывает, как создавать и использовать сущности, компоненты и системы в Script City.

## Содержание

1. [Основы ECS](#основы-ecs)
2. [Создание сущностей](#создание-сущностей)
3. [Создание компонентов](#создание-компонентов)
4. [Создание систем](#создание-систем)
5. [Полный пример](#полный-пример)

---

## Основы ECS

ECS (Entity Component System) — это архитектурный паттерн, который разделяет данные и логику:

- **Entity (Сущность)** — это просто уникальный идентификатор (ID)
- **Component (Компонент)** — это данные, прикреплённые к сущности
- **System (Система)** — это логика, которая обрабатывает сущности с определёнными компонентами

**Пример**: Дом в игре — это сущность с компонентами `Position`, `Building`, `Construction`.

---

## Создание сущностей

Сущность создаётся через метод `createEntity()`:

```typescript
import { ECSManager } from '@/core/ecs_manager/ecs_manager';

const ecs = new ECSManager();

// Создание новой сущности
const houseId = ecs.createEntity();
console.log(houseId); // 0, 1, 2, ...

// Проверка существования сущности
if (ecs.hasEntity(houseId)) {
  console.log('Сущность существует');
}

// Получение всех сущностей
const allEntities = ecs.getAllEntities();

// Удаление сущности (удаляет и все её компоненты)
ecs.destroyEntity(houseId);
```

---

## Создание компонентов

Компонент — это обычный объект TypeScript. Вы можете создать компонент любого типа.

### Пример 1: Простой компонент позиции

```typescript
// Определяем тип компонента
interface PositionComponent {
  x: number;
  y: number;
}

// Создаём сущность
const entityId = ecs.createEntity();

// Добавляем компонент к сущности
ecs.addComponent<PositionComponent>(
  entityId,
  { x: 10, y: 20 },
  'Position', // Тип компонента (строка или символ)
);

// Получаем компонент
const position = ecs.getComponent<PositionComponent>(entityId, 'Position');
if (position) {
  console.log(`Позиция: x=${position.x}, y=${position.y}`);
}

// Проверка наличия компонента
if (ecs.hasComponent(entityId, 'Position')) {
  console.log('У сущности есть компонент Position');
}

// Удаление компонента
ecs.removeComponent(entityId, 'Position');
```

### Пример 2: Компонент здания

```typescript
interface BuildingComponent {
  type: 'house' | 'shop' | 'factory';
  capacity: number;
  level: number;
}

const buildingId = ecs.createEntity();
ecs.addComponent<BuildingComponent>(
  buildingId,
  {
    type: 'house',
    capacity: 10,
    level: 1,
  },
  'Building',
);
```

### Пример 3: Использование символов для типов компонентов

Для лучшей изоляции можно использовать символы:

```typescript
// Определяем символы для типов компонентов
const PositionType = Symbol('Position');
const BuildingType = Symbol('Building');

// Использование
ecs.addComponent(entityId, { x: 10, y: 20 }, PositionType);
const position = ecs.getComponent<PositionComponent>(entityId, PositionType);
```

### Пример 4: Поиск всех сущностей с компонентом

```typescript
// Найти все сущности с компонентом Position
const entitiesWithPosition = ecs.getEntitiesWithComponent('Position');

for (const entityId of entitiesWithPosition) {
  const position = ecs.getComponent<PositionComponent>(entityId, 'Position');
  if (position) {
    console.log(`Сущность ${entityId} находится в (${position.x}, ${position.y})`);
  }
}
```

---

## Создание систем

Система — это объект, который реализует интерфейс `ISystem`. Система обрабатывает сущности с определёнными компонентами.

### Структура системы

```typescript
import { ISystem } from '@/core/ecs_manager/types';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { EventBus } from '@/core/event_bus/event_bus';

const movementSystem: ISystem = {
  id: 'MovementSystem',
  priority: 1, // Приоритет выполнения (меньше = выше приоритет)
  updateInterval: 1, // Обновляется каждый тик (1 = каждый тик, 2 = каждый второй тик)

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    // Логика системы
  },
};
```

### Пример 1: Система движения

```typescript
interface PositionComponent {
  x: number;
  y: number;
}

interface VelocityComponent {
  vx: number;
  vy: number;
}

const movementSystem: ISystem = {
  id: 'MovementSystem',
  priority: 1,
  updateInterval: 1, // Обновляется каждый тик

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    // Находим все сущности с компонентами Position и Velocity
    const entitiesWithPosition = ecs.getEntitiesWithComponent('Position');

    for (const entityId of entitiesWithPosition) {
      const position = ecs.getComponent<PositionComponent>(entityId, 'Position');
      const velocity = ecs.getComponent<VelocityComponent>(entityId, 'Velocity');

      // Если у сущности есть и позиция, и скорость — обновляем позицию
      if (position && velocity) {
        position.x += velocity.vx * deltaTime;
        position.y += velocity.vy * deltaTime;

        // Публикуем событие о перемещении
        eventBus.emit('EntityMoved', { entityId, x: position.x, y: position.y });
      }
    }
  },
};

// Регистрация системы
ecs.registerSystem(movementSystem);
```

### Пример 2: Система зданий (обновляется реже)

```typescript
interface BuildingComponent {
  type: 'house' | 'shop' | 'factory';
  capacity: number;
  level: number;
  population: number;
}

const buildingSystem: ISystem = {
  id: 'BuildingSystem',
  priority: 2,
  updateInterval: 5, // Обновляется раз в 5 тиков

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    const buildings = ecs.getEntitiesWithComponent('Building');

    for (const buildingId of buildings) {
      const building = ecs.getComponent<BuildingComponent>(buildingId, 'Building');

      if (building) {
        // Логика обновления здания
        // Например, увеличение населения
        if (building.population < building.capacity) {
          building.population += 0.1;
        }

        // Публикуем событие об изменении здания
        eventBus.emit('BuildingUpdated', { buildingId, building });
      }
    }
  },
};

// Регистрация системы с переопределением приоритета
ecs.registerSystem(buildingSystem, 10); // Приоритет 10 вместо 2
```

### Пример 3: Система с проверкой нескольких компонентов

```typescript
interface HealthComponent {
  current: number;
  max: number;
}

interface DamageComponent {
  amount: number;
}

const damageSystem: ISystem = {
  id: 'DamageSystem',
  priority: 0, // Высокий приоритет (выполняется первой)
  updateInterval: 1,

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    // Находим все сущности с компонентом Damage
    const damagedEntities = ecs.getEntitiesWithComponent('Damage');

    for (const entityId of damagedEntities) {
      const health = ecs.getComponent<HealthComponent>(entityId, 'Health');
      const damage = ecs.getComponent<DamageComponent>(entityId, 'Damage');

      if (health && damage) {
        // Применяем урон
        health.current -= damage.amount;

        // Если здоровье закончилось
        if (health.current <= 0) {
          health.current = 0;
          eventBus.emit('EntityDied', { entityId });
        }

        // Удаляем компонент урона (одноразовый эффект)
        ecs.removeComponent(entityId, 'Damage');
      }
    }
  },
};

ecs.registerSystem(damageSystem);
```

---

## Полный пример

Вот полный пример создания игры с использованием ECS:

```typescript
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { EventBus } from '@/core/event_bus/event_bus';
import { ISystem } from '@/core/ecs_manager/types';

// Определяем типы компонентов
interface PositionComponent {
  x: number;
  y: number;
}

interface VelocityComponent {
  vx: number;
  vy: number;
}

interface HealthComponent {
  current: number;
  max: number;
}

// Создаём менеджеры
const eventBus = new EventBus();
const ecs = new ECSManager();

// Создаём сущность игрока
const playerId = ecs.createEntity();
ecs.addComponent<PositionComponent>(playerId, { x: 0, y: 0 }, 'Position');
ecs.addComponent<VelocityComponent>(playerId, { vx: 1, vy: 0 }, 'Velocity');
ecs.addComponent<HealthComponent>(playerId, { current: 100, max: 100 }, 'Health');

// Создаём сущность врага
const enemyId = ecs.createEntity();
ecs.addComponent<PositionComponent>(enemyId, { x: 10, y: 10 }, 'Position');
ecs.addComponent<VelocityComponent>(enemyId, { vx: -0.5, vy: 0 }, 'Velocity');
ecs.addComponent<HealthComponent>(enemyId, { current: 50, max: 50 }, 'Health');

// Система движения
const movementSystem: ISystem = {
  id: 'MovementSystem',
  priority: 1,
  updateInterval: 1,

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    const entities = ecs.getEntitiesWithComponent('Position');

    for (const entityId of entities) {
      const position = ecs.getComponent<PositionComponent>(entityId, 'Position');
      const velocity = ecs.getComponent<VelocityComponent>(entityId, 'Velocity');

      if (position && velocity) {
        position.x += velocity.vx * deltaTime;
        position.y += velocity.vy * deltaTime;
      }
    }
  },
};

// Система здоровья (обновляется реже)
const healthSystem: ISystem = {
  id: 'HealthSystem',
  priority: 2,
  updateInterval: 10, // Раз в 10 тиков

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    const entities = ecs.getEntitiesWithComponent('Health');

    for (const entityId of entities) {
      const health = ecs.getComponent<HealthComponent>(entityId, 'Health');

      if (health && health.current < health.max) {
        // Медленная регенерация
        health.current = Math.min(health.current + 1, health.max);
      }
    }
  },
};

// Регистрируем системы
ecs.registerSystem(movementSystem);
ecs.registerSystem(healthSystem);

// Запускаем системы (обычно это делает TickManager)
ecs.runSystems(1, eventBus); // deltaTime = 1 тик

// Проверяем результат
const playerPosition = ecs.getComponent<PositionComponent>(playerId, 'Position');
console.log(`Игрок в позиции: (${playerPosition?.x}, ${playerPosition?.y})`);
```

---

## Рекомендации

### 1. Организация компонентов

Создавайте файлы с типами компонентов:

```typescript
// src/components/position_component.ts
export interface PositionComponent {
  x: number;
  y: number;
}

export const PositionType = 'Position' as const;
```

### 2. Организация систем

Каждая система в отдельном файле:

```typescript
// src/systems/movement_system.ts
import { ISystem } from '@/core/ecs_manager/types';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { EventBus } from '@/core/event_bus/event_bus';

export const createMovementSystem = (): ISystem => ({
  id: 'MovementSystem',
  priority: 1,
  updateInterval: 1,
  update(deltaTime, ecs, eventBus) {
    // Логика
  },
});
```

### 3. Регистрация систем в модулях

Системы обычно регистрируются в методе `registerSystems` модуля:

```typescript
// src/modules/movement/movement_module.ts
import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { createMovementSystem } from '@/systems/movement_system';

export class MovementModule implements IModule {
  id = 'movement';

  async initialize(core: GameCore): Promise<void> {
    // Инициализация модуля
  }

  registerSystems(ecs: ECSManager): void {
    ecs.registerSystem(createMovementSystem());
  }
}
```

---

## Связанные документы

- [Архитектура ядра](../development/architecture/core.md) — техническая документация ECSManager
- [Как работает ядро на примере модулей](./how-core-works-by-modules-example.md) — примеры использования ядра
- [Разные частоты для подсистем](../development/simulation/system-frequencies.md) — настройка интервалов обновления

---

© 2025 Script City. Документация обновляется по мере развития проекта.
