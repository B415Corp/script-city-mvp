/**
 * Стандартизированные типы событий для EventBus.
 *
 * **Теги**: `arch:events`, `arch:core`
 *
 * Использование:
 * ```typescript
 * eventBus.emit(Events.GameStarted);
 * eventBus.on(Events.TileClicked, (data) => { ... });
 * ```
 */

export enum Events {
  // ========== Игровые события ==========
  /** Игра запущена */
  GameStarted = 'GameStarted',
  /** Игра остановлена */
  GameStopped = 'GameStopped',

  // ========== События симуляции ==========
  /** Начало тика симуляции */
  TickStarted = 'TickStarted',
  /** Конец тика симуляции */
  TickEnded = 'TickEnded',
  /** Симуляция поставлена на паузу */
  SimulationPaused = 'SimulationPaused',
  /** Симуляция возобновлена */
  SimulationResumed = 'SimulationResumed',
  /** Скорость симуляции изменена */
  SpeedChanged = 'SpeedChanged',
  /** Изменение скорости заблокировано */
  SpeedChangeLocked = 'SpeedChangeLocked',
  /** Блокировка изменения скорости снята */
  SpeedChangeUnlocked = 'SpeedChangeUnlocked',

  // ========== Команды ==========
  /** Запрос на изменение скорости симуляции */
  SetSimulationSpeedRequested = 'SetSimulationSpeedRequested',
  /** Запрос на строительство */
  BuildCommandRequested = 'BuildCommandRequested',
  /** Запрос на снос */
  DemolishCommandRequested = 'DemolishCommandRequested',
  /** Запрос на изменение налогов */
  ChangeTaxRequested = 'ChangeTaxRequested',
  /** Запрос на изменение политики */
  PolicyChangeRequested = 'PolicyChangeRequested',
  /** Запрос на зонирование тайла */
  ZoneTileRequested = 'ZoneTileRequested',
  /** Запрос на удаление зонирования */
  RemoveZoneRequested = 'RemoveZoneRequested',

  // ========== Обработка команд ==========
  /** Команда отклонена */
  CommandRejected = 'CommandRejected',
  /** Команда обработана */
  CommandProcessed = 'CommandProcessed',
  /** Команда завершилась ошибкой */
  CommandFailed = 'CommandFailed',

  // ========== События сетки ==========
  /** Курсор наведён на тайл */
  TileHovered = 'TileHovered',
  /** Курсор ушёл с тайла */
  TileUnhovered = 'TileUnhovered',
  /** Произошёл клик по тайлу */
  TileClicked = 'TileClicked',
  /** Тайл изменён */
  TileChanged = 'TileChanged',
  /** Камера перемещена (drag или стрелки) */
  CameraMoved = 'CameraMoved',
  /** Камера увеличена/уменьшена (zoom) */
  CameraZoomed = 'CameraZoomed',
  /** Карта центрирована */
  MapCentered = 'MapCentered',

  // ========== События инструментов ==========
  /** Инструмент зарегистрирован */
  ToolRegistered = 'ToolRegistered',
  /** Инструмент активирован */
  ToolActivated = 'ToolActivated',
  /** Инструмент деактивирован */
  ToolDeactivated = 'ToolDeactivated',

  // ========== События зданий ==========
  /** Здание повысило уровень */
  BuildingLevelUp = 'BuildingLevelUp',
  /** Здание создано */
  BuildingCreated = 'BuildingCreated',
}
