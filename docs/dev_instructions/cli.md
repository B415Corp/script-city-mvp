# CLI генератор (sc-cli)

**Теги**: `arch:tools`, `development`, `status:mvp`

Интерактивный CLI для быстрого создания модулей, сцен, ECS-систем и инструментов с автоподключением в существующие реестры.

## Запуск

- Установка зависимостей уже в проекте (`prompts`, `ts-morph`, `tsx`).
- Запуск:
  - через npm: `npm run sc-cli -- generate <module|scene|system|tool>`
  - прямой вызов: `npx tsx scripts/sc-cli.ts generate <...>`
- Флаги:
  - `--yes` — использовать значения по умолчанию без вопросов.
  - `--dry-run` — показать, что будет создано/изменено, без записи на диск.

## Команды

### generate module

- Вопросы: `moduleId`, `moduleClass`, сцены для автоподключения, хэндлер новой команды (опционально, Command.type), стартовый UI-контейнер (опционально), зависимости.
- Артефакты:
  - `src/modules/<id>/<id>_module.ts`
  - опционально `.../<command>_command_handler.ts`
  - `index.ts` с экспортом
  - автоподключение в `SCENE_CONFIGS` (`src/app/game_app.ts`) для выбранных сцен.

### generate scene

- Вопросы: `SceneKey`, `sceneClass`, список модулей (по ID) для автоподключения.
- Артефакты:
  - `src/scenes/<snake>_scene.ts`
  - новый ключ в `SceneKey` (`src/app/scene_controller/types.ts`)
  - запись в `SCENE_CONFIGS` с импортами в `src/app/game_app.ts`.

### generate system

- Вопросы: `systemId`, `systemClass`, `priority`, `updateInterval`, список модулей для регистрации.
- Артефакты:
  - `src/ecs/systems/<snake>_system.ts`
  - экспорт в `src/ecs/systems/index.ts`
  - регистрация в выбранных модулях (`initialize` → `core.getECSManager().registerSystem(...)`).

### generate tool

- Вопросы: `toolId`, имя, тип, категория (id/name/icon/order), сцены для автоподключения модуля, `moduleId` для регистрации.
- Артефакты:
  - `src/core/tool_manager/tools/<slug>_tool.ts` с фабрикой `create*`
  - попытка автоподключить регистрацию в модуль `<moduleId>_module.ts`
  - автоподключение модуля в выбранные сцены через `SCENE_CONFIGS`.

## Ограничения и заметки

- Автоподключение ожидает стандартные структуры:
  - `SCENE_CONFIGS` в `src/app/game_app.ts`
  - модули в `src/modules/<id>/<id>_module.ts`
  - системы в `src/ecs/systems`
  - инструменты в `src/core/tool_manager/tools`
- Если структура файла сильно отличается от шаблона, может потребоваться ручная доработка.
- После генерации желательно запустить `npm run lint`/`npm run type-check`.

## Примеры

- Модуль: `npm run sc-cli -- generate module`
- Сцена: `npm run sc-cli -- generate scene`
- Система: `npm run sc-cli -- generate system --yes`
- Инструмент: `npm run sc-cli -- generate tool`
