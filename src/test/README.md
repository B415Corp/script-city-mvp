# Тестирование Script City MVP

## Обзор

Проект использует **Vitest** для тестирования ECS системы на базе **bitECS 0.4.0**.

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов в watch режиме
npm run test

# Запуск тестов один раз
npm run test:run

# Запуск с покрытием
npm run test:coverage
```

## Структура тестирования

### Инфраструктура

- **`setup.ts`** - очистка глобальных массивов компонентов между тестами
- **`helpers/bitECS-test-helper.ts`** - утилиты для создания тестовых миров и сущностей
- **`vitest.config.ts`** - конфигурация Vitest

### Тесты

```
src/test/
├── ecs/
│   ├── entities/
│   │   └── person-factory.test.ts    # Тесты фабрики жителей
│   └── systems/
│       ├── population-system.test.ts # Тесты системы населения
│       └── needs-system.test.ts      # Тесты системы потребностей
```

## Особенности тестирования bitECS 0.4.0

### Глобальное состояние компонентов

Компоненты в bitECS - это глобальные массивы:

```typescript
export const Person = {
  age: [] as number[], // Глобальный массив!
  name: [] as string[], // Глобальный массив!
} as const;
```

**Проблема:** Изменения в одном тесте влияют на другие.

**Решение:** Очистка массивов в `setup.ts` перед каждым тестом.

### BitECSTestHelper

Упрощает создание тестовых сценариев:

```typescript
// Создание изолированного мира
const { world, entities } = BitECSTestHelper.createTestSetup(3);

// Создание жителя с компонентами
const eid = BitECSTestHelper.createCitizenEntity(world);

// Установка данных
BitECSTestHelper.setPersonData(eid, { age: 25, name: 'John' });
BitECSTestHelper.setNeedsData(eid, { food: 50, sleep: 30 });
```

## Написание новых тестов

### Шаблон теста системы

```typescript
describe('MySystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(2));
  });

  it('should do something', () => {
    const eid = entities[0];
    BitECSTestHelper.createCitizenEntity(world);
    BitECSTestHelper.setPersonData(eid, { age: 25 });

    // Действие
    MySystem.update(world, [eid], 10);

    // Проверка
    expect(Person.age[eid]).toBe(/* expected */);
  });
});
```

### Шаблон теста фабрики

```typescript
describe('MyFactory', () => {
  let world: World;
  let factory: MyFactory;

  beforeEach(() => {
    world = BitECSTestHelper.createTestSetup().world;
    factory = new MyFactory(world);
  });

  it('should create entity with correct data', () => {
    const eid = factory.create(testData);

    expect(MyComponent.field[eid]).toBe(testData.expectedValue);
  });
});
```

## Лучшие практики

### 1. Изоляция

- Каждый тест использует свежий мир: `createTestSetup()`
- Компоненты очищаются автоматически в `setup.ts`

### 2. Детерминированность

- Избегайте случайности в тестах (кроме специальных случаев)
- Используйте фиксированные значения вместо `Math.random()`

### 3. Читабельность

- Давайте тестам понятные названия
- Группируйте связанные тесты в `describe` блоки
- Используйте вспомогательные функции для сложных setup

### 4. Полное покрытие

- Тестируйте happy path
- Тестируйте edge cases (пустые массивы, граничные значения)
- Тестируйте error conditions

## Добавление новых тестов

1. Создайте файл `*.test.ts` в соответствующей папке
2. Следуйте шаблонам выше
3. Добавьте необходимые импорты компонентов
4. Запустите `npm test` для проверки

## Отладка

При проблемах с тестами:

1. Проверьте очистку компонентов в `setup.ts`
2. Убедитесь, что тесты не зависят от порядка выполнения
3. Используйте `console.log` для отладки (выводится в stdout)
4. Проверьте типизацию - TypeScript поможет найти ошибки
