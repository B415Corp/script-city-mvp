# Команды и события

**Теги**: `arch:commands`, `arch:events`, `arch:core`

## Команды (Commands)

**Теги**: `arch:commands`, `arch:ui`

Команда — намерение изменить мир. Примеры:

- `BuildBuilding { position, buildingType }`
- `BulldozeArea { area }`
- `ChangeTaxRate { taxType, newRate }`
- `SetPolicy { policyId, enabled }`
- `SetSimulationSpeed { speedLevel }`

Команды:

- формируются UI;
- проверяются и применяются ядром;
- **одинаковы** для локальной и серверной симуляции.

## События (Events)

**Теги**: `arch:events`, `arch:module`

Событие — факт, который уже произошёл. Примеры:

- `ConstructionStarted`, `ConstructionCompleted`
- `TrafficJamStarted`, `TrafficJamResolved`
- `BudgetUpdated`, `PopulationChanged`

События:

- публикуются системами;
- используются другими модулями и UI для реакции;
- служат основой для логов, аналитики, анимаций.

---

[← Назад к индексу](./index.md)

