# 🎯 ПЛАН РЕФАКТОРИНГА ПРОЕКТА - Script City MVP

## 📊 ОБЩАЯ ИНФОРМАЦИЯ

**Цель:** Улучшить Developer Experience (DX) и тестируемость проекта
**Текущий DX Score:** 6.5/10
**Целевой DX Score:** 8.5/10
**Текущая тестируемость:** 4.5/10
**Целевая тестируемость:** 8.0/10
**Общее время:** 2-3 дня работы

---

## 🚀 ФАЗА 1: КРИТИЧНЫЕ ИСПРАВЛЕНИЯ (День 1, 4-5 часов)

### 1.1 Добавить cleanup методы (1 час)

**Файл:** `src/core/core.ts`

**Проблема:** Утечка памяти из-за window.addEventListener без cleanup

**Задача:**

```typescript
export class Core {
  private phaserConfig!: Phaser.Types.Core.GameConfig;
  private phaser!: Phaser.Game | null;
  private resizeHandler?: () => void; // ← ДОБАВИТЬ

  public moduleManager!: ModuleManager | null;
  public ecsManager!: ECSManager;
  public eventBus!: EventBus;
  public tickManager!: TickManager;

  constructor(phaserConfig: Phaser.Types.Core.GameConfig) {
    this.phaserConfig = phaserConfig;
    this.setupResizeHandler(); // ← ИЗМЕНИТЬ
  }

  // ← ДОБАВИТЬ новый метод
  private setupResizeHandler(): void {
    this.resizeHandler = () => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  // ← ДОБАВИТЬ метод cleanup
  public destroy(): void {
    // Удаляем resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Очищаем moduleManager
    this.moduleManager = null;

    // Уничтожаем Phaser
    this.phaser?.destroy(true);
    this.phaser = null;
  }
}
```

**Файл:** `src/core/simulations/entry_simulation.ts`

**Задача:**

```typescript
export class EntrySimulation {
  private entityFactory: EntityFactory;
  private simulationStartTime: number = 0;
  private isSimulationRunning: boolean = false;
  private rafId: number | null = null; // ← ДОБАВИТЬ

  // ... существующий код

  private startTimeUpdates(): void {
    const updateTime = (timestamp: number): void => {
      if (this.isSimulationRunning) {
        const delta = timestamp - this.simulationStartTime;
        this.simulationStartTime = timestamp;

        this.tickManager.update(timestamp, delta);

        this.rafId = window.requestAnimationFrame(updateTime); // ← ИЗМЕНИТЬ
      }
    };

    this.simulationStartTime = window.performance.now();
    this.rafId = window.requestAnimationFrame(updateTime); // ← ИЗМЕНИТЬ
  }

  // ← ДОБАВИТЬ метод stop
  public stop(): void {
    this.isSimulationRunning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    console.log('Simulation stopped');
  }
}
```

---

### 1.3 Добавить обработку ошибок в Promise (1 час) (пропустить!!!)

**Файл:** `src/core/core.ts`

**Проблема:** Promise в initPhaser и initModules не обрабатывают ошибки и таймауты

**Задача:**

```typescript
export class Core {
  // ... существующий код

  // ← УЛУЧШИТЬ обработку ошибок
  private async initPhaser(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.phaser = new Phaser.Game(this.phaserConfig);

      // ← ДОБАВИТЬ timeout
      const timeout = setTimeout(() => {
        reject(new Error('Phaser initialization timeout (5 seconds)'));
      }, 5000);

      this.phaser.events.once('ready', () => {
        clearTimeout(timeout); // ← ДОБАВИТЬ
        resolve();
      });

      // ← ДОБАВИТЬ обработку ошибок Phaser
      this.phaser.events.once('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  // ← УЛУЧШИТЬ обработку ошибок
  private async initModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ← ДОБАВИТЬ проверку инициализации Phaser
      if (!this.phaser) {
        return reject(new Error('Phaser not initialized'));
      }

      // ← ДОБАВИТЬ timeout
      const timeout = setTimeout(() => {
        reject(new Error('Module initialization timeout (5 seconds)'));
      }, 5000);

      this.phaser.events.once('ready', () => {
        clearTimeout(timeout); // ← ДОБАВИТЬ

        try {
          const scene = this.phaser!.scene.getScene('main_scene') as MainScene;

          // ← ДОБАВИТЬ проверку существования сцены
          if (!scene) {
            throw new Error('MainScene not found');
          }

          console.log('Phaser ready, initializing scene with eventBus:', this.eventBus);
          scene.init(this.eventBus, this.tickManager);
          this.moduleManager = new ModuleManager(scene, this.eventBus, this.ecsManager);
          this.moduleManager.init();
          scene.setModuleManager(this.moduleManager);

          resolve();
        } catch (error) {
          reject(error); // ← ДОБАВИТЬ обработку ошибок
        }
      });
    });
  }
}
```

---

### 1.4 Убрать null assertions (!) (30 минут)

**Файл:** `src/core/core.ts`

**Проблема:** Использование `!` оператора может привести к runtime ошибкам

**Задача:** Заменить `!` на явные проверки

```typescript
export class Core {
  // ← ИЗМЕНИТЬ объявление полей (убрать !)
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private phaser: Phaser.Game | null = null; // ← ДОБАВИТЬ = null

  public moduleManager: ModuleManager | null = null; // ← ДОБАВИТЬ = null
  public ecsManager: ECSManager | null = null; // ← ДОБАВИТЬ = null
  public eventBus: EventBus | null = null; // ← ДОБАВИТЬ = null
  public tickManager: TickManager | null = null; // ← ДОБАВИТЬ = null

  constructor(phaserConfig: Phaser.Types.Core.GameConfig) {
    this.phaserConfig = phaserConfig;
    this.setupResizeHandler();
  }

  // ... методы init остаются прежними, но добавляем проверки:

  private async initModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.phaser) {
        return reject(new Error('Phaser not initialized'));
      }

      const timeout = setTimeout(() => {
        reject(new Error('Module initialization timeout'));
      }, 5000);

      this.phaser.events.once('ready', () => {
        clearTimeout(timeout);

        try {
          // ← УБРАТЬ ! и добавить проверки
          if (!this.phaser) {
            throw new Error('Phaser is null');
          }

          const scene = this.phaser.scene.getScene('main_scene') as MainScene;

          if (!scene) {
            throw new Error('MainScene not found');
          }

          if (!this.eventBus) {
            throw new Error('EventBus not initialized');
          }

          if (!this.tickManager) {
            throw new Error('TickManager not initialized');
          }

          if (!this.ecsManager) {
            throw new Error('ECSManager not initialized');
          }

          scene.init(this.eventBus, this.tickManager);
          this.moduleManager = new ModuleManager(scene, this.eventBus, this.ecsManager);
          this.moduleManager.init();
          scene.setModuleManager(this.moduleManager);

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
```

**Файл:** `src/core/scenes/main_scene.ts`

**Задача:** Убрать ! из объявлений полей (аналогично Core)

```typescript
export class MainScene extends Phaser.Scene {
  private eventBus: EventBus | null = null; // ← ИЗМЕНИТЬ
  private tickManager: TickManager | null = null; // ← ИЗМЕНИТЬ
  private moduleManager: ModuleManager | null = null; // ← ИЗМЕНИТЬ
  private sceneReadyEmitted = false;

  // ... остальной код с проверками на null
}
```

---

### 1.5 Добавить простой Logger (1 час)

**Создать файл:** `src/core/utils/logger.ts`

```typescript
/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Простой структурированный логгер
 */
export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private context: string;

  private constructor(context: string = 'App', level?: LogLevel) {
    this.context = context;
    this.level = level ?? this.getDefaultLevel();
  }

  /**
   * Получить инстанс логгера
   */
  static getInstance(context?: string, level?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context, level);
    }
    return Logger.instance;
  }

  /**
   * Создать логгер для конкретного контекста
   */
  static create(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Получить уровень логирования по умолчанию из env
   */
  private getDefaultLevel(): LogLevel {
    if (import.meta.env.PROD) {
      return LogLevel.ERROR;
    }
    return LogLevel.DEBUG;
  }

  /**
   * Установить уровень логирования
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Debug сообщение
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Info сообщение
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Warning сообщение
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Error сообщение
   */
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR][${this.context}] ${message}`, error, ...args);
    }
  }
}

// Export singleton для глобального использования
export const logger = Logger.getInstance();
```

**Задача:** Заменить console.log на Logger во всех файлах

**Примеры замены:**

```typescript
// ❌ БЫЛО:
console.log('Phaser ready, initializing scene');
console.error('Error initializing:', error);

// ✅ СТАЛО:
import { Logger } from './utils/logger';

const logger = Logger.create('Core');
logger.info('Phaser ready, initializing scene');
logger.error('Error initializing:', error);
```

**Файлы для замены:**

- `src/core/core.ts`
- `src/core/ecs/ecs_manager.ts`
- `src/core/simulations/entry_simulation.ts`
- `src/core/scenes/main_scene.ts`
- Все системы в `src/core/ecs/systems/`

---

## 🎨 ФАЗА 2: ECS РЕФАКТОРИНГ (День 2, 6-8 часов)

### 2.1 Создать Component Builder (4 часа)

**Создать файл:** `src/core/ecs/component_builder.ts`

```typescript
import { World, EntityId, addComponent } from 'bitecs';

/**
 * Определение поля компонента
 */
export type FieldDefinition =
  | { type: 'number'; default?: number; min?: number; max?: number }
  | { type: 'string'; default?: string }
  | { type: 'boolean'; default?: boolean }
  | { type: 'entity'; default?: EntityId }
  | { type: 'entity[]'; default?: EntityId[] };

/**
 * Схема компонента
 */
export type ComponentSchema = Record<string, FieldDefinition>;

/**
 * Извлекает TypeScript тип из схемы
 */
export type InferComponentData<T extends ComponentSchema> = {
  [K in keyof T]: T[K] extends { type: 'number' }
    ? number
    : T[K] extends { type: 'string' }
      ? string
      : T[K] extends { type: 'boolean' }
        ? boolean
        : T[K] extends { type: 'entity' }
          ? EntityId
          : T[K] extends { type: 'entity[]' }
            ? EntityId[]
            : never;
};

/**
 * Компонент с методами
 */
export interface ComponentDefinition<T extends ComponentSchema = any> {
  readonly name: string;
  readonly schema: T;
  readonly _raw: Record<string, any>; // BitECS массивы

  get(world: World, eid: EntityId): InferComponentData<T>;
  set(world: World, eid: EntityId, data: Partial<InferComponentData<T>>): void;
  create(world: World, eid: EntityId, data?: Partial<InferComponentData<T>>): void;
  has(world: World, eid: EntityId): boolean;
}

/**
 * Получить значение по умолчанию для поля
 */
function getDefault(field: FieldDefinition): any {
  if ('default' in field && field.default !== undefined) {
    return field.default;
  }

  switch (field.type) {
    case 'number':
      return 0;
    case 'string':
      return '';
    case 'boolean':
      return false;
    case 'entity':
      return 0;
    case 'entity[]':
      return [];
  }
}

/**
 * Валидация значения поля
 */
function validate(value: any, field: FieldDefinition, fieldName: string): boolean {
  if (field.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`Invalid number for ${fieldName}: ${value}`);
      return false;
    }
    if ('min' in field && field.min !== undefined && value < field.min) {
      console.warn(`Value ${value} is less than min ${field.min} for ${fieldName}`);
      return false;
    }
    if ('max' in field && field.max !== undefined && value > field.max) {
      console.warn(`Value ${value} is greater than max ${field.max} for ${fieldName}`);
      return false;
    }
  }

  if (field.type === 'string' && typeof value !== 'string') {
    console.warn(`Invalid string for ${fieldName}: ${value}`);
    return false;
  }

  if (field.type === 'boolean' && typeof value !== 'boolean') {
    console.warn(`Invalid boolean for ${fieldName}: ${value}`);
    return false;
  }

  return true;
}

/**
 * Создает типобезопасный компонент с методами
 */
export function defineComponent<T extends ComponentSchema>(
  name: string,
  schema: T,
): ComponentDefinition<T> {
  // Создаем BitECS массивы для каждого поля
  const raw: Record<string, any> = {};

  for (const [key, field] of Object.entries(schema)) {
    if (field.type === 'entity[]') {
      raw[key] = [] as EntityId[][];
    } else if (field.type === 'string') {
      raw[key] = [] as string[];
    } else {
      raw[key] = [] as number[];
    }
  }

  const component: ComponentDefinition<T> = {
    name,
    schema,
    _raw: raw,

    /**
     * Type-safe getter - возвращает данные компонента для сущности
     */
    get(world: World, eid: EntityId): InferComponentData<T> {
      const result: any = {};

      for (const [key, field] of Object.entries(schema)) {
        const value = raw[key][eid];
        result[key] = value !== undefined ? value : getDefault(field);
      }

      return result;
    },

    /**
     * Type-safe setter с валидацией - устанавливает данные компонента
     */
    set(world: World, eid: EntityId, data: Partial<InferComponentData<T>>): void {
      for (const [key, value] of Object.entries(data)) {
        if (key in schema && value !== undefined) {
          const field = schema[key];

          if (validate(value, field, `${name}.${key}`)) {
            raw[key][eid] = value;
          }
        }
      }
    },

    /**
     * Создание компонента с defaults
     * Добавляет компонент к сущности и устанавливает начальные значения
     */
    create(world: World, eid: EntityId, data?: Partial<InferComponentData<T>>): void {
      addComponent(world, raw, eid);

      // Собираем все defaults
      const defaults: any = {};
      for (const [key, field] of Object.entries(schema)) {
        defaults[key] = getDefault(field);
      }

      // Применяем defaults + пользовательские данные
      this.set(world, eid, { ...defaults, ...data });
    },

    /**
     * Проверка наличия компонента у сущности
     */
    has(world: World, eid: EntityId): boolean {
      // Проверяем первое поле - если оно определено, компонент есть
      const firstKey = Object.keys(schema)[0];
      return raw[firstKey]?.[eid] !== undefined;
    },
  };

  return component;
}
```

---

### 2.2 Мигрировать компоненты (2-3 часа)

**Файл:** `src/core/ecs/components/buildings/residential_component.ts`

**Задача:** Заменить старое определение на defineComponent

```typescript
// ❌ УДАЛИТЬ старый код:
export const Residential = {
  capacity: [] as number[],
  occupants: [] as EntityId[][],
  quality: [] as number[],
} as const;

export type ResidentialData = {
  capacity: number;
  occupants: EntityId[];
  quality: number;
};

// ✅ ЗАМЕНИТЬ на:
import { defineComponent } from '../../component_builder';
import { EntityId } from 'bitecs';

export const Residential = defineComponent('Residential', {
  capacity: { type: 'number', default: 10, min: 1, max: 100 },
  occupants: { type: 'entity[]', default: [] },
  quality: { type: 'number', default: 50, min: 0, max: 100 },
});

// Тип автоматически выводится из схемы
export type ResidentialData = ReturnType<typeof Residential.get>;
```

**Аналогично мигрировать компоненты:**

1. **Person** (`src/core/ecs/components/population/person_component.ts`):

```typescript
import { defineComponent } from '../../component_builder';

export const Person = defineComponent('Person', {
  age: { type: 'number', default: 25, min: 0, max: 120 },
  gender: { type: 'number', default: 0 }, // 0 = MALE, 1 = FEMALE
  name: { type: 'string', default: '' },
  education: { type: 'number', default: 0 }, // EducationLevel enum
});

export type PersonData = ReturnType<typeof Person.get>;
```

2. **Citizen** (`src/core/ecs/components/population/citizen_component.ts`):

```typescript
import { defineComponent } from '../../component_builder';

export const Citizen = defineComponent('Citizen', {
  happiness: { type: 'number', default: 70, min: 0, max: 100 },
  home: { type: 'entity', default: 0 },
  workplace: { type: 'entity', default: 0 },
  money: { type: 'number', default: 100, min: 0 },
  energy: { type: 'number', default: 80, min: 0, max: 100 },
  housingType: { type: 'number', default: 0 }, // HousingType enum
  minimumExpenses: { type: 'number', default: 0, min: 0 },
  salary: { type: 'number', default: 0, min: 0 },
  isLookingForJob: { type: 'boolean', default: true },
  jobSearchAttempts: { type: 'number', default: 0, min: 0 },
  lastJobSearchDay: { type: 'number', default: 0, min: 0 },
  lastExpenseDay: { type: 'number', default: 0, min: 0 },
  lastWorkDay: { type: 'number', default: 0, min: 0 },
});

export type CitizenData = ReturnType<typeof Citizen.get>;
```

3. **Position** (`src/core/ecs/components/shared/position_component.ts`):

```typescript
import { defineComponent } from '../../component_builder';

export const Position = defineComponent('Position', {
  x: { type: 'number', default: 0 },
  y: { type: 'number', default: 0 },
});

export type PositionData = ReturnType<typeof Position.get>;
```

4. **Needs** (`src/core/ecs/components/population/needs_component.ts`):

```typescript
import { defineComponent } from '../../component_builder';

export const Needs = defineComponent('Needs', {
  food: { type: 'number', default: 50, min: 0, max: 100 },
  shopping: { type: 'number', default: 30, min: 0, max: 100 },
  work: { type: 'number', default: 20, min: 0, max: 100 },
  sleep: { type: 'number', default: 20, min: 0, max: 100 },
});

export type NeedsData = ReturnType<typeof Needs.get>;
```

5. **Workplace** (`src/core/ecs/components/buildings/workplace_component.ts`):

```typescript
import { defineComponent } from '../../component_builder';
import { EntityId } from 'bitecs';

export const Workplace = defineComponent('Workplace', {
  jobType: { type: 'string', default: '' },
  salary: { type: 'number', default: 100, min: 0 },
  worker: { type: 'entity', default: 0 },
  building: { type: 'entity', default: 0 },
  minEducationLevel: { type: 'number', default: 0, min: 0, max: 4 },
});

export type WorkplaceData = ReturnType<typeof Workplace.get>;
```

**Важно:** После миграции каждого компонента нужно:

1. Удалить старое определение массивов
2. Удалить отдельный экспорт типа (он теперь выводится автоматически)
3. Обновить импорты в файлах, которые используют компонент

---

### 2.3 Удалить ComponentManager (30 минут)

**Файл:** `src/core/ecs/managers/component_manager.ts`

**Задача:** УДАЛИТЬ весь файл - он больше не нужен!

**Причина:** Каждый компонент теперь имеет свои методы `.get()` и `.set()`

**Обновить импорты:** Найти все места, где импортируется ComponentManager и удалить

---

### 2.4 Обновить PersonFactory (1 час)

**Файл:** `src/core/ecs/entities/factories/person_factory.ts`

**Задача:** Упростить фабрику, используя новые методы компонентов

```typescript
import { addEntity } from 'bitecs';
import { World, EntityId } from 'bitecs';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Gender,
  EducationLevel,
  HousingType,
  type PersonData,
  type CitizenData,
  type PositionData,
  SpriteType,
  DEFAULT_SCHEDULES,
} from '../components';

/**
 * Фабрика для создания жителей
 */
export class PersonFactory {
  private nextId = 1;

  constructor(private world: World) {}

  /**
   * Создает жителя с базовыми компонентами
   */
  create(
    personData: PersonData,
    citizenData: CitizenData,
    positionData: PositionData,
    homeId?: EntityId,
  ): EntityId {
    const eid = addEntity(this.world);

    // ✅ НОВЫЙ ПОДХОД - используем .create() с данными
    Person.create(this.world, eid, personData);

    Citizen.create(this.world, eid, {
      ...citizenData,
      home: homeId ?? citizenData.home,
    });

    Needs.create(this.world, eid, {
      food: 50,
      shopping: 30,
      work: 20,
      sleep: 20,
    });

    Position.create(this.world, eid, positionData);

    Schedule.create(this.world, eid, {
      phaseSchedule: DEFAULT_SCHEDULES.citizen,
      entityType: 'citizen',
      currentPhase: 'night',
      currentActivity: '',
      activityExecuted: false,
      nextActivityTime: 0,
      modifiers: [],
    });

    ID.create(this.world, eid, {
      value: this.nextId++,
    });

    Render.create(this.world, eid, {
      visible: 1,
      layer: 3,
      spriteType: SpriteType.PERSON,
      color: personData.gender === Gender.MALE ? '#4A90E2' : '#E94B3C',
    });

    return eid;
  }

  /**
   * Создает случайного жителя
   */
  createRandom(positionData: PositionData, homeId?: EntityId): EntityId {
    const gender = Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE;
    const age = 18 + Math.random() * 60;
    const education = this.generateRandomEducation(age);

    const personData: PersonData = {
      age,
      gender,
      name: this.generateName(gender),
      education,
    };

    const housingType = Math.random() < 0.7 ? HousingType.OWNED : HousingType.RENTED;
    const rentCost = housingType === HousingType.RENTED ? 200 + Math.random() * 300 : 0;
    const foodCost = 150 + Math.random() * 200;
    const minimumExpenses = rentCost + foodCost;

    const citizenData: CitizenData = {
      happiness: 70 + Math.random() * 30,
      home: homeId || 0,
      workplace: 0,
      money: 100 + Math.random() * 900,
      energy: 80 + Math.random() * 20,
      housingType,
      minimumExpenses,
      salary: 0,
      isLookingForJob: true,
      jobSearchAttempts: 0,
      lastJobSearchDay: 0,
      lastExpenseDay: 0,
      lastWorkDay: 0,
    };

    return this.create(personData, citizenData, positionData, homeId);
  }

  // ❌ УДАЛИТЬ все private методы setPersonData, setCitizenData, setNeedsData и т.д.
  // Они больше не нужны!

  // ✅ ОСТАВИТЬ только generateName и generateRandomEducation
  private generateName(gender: Gender): string {
    const maleNames = [
      'Александр',
      'Дмитрий',
      'Иван',
      'Михаил',
      'Сергей',
      'Андрей',
      'Алексей',
      'Николай',
    ];
    const femaleNames = [
      'Анна',
      'Елена',
      'Мария',
      'Ольга',
      'Татьяна',
      'Ирина',
      'Наталья',
      'Светлана',
    ];

    const names = gender === Gender.MALE ? maleNames : femaleNames;
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateRandomEducation(age: number): EducationLevel {
    if (age < 25) {
      const rand = Math.random();
      if (rand < 0.3) return EducationLevel.NONE;
      if (rand < 0.5) return EducationLevel.PRIMARY;
      if (rand < 0.7) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else if (age < 45) {
      const rand = Math.random();
      if (rand < 0.2) return EducationLevel.NONE;
      if (rand < 0.4) return EducationLevel.PRIMARY;
      if (rand < 0.6) return EducationLevel.SECONDARY;
      if (rand < 0.8) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else {
      const rand = Math.random();
      if (rand < 0.4) return EducationLevel.NONE;
      if (rand < 0.6) return EducationLevel.PRIMARY;
      if (rand < 0.8) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    }
  }
}
```

---

### 2.5 Обновить системы (1-2 часа)

**Файл:** `src/core/ecs/systems/clusters/schedule_activity_systems.ts`

**Задача:** Использовать новые методы `.get()` и `.set()` компонентов

```typescript
import { World, EntityId, query } from 'bitecs';
import { System } from '../types';
import { Logger } from '../../../utils/logger';
import {
  Person,
  Citizen,
  Schedule,
  Position,
  Residential,
  Workplace,
  DEFAULT_SCHEDULES,
  DayPhase,
} from '../../components';

const logger = Logger.create('ScheduleSystems');

/**
 * Система работы жителей
 */
export const WorkSystem: System = {
  name: 'Work',
  components: ['Person', 'Citizen', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const timeService = extraData as import('../../../tick/time_service').TimeService | undefined;
    if (!timeService) {
      logger.warn('No TimeService provided');
      return;
    }

    const currentDay = timeService.getDay();
    const minutesOfDay = timeService.getMinutesOfDay();

    const hour = Math.floor(minutesOfDay / 60);
    if (minutesOfDay % 60 === 0) {
      logger.debug(`Day ${currentDay}, Hour ${hour}`);
    }

    // ✅ НОВЫЙ ПОДХОД - используем .get() и .set()
    for (const eid of entities) {
      const citizen = Citizen.get(world, eid);

      if (citizen.workplace && citizen.workplace > 0) {
        if (citizen.lastWorkDay < currentDay) {
          const dailySalary = citizen.salary / 7;

          // ✅ Type-safe set с валидацией
          Citizen.set(world, eid, {
            money: citizen.money + dailySalary,
            lastWorkDay: currentDay,
          });

          const person = Person.get(world, eid);
          logger.info(
            `${person.name} received daily salary! Money: ${(citizen.money + dailySalary).toFixed(0)} (+${dailySalary.toFixed(0)}), Day: ${currentDay}`,
          );
        }
      }
    }
  },
};

/**
 * Система управления расписанием жителей
 */
export const ScheduleManagerSystem: System = {
  name: 'ScheduleManager',
  components: ['Person', 'Citizen', 'Schedule'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    const timeService = extraData as import('../../../tick/time_service').TimeService | undefined;
    if (!timeService) return;

    const minutesOfDay = timeService.getMinutesOfDay();
    const currentPhase = getCurrentDayPhase(minutesOfDay);

    logger.debug(
      `Time ${Math.floor(minutesOfDay / 60)}:${String(minutesOfDay % 60).padStart(2, '0')}, Phase: ${currentPhase}`,
    );

    // ✅ НОВЫЙ ПОДХОД - используем .get() и .set()
    for (const eid of entities) {
      const schedule = Schedule.get(world, eid);
      const scheduleConfig = DEFAULT_SCHEDULES[schedule.entityType as 'citizen'];

      if (
        schedule.currentPhase !== currentPhase &&
        scheduleConfig &&
        scheduleConfig[currentPhase]
      ) {
        const activity = scheduleConfig[currentPhase];

        // ✅ Type-safe set
        Schedule.set(world, eid, {
          currentPhase,
          currentActivity: activity.activity,
          activityExecuted: true,
        });

        executeScheduledActivity(world, eid, activity, currentPhase);

        const person = Person.get(world, eid);
        logger.debug(
          `${person.name} changed phase: ${schedule.currentPhase} → ${currentPhase}, activity: ${activity.activity}`,
        );
      } else if (
        schedule.currentPhase === currentPhase &&
        !schedule.activityExecuted &&
        scheduleConfig &&
        scheduleConfig[currentPhase]
      ) {
        const activity = scheduleConfig[currentPhase];

        Schedule.set(world, eid, {
          currentActivity: activity.activity,
          activityExecuted: true,
        });

        executeScheduledActivity(world, eid, activity, currentPhase);

        const person = Person.get(world, eid);
        logger.debug(
          `${person.name} executing activity for current phase: ${currentPhase}, activity: ${activity.activity}`,
        );
      }
    }
  },
};

/**
 * Определяет текущую фазу дня по времени в минутах
 */
function getCurrentDayPhase(minutesOfDay: number): DayPhase {
  const hour = minutesOfDay / 60;

  if (hour >= 22 || hour < 6) return 'night';
  if (hour >= 18) return 'evening';
  if (hour >= 12) return 'day';
  if (hour >= 6) return 'morning';
  return 'dawn';
}

/**
 * Выполняет запланированную активность для жителя
 */
function executeScheduledActivity(
  world: World,
  eid: EntityId,
  activity: { activity: string; system?: string },
  phase: DayPhase,
): void {
  const systemName = activity.system;
  const person = Person.get(world, eid);

  logger.debug(`${person.name} started ${activity.activity} (${phase})`);

  updateCitizenPosition(world, eid, activity.activity);

  switch (systemName) {
    case 'WorkSystem':
      logger.info(`${person.name} started working!`);
      break;

    case 'MovementSystem':
      logger.info(`${person.name} moved home!`);
      break;

    default:
      logger.debug(`${person.name} - activity: ${activity.activity}`);
  }
}

/**
 * Система перемещения жителей
 */
export const MovementSystem: System = {
  name: 'Movement',
  components: ['Person', 'Citizen', 'Schedule', 'Position'],

  update(world: World, entities: readonly EntityId[], delta?: number, extraData?: unknown) {
    for (const eid of entities) {
      const schedule = Schedule.get(world, eid);
      if (schedule.currentActivity) {
        updateCitizenPosition(world, eid, schedule.currentActivity);
      }
    }
  },
};

/**
 * Обновляет позицию жителя в зависимости от его активности
 */
function updateCitizenPosition(world: World, eid: EntityId, activity: string): void {
  const citizen = Citizen.get(world, eid);
  const person = Person.get(world, eid);

  switch (activity) {
    case 'work':
      if (citizen.workplace) {
        try {
          const workplaceEntities = query(world, [Workplace._raw, Position._raw]);
          const workEntity = Array.from(workplaceEntities).find(
            (entityId: number) => entityId === citizen.workplace,
          );

          if (workEntity !== undefined) {
            const workPos = Position.get(world, workEntity);

            // ✅ Type-safe set
            Position.set(world, eid, {
              x: workPos.x,
              y: workPos.y,
            });

            logger.debug(`${person.name} moved to work at (${workPos.x}, ${workPos.y})`);
          }
        } catch (error) {
          logger.warn(`Could not find workplace position for ${person.name}`);
        }
      }
      break;

    case 'idle':
    default:
      if (citizen.home) {
        try {
          const residentialEntities = query(world, [Residential._raw, Position._raw]);
          const homeEntity = Array.from(residentialEntities).find(
            (entityId: number) => entityId === citizen.home,
          );

          if (homeEntity !== undefined) {
            const homePos = Position.get(world, homeEntity);

            // ✅ Type-safe set
            Position.set(world, eid, {
              x: homePos.x,
              y: homePos.y,
            });

            logger.debug(`${person.name} moved home to (${homePos.x}, ${homePos.y})`);
          }
        } catch (error) {
          logger.warn(`Could not find home position for ${person.name}`);
        }
      }
      break;
  }
}
```

---

## 🧪 ФАЗА 3: ТИПОБЕЗОПАСНЫЙ EVENTBUS (День 2, 2-3 часа)

### 3.1 Создать типобезопасный EventBus

**Файл:** `src/core/event_bus/event_bus.ts`

**Задача:** Добавить строгую типизацию событий

```typescript
import { EventHandler, HandlerInfo, Subscription } from './types';
import { Events } from './events';
import type { LogicTickData, SetSpeedPayload } from '../tick/types';
import type { CallSystemPayload } from './types';
import type { TimeUpdateData } from '../tick/types';

/**
 * Мапа типов событий - определяет точные типы payload для каждого события
 */
export type EventPayloadMap = {
  [Events.LogicTick]: LogicTickData;
  [Events.TimeUpdate]: TimeUpdateData;
  [Events.GamePauseToggle]: void;
  [Events.SetGameSpeed]: SetSpeedPayload;
  [Events.CallSystem]: CallSystemPayload;
  [Events.SceneReady]: void;
  [Events.TickStarted]: { time: number; delta: number };
  // Добавьте остальные события здесь
};

/**
 * Типобезопасная шина событий
 */
export class EventBus {
  private handlers: Map<Events, Set<HandlerInfo>> = new Map();

  /**
   * Публикация события в шине
   * Типы payload проверяются на этапе компиляции
   */
  public emit<E extends Events>(
    eventType: E,
    ...args: EventPayloadMap[E] extends void ? [] : [EventPayloadMap[E]]
  ): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const [payload] = args;
    const readyHandlers = Array.from(handlers);

    readyHandlers.forEach((handler: HandlerInfo) => {
      try {
        handler.handler(payload);
      } catch (error) {
        console.error(`Ошибка при публикации события "${eventType}":`, error);
      }

      if (handler.once) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    });
  }

  /**
   * Подписка на событие шины
   * Тип handler автоматически выводится из типа события
   */
  public on<E extends Events>(
    eventType: E,
    handler: EventPayloadMap[E] extends void ? () => void : (payload: EventPayloadMap[E]) => void,
  ): Subscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: false,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    return {
      unsubscribe: (): void => {
        this.off(eventType, handler as EventHandler);
      },
    };
  }

  /**
   * Одноразовая подписка на событие шины
   */
  public once<E extends Events>(
    eventType: E,
    handler: EventPayloadMap[E] extends void ? () => void : (payload: EventPayloadMap[E]) => void,
  ): Subscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlerInfo: HandlerInfo = {
      handler: handler as EventHandler,
      once: true,
    };

    this.handlers.get(eventType)!.add(handlerInfo);

    return {
      unsubscribe: (): void => {
        this.off(eventType, handler as EventHandler);
      },
    };
  }

  /**
   * Отписка от события шины
   */
  public off<E extends Events>(eventType: E, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    for (const handlerInfo of eventHandlers) {
      if (handlerInfo.handler === handler) {
        eventHandlers.delete(handlerInfo);
        return;
      }
    }

    if (eventHandlers.size === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Очистка событий
   */
  clearEvents(eventType?: Events): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}
```

**Теперь использование типобезопасно:**

```typescript
// ✅ Правильно - автокомплит работает!
eventBus.on(Events.LogicTick, (data) => {
  console.log(data.delta); // TypeScript знает структуру!
  console.log(data.ticksExecuted);
});

// ❌ Ошибка компиляции - LogicTick требует payload
eventBus.emit(Events.LogicTick); // Error!

// ✅ Правильно
eventBus.emit(Events.LogicTick, { delta: 16, ticksExecuted: 1 });

// ✅ Правильно - GamePauseToggle не требует payload
eventBus.emit(Events.GamePauseToggle);

// ❌ Ошибка компиляции - GamePauseToggle не принимает payload
eventBus.emit(Events.GamePauseToggle, {}); // Error!
```

---

## 📝 ФАЗА 4: ТЕСТЫ (День 3, 4-6 часов)

### 4.1 Настроить Vitest для ECS

**Создать файл:** `vitest.config.ts` (если еще нет)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/**/*.ts'],
      exclude: [
        'src/core/**/*.test.ts',
        'src/core/**/*.spec.ts',
        'src/core/**/types.ts',
        'src/core/**/index.ts',
      ],
    },
  },
});
```

**Создать файл:** `src/test/setup.ts`

```typescript
import { afterEach } from 'vitest';

// Cleanup после каждого теста
afterEach(() => {
  // Очистка DOM
  document.body.innerHTML = '';
});
```

---

### 4.2 Тесты для EventBus

**Создать файл:** `src/core/event_bus/event_bus.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from './event_bus';
import { Events } from './events';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('emit and on', () => {
    it('should emit event with payload', () => {
      const handler = vi.fn();

      eventBus.on(Events.LogicTick, handler);
      eventBus.emit(Events.LogicTick, { delta: 16, ticksExecuted: 1 });

      expect(handler).toHaveBeenCalledWith({ delta: 16, ticksExecuted: 1 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit event without payload', () => {
      const handler = vi.fn();

      eventBus.on(Events.GamePauseToggle, handler);
      eventBus.emit(Events.GamePauseToggle);

      expect(handler).toHaveBeenCalledWith(undefined);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GamePauseToggle, handler1);
      eventBus.on(Events.GamePauseToggle, handler2);
      eventBus.emit(Events.GamePauseToggle);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not throw error if no handlers', () => {
      expect(() => {
        eventBus.emit(Events.GamePauseToggle);
      }).not.toThrow();
    });
  });

  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn();

      eventBus.once(Events.GamePauseToggle, handler);
      eventBus.emit(Events.GamePauseToggle);
      eventBus.emit(Events.GamePauseToggle);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('should unsubscribe handler', () => {
      const handler = vi.fn();

      eventBus.on(Events.GamePauseToggle, handler);
      eventBus.off(Events.GamePauseToggle, handler);
      eventBus.emit(Events.GamePauseToggle);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe via subscription', () => {
      const handler = vi.fn();

      const subscription = eventBus.on(Events.GamePauseToggle, handler);
      subscription.unsubscribe();
      eventBus.emit(Events.GamePauseToggle);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('clearEvents', () => {
    it('should clear specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GamePauseToggle, handler1);
      eventBus.on(Events.LogicTick, handler2);

      eventBus.clearEvents(Events.GamePauseToggle);

      eventBus.emit(Events.GamePauseToggle);
      eventBus.emit(Events.LogicTick, { delta: 16, ticksExecuted: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should clear all events', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(Events.GamePauseToggle, handler1);
      eventBus.on(Events.LogicTick, handler2);

      eventBus.clearEvents();

      eventBus.emit(Events.GamePauseToggle);
      eventBus.emit(Events.LogicTick, { delta: 16, ticksExecuted: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch handler errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handler = vi.fn(() => {
        throw new Error('Handler error');
      });

      eventBus.on(Events.GamePauseToggle, handler);

      expect(() => {
        eventBus.emit(Events.GamePauseToggle);
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
```

---

### 4.3 Тесты для Component Builder

**Создать файл:** `src/core/ecs/component_builder.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity } from 'bitecs';
import { defineComponent } from './component_builder';
import type { World, EntityId } from 'bitecs';

describe('defineComponent', () => {
  let world: World;
  let eid: EntityId;

  beforeEach(() => {
    world = createWorld();
    eid = addEntity(world);
  });

  describe('create and get', () => {
    it('should create component with defaults', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 42 },
        name: { type: 'string', default: 'test' },
      });

      TestComponent.create(world, eid);
      const data = TestComponent.get(world, eid);

      expect(data.value).toBe(42);
      expect(data.name).toBe('test');
    });

    it('should create component with custom data', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
        name: { type: 'string', default: '' },
      });

      TestComponent.create(world, eid, {
        value: 100,
        name: 'custom',
      });

      const data = TestComponent.get(world, eid);

      expect(data.value).toBe(100);
      expect(data.name).toBe('custom');
    });

    it('should support entity arrays', () => {
      const TestComponent = defineComponent('Test', {
        entities: { type: 'entity[]', default: [] },
      });

      const eid2 = addEntity(world);
      const eid3 = addEntity(world);

      TestComponent.create(world, eid, {
        entities: [eid2, eid3],
      });

      const data = TestComponent.get(world, eid);

      expect(data.entities).toEqual([eid2, eid3]);
    });
  });

  describe('set', () => {
    it('should update component data', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
      });

      TestComponent.create(world, eid, { value: 10 });
      TestComponent.set(world, eid, { value: 20 });

      const data = TestComponent.get(world, eid);

      expect(data.value).toBe(20);
    });

    it('should update partial data', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
        name: { type: 'string', default: '' },
      });

      TestComponent.create(world, eid, { value: 10, name: 'test' });
      TestComponent.set(world, eid, { value: 20 });

      const data = TestComponent.get(world, eid);

      expect(data.value).toBe(20);
      expect(data.name).toBe('test'); // Не изменилось
    });
  });

  describe('validation', () => {
    it('should validate min/max for numbers', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 50, min: 0, max: 100 },
      });

      TestComponent.create(world, eid);

      // Попытка установить значение вне диапазона
      TestComponent.set(world, eid, { value: 150 });

      const data = TestComponent.get(world, eid);

      // Значение не должно измениться
      expect(data.value).toBe(50);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should validate type', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
      });

      TestComponent.create(world, eid);
      TestComponent.set(world, eid, { value: 'invalid' as any });

      const data = TestComponent.get(world, eid);

      expect(data.value).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('has', () => {
    it('should return true if component exists', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
      });

      TestComponent.create(world, eid);

      expect(TestComponent.has(world, eid)).toBe(true);
    });

    it('should return false if component does not exist', () => {
      const TestComponent = defineComponent('Test', {
        value: { type: 'number', default: 0 },
      });

      expect(TestComponent.has(world, eid)).toBe(false);
    });
  });
});
```

---

### 4.4 Тесты для Core

**Создать файл:** `src/core/core.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Core } from './core';

// Мокируем Phaser
vi.mock('phaser', () => ({
  default: {
    Game: vi.fn().mockImplementation(() => ({
      events: {
        once: vi.fn((event, cb) => {
          if (event === 'ready') {
            setTimeout(cb, 0);
          }
        }),
      },
      scene: {
        getScene: vi.fn(() => ({
          init: vi.fn(),
          setModuleManager: vi.fn(),
        })),
      },
      scale: {
        resize: vi.fn(),
      },
      destroy: vi.fn(),
    })),
  },
}));

describe('Core', () => {
  let core: Core;

  beforeEach(() => {
    // Очищаем моки
    vi.clearAllMocks();
  });

  afterEach(() => {
    core?.destroy();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      core = new Core({} as any);

      expect(core).toBeDefined();
    });

    it('should add resize listener', () => {
      const spy = vi.spyOn(window, 'addEventListener');

      core = new Core({} as any);

      expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('destroy', () => {
    it('should remove resize listener', () => {
      const spy = vi.spyOn(window, 'removeEventListener');

      core = new Core({} as any);
      core.destroy();

      expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should cleanup all managers', () => {
      core = new Core({} as any);
      core.destroy();

      expect(core.moduleManager).toBeNull();
      expect(core.phaser).toBeNull();
    });
  });

  describe('init', () => {
    it('should initialize all managers', async () => {
      core = new Core({} as any);
      await core.init();

      expect(core.eventBus).toBeDefined();
      expect(core.tickManager).toBeDefined();
      expect(core.ecsManager).toBeDefined();
    });

    it('should handle initialization timeout', async () => {
      // Мокируем Phaser чтобы он никогда не вызывал ready
      vi.mocked(Phaser.Game).mockImplementationOnce(
        () =>
          ({
            events: {
              once: vi.fn(),
            },
          }) as any,
      );

      core = new Core({} as any);

      await expect(core.init()).rejects.toThrow('timeout');
    });
  });
});
```

---

## 📋 ЧЕКЛИСТ ВЫПОЛНЕНИЯ

### Фаза 1: Критичные исправления ✅

- [ ] Добавить cleanup методы в Core
- [ ] Добавить cleanup методы в EntrySimulation
- [ ] Убрать fake async из Core
- [ ] Добавить обработку ошибок в initPhaser
- [ ] Добавить обработку ошибок в initModules
- [ ] Убрать null assertions (!) из Core
- [ ] Убрать null assertions (!) из MainScene
- [ ] Создать Logger
- [ ] Заменить console.log на Logger во всех файлах

### Фаза 2: ECS Рефакторинг ✅

- [ ] Создать component_builder.ts
- [ ] Мигрировать Residential компонент
- [ ] Мигрировать Person компонент
- [ ] Мигрировать Citizen компонент
- [ ] Мигрировать Position компонент
- [ ] Мигрировать Needs компонент
- [ ] Мигрировать Workplace компонент
- [ ] Мигрировать остальные компоненты
- [ ] Удалить ComponentManager
- [ ] Обновить PersonFactory
- [ ] Обновить WorkSystem
- [ ] Обновить ScheduleManagerSystem
- [ ] Обновить MovementSystem

### Фаза 3: Типобезопасный EventBus ✅

- [ ] Добавить EventPayloadMap
- [ ] Обновить методы emit/on/once
- [ ] Проверить все вызовы eventBus в проекте

### Фаза 4: Тесты ✅

- [ ] Настроить vitest.config.ts
- [ ] Создать setup.ts
- [ ] Написать тесты для EventBus
- [ ] Написать тесты для Component Builder
- [ ] Написать тесты для Core
- [ ] Запустить все тесты
- [ ] Проверить coverage

---

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После выполнения всего плана:

**Метрики:**

- DX Score: 6.5/10 → 8.5/10
- Тестируемость: 4.5/10 → 8.0/10
- Test Coverage: 0% → 70%+
- Строк кода на компонент: 150+ → 10-15
- Время на новый компонент: 30 мин → 2 мин

**Улучшения:**

- ✅ Нет утечек памяти
- ✅ Все Promise обрабатывают ошибки
- ✅ Типобезопасный EventBus с автокомплитом
- ✅ Компоненты определяются в 1 месте
- ✅ Системы используют type-safe методы
- ✅ 80% boilerplate удалено
- ✅ Логирование управляемо
- ✅ Тесты покрывают критичный код

---

## 📞 ПОДДЕРЖКА

Если возникнут вопросы или проблемы при выполнении плана:

1. Проверьте, что TypeScript версии 5.9.3+
2. Проверьте, что BitECS версии 0.4.0
3. Проверьте, что все импорты обновлены
4. Запустите `npm run type-check` для проверки типов
5. Запустите `npm run test` для проверки тестов

Удачи! 🚀
