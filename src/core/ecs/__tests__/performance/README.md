# ECS Performance Tests

Этот каталог содержит компоненты, фабрики, системы и кластеры, специально созданные для тестирования производительности ECS.

## Структура

```
performance/
├── components/          # Компоненты для тестирования
│   ├── performance_components.ts
│   └── index.ts
├── entities/            # Фабрики сущностей
│   ├── performance_factories.ts
│   └── index.ts
├── systems/             # Системы производительности
│   ├── performance_systems.ts
│   └── index.ts
├── clusters/            # Кластеры систем
│   ├── performance_clusters.ts
│   └── index.ts
└── README.md           # Эта документация
```

## Компоненты

- **PerformanceCitizen** - компонент жителя с финансами, здоровьем, позицией
- **PerformanceBuilding** - компонент здания с доходами и вместимостью
- **PerformanceVehicle** - компонент транспорта с движением и состоянием
- **SimplePerformance** - минимальный компонент для максимальной производительности

## Фабрики

- `createPerformanceCitizen()` - создает жителя
- `createPerformanceBuilding()` - создает здание
- `createPerformanceVehicle()` - создает транспорт
- `createSimplePerformanceEntity()` - создает простую сущность

## Системы

- `PerformanceCitizenUpdateSystem` - обновляет жителей (расходы/доходы)
- `PerformanceBuildingUpdateSystem` - обновляет здания (доходы/расходы)
- `SimplePerformanceSystem` - простая система для бенчмарков
- `BulkPerformanceSystem` - система для массового обновления

## Кластеры

- `performance_simulation` - кластер для реалистичной симуляции
- `performance_benchmark` - кластер для чистых бенчмарков
- `performance_stress_test` - кластер для экстремальных нагрузок

## Запуск тестов

```bash
# Запуск всех тестов производительности
npm test -- src/core/ecs/performance.test.ts

# Запуск с coverage
npm run test:coverage -- src/core/ecs/performance.test.ts
```

## Метрики производительности

Тесты измеряют:
- Время создания сущностей через фабрики
- FPS обновления систем
- Потребление памяти
- Стабильность при больших нагрузках

## Результаты

- Создание 1000 сущностей: < 200ms
- Создание 10000 сущностей: < 1000ms
- 100 обновлений 10000 сущностей: < 2000ms
- Стабильная работа при 50000+ сущностях
