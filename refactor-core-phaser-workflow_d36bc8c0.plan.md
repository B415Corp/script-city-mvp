---
name: refactor-core-phaser-workflow
overview: Упростить вход, сделать ядро управляющим слоем, стандартизировать модули/ECS/UI, без CLI и без добавления новых фич (пример с домом — только описательный).
todos:
  - id: phaser-entry
    content: Разнести main и phaser config/app слой
    status: in_progress
  - id: base-module
    content: Ввести BaseModule с ecsSystems и мигрировать модули
    status: pending
  - id: click-build-flow
    content: Документировать поток клик→команда (примерно, без фич)
    status: pending
  - id: ui-guidelines
    content: Зафиксировать правила UI и пример панели
    status: pending
  - id: docs-update
    content: Обновить архитектуру и how-to с примерами
    status: pending
  - id: quality-checks
    content: Линт/типизация и smoke-проверка
    status: pending
---

# План упрощения входа и стандартизации (без CLI, без новой фичи)

## 1) Точки входа и сцены (ядро управляет)

- Вынести Phaser-конфиг в `src/infrastructure/phaser/phaser_config.ts`; `src/main.ts` оставить только с запуском `bootstrapGame()`.
- Добавить слой `src/app/game_app.ts`: создаёт `GameCore`, ведёт реестр сцен, фабрику инициализации; сцены получают ядро через init data. Ядро управляет старт/стоп сцен через сервис/обёртку.
- Завести реестр сцен (enum + конфиги) и `SceneController` для переключения и передачи зависимостей (core, moduleManager, ui hooks).

## 2) Модульная модель и ECS

- Ввести абстрактный `BaseModule` с обязательными полями: `id: string`, `dependencies: string[] = []`, `ecsSystems: ISystem[] = []`, методы `initialize(core)`, `attachToScene(scene)`, `destroy()`, `registerSystems(ecs)` подключает `ecsSystems`. Это явно фиксирует, что регистрация ECS живёт в модуле.
- Мигрировать модули (`grid`, `tools`, `zoning_tools`, `debug`) к `BaseModule`; заполнить `ecsSystems` (или оставить пустым), убедиться, что `registerSystems` вызывается через `ModuleManager`.
- Зафиксировать правило код-стайла: добавление систем — через `ecsSystems` модуля; прямые вызовы `ecs.registerSystem` вне модулей не допускаются.

## 3) Поток “клик по тайлу → команда” (пример, без реализации новой фичи)

- Уточнить, что `GridModule` эмитит `Events.TileClicked` и это вход для действий модулей.
- В гайд добавить пример: модуль слушает `TileClicked`, проверяет активный инструмент, кладёт команду в `CommandProcessor` (например, `BuildBuilding`), далее свои системы/хэндлеры реагируют через события. Пример остаётся документационным, без добавления новых сущностей/фич в код.
- Отдельно описать, что визуализация/рендер должны быть отдельной системой/подписчиком (разделение состояния и рендера).

## 4) UI-слой

- Правило: UI рядом с модулем (`modules/<feature>/ui/...`), наследуется от `UIComponent`, создаёт контейнер с depth. Подключение — в `attachToScene`.
- Добавить пример мини-панели (инструмент/зум), показывающий перехват событий, работу с `ToolManager`, depth и то, что карта не ловит события под UI.

## 5) Документация

- Обновить `docs/development/architecture/index.md` (или ближайший) схемой слоёв: main → phaser config → app (ядро управляет сценами) → core (event bus, module manager, command processor, tick manager, save) → modules (initialize/registerSystems/attachToScene) → ECS/события → UI.
- Добавить гайд “Как добавить модуль + UI + ECS”: шаги по `BaseModule`, `ecsSystems`, подпискам, UI в `attachToScene`, регистрации модуля.
- Добавить рецепт “Клик по тайлу → команда → обработка” как образец взаимодействия, без внедрения новых сущностей.

## 6) Проверки

- Прогнать линт/типизацию после миграции модулей к `BaseModule`.
- Smoke: игра стартует, сцены переключаются через ядро, событие `TileClicked` доходит до слушателей, UI не блокирует карту вне панелей.