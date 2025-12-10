# CLI генератор (sc-cli)

**Теги**: `arch:tools`, `development`, `status:mvp`

Интерактивный CLI для быстрого создания модулей, сцен, ECS-систем и инструментов с автоподключением в существующие реестры.

## Запуск

- Установка зависимостей уже в проекте (`prompts`, `ts-morph`, `tsx`).
- Запуск:
  - через npm: `npm run cli -- generate <module|scene|system|tool>`
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
- Аргументы/флаги:
  - `--yes` — предзаполнить значениями по умолчанию: `moduleId=new_module`, `moduleClass=NewModule`, без хэндлера, без UI, без зависимостей.
  - `--dry-run` — только выводит создаваемые файлы/патчи без записи на диск.
- Ответы формы:
  - `moduleId` (строка, snake/kebab допускаются, используется в путях и module.id).
  - `moduleClass` (PascalCase, по умолчанию из moduleId + `Module`).
  - `scenes` (мультивыбор SceneKey, добавляет модуль в `modules` сцены).
  - `withCommandHandler` (bool) + `commandName` (PascalCase, Command.type).
  - `withUiScaffold` (bool) — добавит простую надпись Phaser.
  - `dependencies` (список id через запятую) — попадут в `dependencies` модуля.

### generate scene

- Вопросы: `SceneKey`, `sceneClass`, список модулей (по ID) для автоподключения.
- Артефакты:
  - `src/scenes/<snake>_scene.ts`
  - новый ключ в `SceneKey` (`src/app/scene_controller/types.ts`)
  - запись в `SCENE_CONFIGS` с импортами в `src/app/game_app.ts`.
- Аргументы/флаги:
  - `--yes` — `sceneKey=Sandbox`, `sceneClass=SandboxScene`, без модулей.
  - `--dry-run` — не пишет на диск, только выводит план действий.
- Ответы формы:
  - `sceneKey` (enum SceneKey, без суффикса Scene).
  - `sceneClass` (PascalCase, по умолчанию из sceneKey + `Scene`).
  - `modules` (id через запятую) — попадут в `modules: () => [...]` для сцены.

### generate system

- Вопросы: `systemId`, `systemClass`, `priority`, `updateInterval`, список модулей для регистрации.
- Артефакты:
  - `src/ecs/systems/<snake>_system.ts`
  - экспорт в `src/ecs/systems/index.ts`
  - регистрация в выбранных модулях (`initialize` → `core.getECSManager().registerSystem(...)`).
- Аргументы/флаги:
  - `--yes` — `systemId=custom_system`, `systemClass=CustomSystem`, `priority=50`, `updateInterval=1`, без модулей.
  - `--dry-run` — только вывод действий.
- Ответы формы:
  - `systemId` (строка, влияет на файл и system.id).
  - `systemClass` (PascalCase, default из systemId + `System`).
  - `priority` (number, меньше = раньше).
  - `updateInterval` (number, 1 = каждый тик).
  - `moduleIds` (multiselect из существующих модулей) — куда добавить регистрацию.

### generate tool

- Вопросы: `moduleId` (сразу, выбор из модулей, у которых есть `<id>_module.ts`; иначе текстовый ввод), `toolId`, имя, тип, категория (id/name/icon/order), сцены для автоподключения модуля.
- Артефакты:
  - `src/core/tool_manager/tools/<slug>_tool.ts` с фабрикой `create*`
  - попытка автоподключить регистрацию в модуль `<moduleId>_module.ts`
  - автоподключение модуля в выбранные сцены через `SCENE_CONFIGS`.
- Аргументы/флаги:
  - `--yes` — автозаполнение примером: toolId `zoning:rectangle`, moduleId `tools`, scenes `[Game]`, тип `select`, категория `zoning`, order `10`.
  - `--dry-run` — только выводит патчи.
- Ответы формы:
  - `moduleId` (существующий или новый каталог модуля).
  - `toolId` (уникальный, допускает `:`).
  - `toolName` (отображаемое имя).
  - `toolType` (строка/enum ToolType).
  - `categoryId`, `categoryName`, `icon`, `order`.
  - `scenes` (мультивыбор SceneKey) — подключение модуля со сценами.

### plan (batch generate)

- **Теги**: `arch:tools`, `development`, `status:planned`
- Назначение: один запуск создает несколько сущностей (сцена + модули + системы + инструменты) по заранее подготовленному плану.
- Формат: `npm run cli -- plan run --file plan.json [--dry-run]`
  - `plan.json` хранит ответы на вопросы генераторов (SceneKey, moduleId/moduleClass, systemId/systemClass/priority, toolId/тип/категория и т.д.) и порядок применения.
  - `--dry-run` показывает итоговый набор создаваемых файлов и патчей автоподключений без записи на диск.
- Артефакты:
  - все стандартные файлы генераторов (scene/module/system/tool), созданные в одном проходе;
  - автоподключения в `SCENE_CONFIGS`, реестры систем и модулей согласно плану;
  - опционально: сохранение фактических ответов в `plan.result.json` для повторного запуска.
- Поля `plan.json`:
  - `order`: массив фаз (`modules|systems|tools|scenes`), по умолчанию `["modules","systems","tools","scenes"]`.
  - `modules`: массив `ModuleAnswers`.
  - `systems`: массив `SystemAnswers`.
  - `tools`: массив `ToolAnswers`.
  - `scenes`: массив `SceneAnswers`.
  - Пример:
    ```json
    {
      "order": ["modules", "systems", "tools", "scenes"],
      "modules": [
        {
          "moduleId": "tools",
          "moduleClass": "ToolsModule",
          "scenes": ["Game"],
          "withCommandHandler": false,
          "withUiScaffold": false,
          "dependencies": []
        }
      ],
      "systems": [
        {
          "systemId": "custom_system",
          "systemClass": "CustomSystem",
          "priority": 50,
          "updateInterval": 1,
          "moduleIds": ["tools"]
        }
      ],
      "tools": [
        {
          "moduleId": "tools",
          "toolId": "zoning:rectangle",
          "toolName": "Zoning Rectangle",
          "toolType": "select",
          "categoryId": "zoning",
          "categoryName": "Зонирование",
          "icon": "🧰",
          "order": 10,
          "scenes": ["Game"]
        }
      ],
      "scenes": [{ "sceneKey": "Sandbox", "sceneClass": "SandboxScene", "modules": ["tools"] }]
    }
    ```

### check (валидация структуры)

- **Теги**: `arch:tools`, `development`, `status:planned`
- Назначение: проверить, что проект соответствует ожидаемой структуре для автогенерации.
- Формат: `npm run cli -- check [--fix] [--verbose]`
  - Проверки: наличие `src/core`, `src/ecs/systems`, `src/modules/<id>/<id>_module.ts`, `src/scenes/*_scene.ts`, `SCENE_CONFIGS` в `src/app/game_app.ts`, экспортов в индексах систем/модулей, валидности категорий инструментов.
  - `--verbose` выводит детали по каждому несоответствию.
  - `--fix` предлагает безопасные автоправки (добавить недостающие экспорты, обновить `SCENE_CONFIGS`, создать пустые каталоги).
- Вывод: список проблем и подсказки по исправлению; при `--fix` — список примененных изменений.

### help

- **Теги**: `arch:tools`, `development`, `status:mvp`
- Формат: `npm run cli -- help`
- Выводит краткое описание доступных команд и ключей: `generate`, `plan run`, `check`.

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
