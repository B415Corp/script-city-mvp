# Событийная модель (Event Bus)

**Теги**: `arch:events`, `arch:core`, `arch:module`

Event Bus позволяет модулям и слоям обмениваться информацией без жёстких связей.

## Типы событий

- **Игровые**:
  - `ConstructionStarted`, `ConstructionCompleted`;
  - `TrafficJamStarted`, `TrafficJamResolved`;
  - `PolicyApplied`, `PolicyRevoked`.
- **Системные**:
  - `TickStarted`, `TickEnded`;
  - смена игрового режима (пауза, нормальная скорость, ускорение).
- **UI-команды** (как отдельный поток или тип событий):
  - `BuildCommandRequested`;
  - `DemolishCommandRequested`;
  - `ChangeTaxRequested`.

## Использование

- системы внутри модулей:
  - публикуют события о своих изменениях;
  - подписываются только на те события, которые им нужны;
- UI:
  - публикует команды;
  - подписывается на агрегированные события (для обновления панелей).

---

[← Назад к индексу](./index.md)

