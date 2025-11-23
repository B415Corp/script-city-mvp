# Краткая инструкция: работа с ядром и модулями

**Теги**: `arch:core`, `arch:module`, `arch:guide`

## Зачем нужны модули?

Модули — это изолированные функциональные единицы игры, которые:

- **Разделяют ответственность**: каждая подсистема (экономика, транспорт, население) живёт в своём модуле
- **Упрощают разработку**: можно работать над одним модулем, не затрагивая другие
- **Обеспечивают порядок инициализации**: модули с зависимостями инициализируются автоматически в правильном порядке
- **Изолируют код**: модули общаются через события, а не напрямую

## Как подключить модуль?

### 1. Создайте модуль

Модуль должен реализовать интерфейс `IModule`:

```typescript
import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';

export class MyModule implements IModule {
  id = 'my_module';

  // Опционально: список зависимостей
  dependencies = ['other_module_id'];

  async initialize(core: GameCore): Promise<void> {
    // Получаем доступ к менеджерам
    const eventBus = core.getEventBus();
    const ecs = core.getECSManager();

    // Подписываемся на события
    eventBus.on('SomeEvent', (data) => {
      // Обработка события
    });

    // Инициализация данных модуля
    // ...
  }

  destroy(): void {
    // Очистка ресурсов
  }

  // Опционально: регистрация систем ECS
  registerSystems(ecs: ECSManager): void {
    // Регистрация систем модуля
    // ecs.registerSystem(new MySystem(), { priority: 100 });
  }
}
```

### 2. Зарегистрируйте модуль

Модули регистрируются **до** вызова `core.start()`:

```typescript
import { GameCore } from '@/core/game_core/game_core';
import { MyModule } from '@/modules/my_module/my_module';

// Создаём ядро
const core = new GameCore();
await core.initialize({
  tickRate: 20,
  maxCatchUpTicks: 5,
  enableDebug: true,
});

// Регистрируем модули
const moduleManager = core.getModuleManager();
moduleManager.registerModule(new MyModule());

// Можно указать зависимости при регистрации
// moduleManager.registerModule(new MyModule(), ['dependency_id']);

// Запускаем ядро (модули инициализируются автоматически)
await core.start();
```

### 3. Порядок инициализации

Модули инициализируются автоматически в правильном порядке:

- Если модуль A зависит от модуля B, то B инициализируется первым
- Зависимости можно указать в свойстве `dependencies` модуля или при регистрации
- При обнаружении циклических зависимостей будет выброшена ошибка

## Пример: модуль экономики

```typescript
import { IModule } from '@/core/module_manager/types';
import { GameCore } from '@/core/game_core/game_core';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';

export class EconomyModule implements IModule {
  id = 'economy';

  // Экономика зависит от модуля зданий
  dependencies = ['buildings'];

  private budget = 0;
  private eventBus: EventBus | null = null;

  async initialize(core: GameCore): Promise<void> {
    this.eventBus = core.getEventBus();

    // Подписываемся на события строительства
    this.eventBus.on('BuildingCompleted', (data) => {
      // Увеличиваем доход при постройке здания
      this.budget += data.income;
    });

    // Инициализация бюджета
    this.budget = 10000;
  }

  destroy(): void {
    // Очистка подписок (если нужно)
    this.eventBus?.off('BuildingCompleted');
  }

  registerSystems(ecs: ECSManager): void {
    // Регистрация системы экономики
    // ecs.registerSystem(new EconomySystem(), {
    //   priority: 50,
    //   frequency: 5 // обновляется раз в 5 тиков
    // });
  }

  // Публичный API модуля
  getBudget(): number {
    return this.budget;
  }
}
```

## Доступ к ядру из модуля

В методе `initialize()` модуль получает доступ к ядру и может использовать:

- **`core.getEventBus()`** — для подписки на события и их публикации
- **`core.getECSManager()`** — для работы с сущностями, компонентами и системами
- **`core.getModuleManager()`** — для получения других модулей
- **`core.getCommandProcessor()`** — для обработки команд
- **`core.getTickManager()`** — для управления временем (редко нужно)

## Жизненный цикл

1. **Создание ядра**: `new GameCore()`
2. **Инициализация**: `await core.initialize(config)` — создаются менеджеры
3. **Регистрация модулей**: `moduleManager.registerModule(...)` — модули регистрируются
4. **Запуск**: `await core.start()` — модули инициализируются, запускаются тики
5. **Работа**: модули работают, системы обновляются каждый тик
6. **Остановка**: `core.stop()` — тики останавливаются
7. **Очистка**: `core.destroy()` — всё очищается, вызывается `destroy()` у модулей

## Важные моменты

- ✅ Модули регистрируются **до** `core.start()`
- ✅ Модули общаются через **EventBus**, а не напрямую
- ✅ Зависимости указываются через `dependencies` или при регистрации
- ✅ Системы регистрируются в `registerSystems()`, а не в `initialize()`
- ✅ Модули должны освобождать ресурсы в `destroy()`

## См. также

- [Игровое ядро (Core)](./core.md) — подробное описание ядра
- [Модули симуляции](./modules.md) — описание модульной архитектуры
- [Как устроено игровое ядро](./core-example.md) — примеры взаимодействия
- [Событийная модель](./events.md) — работа с EventBus
- [Ядро Script City простыми словами](../guides/core-for-developers.md) — популярное объяснение для разработчиков
