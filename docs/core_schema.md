# Таблица взаимодействий компонентов ядра

| №   | Источник         | Цель             | Название                      | Описание                                                                                                 |
| --- | ---------------- | ---------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | GameCore         | EventBus         | Создание EventBus             | GameCore создает экземпляр EventBus как первый компонент, т.к. другие компоненты могут его использовать  |
| 2   | GameCore         | ECSManager       | Создание ECSManager           | GameCore создает и инициализирует ECSManager для управления игровыми сущностями                          |
| 3   | GameCore         | ModuleManager    | Создание ModuleManager        | GameCore создает ModuleManager для управления модулями игры                                              |
| 4   | GameCore         | CommandProcessor | Создание CommandProcessor     | GameCore создает CommandProcessor, передавая ему EventBus и ECSManager                                   |
| 5   | GameCore         | SaveManager      | Создание SaveManager          | GameCore создает SaveManager и инициализирует его, передавая себя и EventBus                             |
| 6   | GameCore         | TickManager      | Создание TickManager          | GameCore создает TickManager, передавая конфигурацию, EventBus, CommandProcessor и ECSManager            |
| 7   | GameCore         | ModuleManager    | Инициализация модулей         | При запуске GameCore вызывает initializeModules() для загрузки всех зарегистрированных модулей           |
| 8   | GameCore         | TickManager      | Управление циклом             | GameCore запускает/останавливает TickManager через start()/stop()                                        |
| 9   | GameCore         | ECSManager       | Очистка состояния             | При уничтожении GameCore вызывает clear() для очистки всех сущностей                                     |
| 10  | GameCore         | EventBus         | Публикация событий            | GameCore публикует события GameStarted, GameStopped через EventBus                                       |
| 11  | GameCore         | TickManager      | Блокировка скорости           | GameCore может блокировать/разблокировать изменение скорости через lockSpeedChange()/unlockSpeedChange() |
| 12  | TickManager      | EventBus         | Публикация событий тиков      | TickManager публикует события TickStarted, TickEnded при каждом тике                                     |
| 13  | TickManager      | EventBus         | Публикация событий паузы      | TickManager публикует события SimulationPaused, SimulationResumed                                        |
| 14  | TickManager      | EventBus         | Публикация изменения скорости | TickManager публикует событие SpeedChanged при изменении множителя скорости                              |
| 15  | TickManager      | CommandProcessor | Обработка команд              | В начале каждого тика TickManager вызывает processCommands()                                             |
| 16  | TickManager      | ECSManager       | Запуск систем                 | После обработки команд TickManager вызывает runSystems() для выполнения ECS систем                       |
| 17  | CommandProcessor | EventBus         | Подписка на команды           | CommandProcessor подписывается на событие SetSimulationSpeedRequested                                    |
| 18  | CommandProcessor | EventBus         | Публикация результатов        | CommandProcessor публикует события CommandProcessed, CommandRejected, CommandFailed                      |
| 19  | CommandProcessor | EventBus         | Публикация запросов           | CommandProcessor публикует события BuildCommandRequested, ZoneTileRequested и др.                        |
| 20  | CommandProcessor | ECSManager       | Валидация команд              | CommandProcessor использует ECSManager для проверки возможности выполнения команд                        |
| 21  | ModuleManager    | GameCore         | Инициализация модулей         | ModuleManager передает GameCore всем модулям при их инициализации                                        |
| 22  | ModuleManager    | ECSManager       | Регистрация систем            | ModuleManager вызывает registerSystems() у модулей, передавая им ECSManager                              |
| 23  | ECSManager       | EventBus         | Использование в системах      | Системы ECS получают EventBus через runSystems() для публикации событий                                  |
| 24  | SaveManager      | GameCore         | Получение состояния           | SaveManager использует геттеры GameCore для доступа ко всем менеджерам                                   |
| 25  | SaveManager      | TickManager      | Сериализация состояния        | SaveManager вызывает getTickRate(), getCurrentTick(), getSpeed() для сохранения                          |
| 26  | SaveManager      | TickManager      | Десериализация состояния      | SaveManager вызывает setSpeed() для восстановления скорости игры                                         |
| 27  | SaveManager      | ECSManager       | Сериализация ECS              | SaveManager вызывает getAllEntities(), getAllComponentsForEntity() для сохранения                        |
| 28  | SaveManager      | ECSManager       | Десериализация ECS            | SaveManager вызывает clear(), setEntityIdCounter(), addComponent() для восстановления                    |
| 29  | SaveManager      | ModuleManager    | Сериализация модулей          | SaveManager вызывает getAllModules() и serialize() у каждого модуля                                      |
| 30  | SaveManager      | ModuleManager    | Десериализация модулей        | SaveManager вызывает getModule() и deserialize() для восстановления состояния модулей                    |
| 31  | SaveManager      | EventBus         | Доступ через GameCore         | SaveManager получает доступ к EventBus при инициализации для возможной публикации событий                |
| 32  | EventBus         | Все компоненты   | Отправка событий              | EventBus предоставляет механизм emit() для публикации событий всем подписчикам                           |
| 33  | EventBus         | Все компоненты   | Подписка на события           | EventBus предоставляет методы on()/once() для подписки на события                                        |

## Примечания

- **EventBus** - центральный компонент для асинхронной коммуникации, не имеет прямых зависимостей
- **GameCore** - оркестратор всех компонентов, создает их в правильном порядке
- **TickManager** - управляет игровым циклом и координирует выполнение систем
- **CommandProcessor** - мост между UI и игровой логикой
- **SaveManager** - использует все компоненты через GameCore для сохранения/загрузки состояния

## Теги

`arch:core`, `arch:documentation`, `arch:schema`
