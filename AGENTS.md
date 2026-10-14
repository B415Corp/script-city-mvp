# AGENTS.md — рабочее окружение для агентов

Этот файл — контракт между проектом и любым AI-агентом (OpenCode, Cursor, Copilot и т.п.),
который работает с репозиторием. Прочитай его полностью **до** внесения правок.

Связанные документы:

- [docs/development/code-style.md](docs/development/code-style.md) — как писать код
- [docs/development/workflow.md](docs/development/workflow.md) — как вести разработку
- [docs/ecs-workflow.md](docs/ecs-workflow.md) — как писать компоненты/системы/фабрики
- [design.md](design.md) — ТЗ для дизайнера (визуал, ассеты, освещение)
- [CHANGELOG.md](CHANGELOG.md) — история изменений

---

## 1. Что это за проект

**Script City** — изометрический градостроительный симулятор (браузер, 2D).
Игрок зонирует землю, город растёт, экономика/транспорт/население считаются агрегированными
правилами, игровое время влияет на поведение.

Текущая стадия: **прототип движка**. Инфраструктура (ядро, ECS, тики, карта, зонирование)
работает; игрового контента и рендера сущностей ещё нет.

## 2. Стек

| Что | Чем |
|---|---|
| Язык | TypeScript 5.9, `strict: true` |
| Рендер | Phaser 3.90 (WebGL), изометрия 128×64 |
| ECS | bitecs 0.4 (SoA, TypedArray) |
| UI | гибрид: Phaser-UI (`src/ui/phaser`) + DOM (`src/ui/html`) |
| Сборка | Vite 7, dev-сервер на `:3000` |
| Тесты | Vitest 4, окружение `jsdom` |
| Линт/формат | ESLint 9 (flat config) + Prettier 3 |

**Другие зависимости добавлять нельзя** без явного согласования с владельцем репозитория.

## 3. Команды

```bash
npm install          # установка зависимостей
npm run dev          # dev-сервер (http://localhost:3000, открывает браузер)
npm run test:run     # тесты один раз (для CI / проверки перед коммитом)
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run lint:fix     # ESLint + автофикс
npm run format       # Prettier по src/**
npm run build        # lint --fix && tsc && vitest run && vite build
```

`npm run build` — это **шлюз качества**: он падает и на ошибках линтера, и на ошибках типов,
и на упавших тестах. Коммит считается допустимым только если `npm run build` проходит.

> ⚠️ **Сейчас `npm run build` падает** — см. раздел «Известные проблемы». Не пытайся «починить»
> это молча: либо почини в рамках задачи, либо явно сообщи о статусе.

## 4. Структура `src/`

```
src/
├── main.ts                     точка входа: создаёт Core, вешает window.sim для отладки
├── core/
│   ├── core.ts                 ядро: Phaser + EventBus + TickManager + ECSManager + ModuleManager
│   ├── internal/               разбивка ядра: core_lifecycle, core_initialization, core_builder
│   ├── event_bus/              EventBus, Events (enum всех событий), типы payload'ов
│   ├── tick/                   TickManager (фикс. шаг), TimeService (календарь), контроллеры
│   ├── ecs/                    ECS: реестры, smart-конструкторы, ScheduleManager, компоненты/системы/фабрики
│   ├── modules/
│   │   ├── extends/            BaseModule / CustomModule — базовые классы модулей
│   │   ├── base_modules/       MapModule, ToolsModule, ToolbarModule, DebugModule, SimulationModule
│   │   └── custom_modules/     пользовательские модули
│   ├── scenes/                 MainScene
│   └── utils/                  Logger
├── ui/
│   ├── html/                   DOM-интерфейс
│   └── phaser/                 Phaser-интерфейс
└── assets/                     тайлы, стили
```

Правило: новый функциональный модуль игры — это **директория в `base_modules/`**, класс,
наследующий `BaseModule`, зарегистрированный в `baseModuleRegistry` (`module_manager.ts`).

## 5. Архитектурные инварианты

Это не договорённости, а то, что реально держит проект. Нарушение ломает архитектуру:

1. **Фиксированный шаг логики.** Логика живёт на тиках `TickManager` (`GameSpeeds`:
   PAUSED/NORMAL/FAST/VERY_FAST). Никогда не пиши игровую логику в `update()` Phaser-сцены —
   только в ECS-системах, которые вызывает `ScheduleManager` по событию `LogicTick`.
2. **Логика не знает про Phaser.** Модули и системы не импортируют Phaser ради геймплея.
   Если системе нужно что-то отрисовать — она-emit'ит событие, рендер подписан.
3. **Общение только через `EventBus`.** Все события объявлены в `src/core/event_bus/events.ts`
   (enum `Events`). Payload типизирован в `event_bus/types.ts`. Не передавай между модулями
   прямые ссылки на их внутренние объекты.
4. **Состояние игры — в ECS.** Компоненты — TypedArray-массивы, созданные конструкторами
   (`createComponent` / `createSimpleComponent`). Не хранить игровые данные в полях модулей
   и не использовать для компонентов plain-объекты `{x: 0, y: 0}`.
5. **Рендер читает состояние, а не владеет им.** Системы меняют данные, рендер их отображает.
6. **Ядро собирается через DI.** Зависимости ядра передаются фабриками
   (`ICoreDependencies`) — не создавай глобальные синглоны вне реестров ECS.

## 6. Что агенту нельзя делать

- ❌ `console.log/warn/error` в коде `src/` — только `Logger.create('<Name>')`.
  `console` в коде допустим только в тестах и в UI-ките, если это осознанно.
- ❌ `any` — это `error` в ESLint. Типизируй через `unknown` + narrowing или generic.
- ❌ Создавать ветки кроме `dev_new` и коммитить в `main`.
- ❌ Тянуть в рантайм тестовый/бенчмарк-код (`src/core/ecs/test`, `__tests__/performance`).
- ❌ Хардкодить игровое время константами вида `2000` — используй `TimeService`
  и метаданные систем (`interval`, `cluster`).
- ❌ Оставлять в коде `TODO`, «Phase 0», «Временно null», закомментированный код.
- ❌ Плодить дублирующиеся файлы тестов (`quick_perf_test`, `working_perf_test`,
  `performance-minimal`, `test-single-performance` — уже есть 4 почти одинаковых).
- ❌ Менять публичные события/типы без обновления всех подписчиков и тестов.
- ❌ Добавлять `npm`-зависимости без согласования.
- ❌ Править `.prettierrc`/`tsconfig`/`eslint.config.js` под свой вкус в рамках задачи.

## 7. Известные проблемы (не путай их со своей ошибкой)

| Проблема | Где |
|---|---|
| Per-tick системы **без кластера не выполняются**: `ScheduleManager.update()` зовёт `updateClusters()` и интервальные системы, но массив `this.systems` не обходит | `core/ecs/ecs_manager.ts` |
| Event-driven системы всегда получают `delta = 0` и **не видят payload** события | `handleEventSystem` / `handleCallSystem` |
| Реестры компонентов/систем — глобальные синглтоны, авторегистрация происходит на импорте; `main.ts` импортирует `src/core/ecs/test`, т.е. бенчмарки попадают в рантайм | `core/ecs/registry/*`, `main.ts` |
| `ECSManager.getStats()` возвращает `totalEntities: 0` — дебаг-панель врёт | `ecs_manager.ts` |
| `ECSManager.destroy()` не снимает подписки EventBus и не чистит реестры — утечка | `ecs_manager.ts` |
| `Logger.info` на каждую регистрацию — шум в консоли на старте | `ecs_manager.ts` |
| 24 файла (включая `package-lock.json`) сохранены с **CRLF**, хотя `.editorconfig` и Prettier требуют LF → грязные diff между Windows и Linux | исправлено через `.gitattributes` (`* text=auto eol=lf`) |

## 8. Определение готовности (Definition of Done)

Задача выполнена, только если:

1. `npm run type-check` — без новых ошибок (идеально — чисто).
2. `npm run lint` — нет новых warnings и ошибок.
3. `npm run test:run` — все тесты проходят; для новой логики **добавлены** тесты.
4. `npm run build` проходит (или падение зафиксировано и объяснено в отчёте).
5. Изменения описаны в `CHANGELOG.md` под `[Unreleased]`.
6. Нет новых `TODO`/закомментированного кода/дублей.

## 9. Порядок работы агента

1. Прочитай `AGENTS.md` и `docs/development/code-style.md`.
2. Воспроизведи проблему (тест или ручная проверка в dev-сервере) **до** правки.
3. Сделай минимальный.change по сути задачи, не попутно.
4. Прогони команды из раздела 3.
5. Обнови `CHANGELOG.md` и при необходимости документацию.
6. В отчёте явно перечисли: что сделано, что проверено (с выводом команд), что осталось сломанным.

## 10. Конвенции Git

**`dev_new` — единственная рабочая ветка проекта.** Всё коммитится напрямую в неё.

- Никаких `feature/*`, `fix/*`, `hotfix/*` и веток на разработчика.
- Никаких pull request'ов и merge'ей для обычной работы: коммит → тесты → коммит.
- `main` — только релизная, обновляется тегами; в повседневной работе не используется.
- Исторические ветки (`dev`, `refa`, `ecs_manager`, `ui_kit` и прочие) в `origin` уже удалены,
  в `dev_new` их содержимое влито. Не создавай новых.

Правило одного коммита: одна логическая задача — один коммит в `dev_new`.

Коммиты — Conventional Commits (история проекта уже такая):

```
feat(ecs): добавить систему роста населения
fix(ui): исправить переполнение панели инструментов
refactor(core): вынести фабрики из конструктора Core
docs(workflow): описать процесс разработки
chore(deps): обновить vite до 7.3
test(tick): покрыть фиксированный шаг
perf(map): кешировать тайлы рендера
```
