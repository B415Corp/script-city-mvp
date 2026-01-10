export enum Events {
  // Состояние игры
  GameStarted = 'GameStarted',
  GamePaused = 'GamePaused',
  GameStopped = 'GameStopped',

  // Состояние тиков
  TickStarted = 'TickStarted',
  TickEnded = 'TickEnded',
  MapCentered = 'MapCentered',
  SceneReady = 'SceneReady',
  LogicTick = 'LogicTick',
  GamePauseToggle = 'GamePauseToggle',
  SetGameSpeed = 'SetGameSpeed',
  GameTimeUpdated = 'GameTimeUpdated',

  // Состояние карты
  TileUnhovered = 'TileUnhovered',
  TileHovered = 'TileHovered',
  CameraZoomed = 'CameraZoomed',
  TileClicked = 'TileClickedDown',
  TileClickedUp = 'TileClickedUp',
  TilesSelected = 'TilesSelected',

  // Ивенты инструментов
  SelectTool = 'SelectTool',
  ToolActivated = 'ToolActivated',
  ResetToolToDefault = 'ResetToolToDefault',

  // модули
  ModuleEnabled = 'ModuleEnabled',
  ModuleDisabled = 'ModuleDisabled',
  ModuleError = 'ModuleError',

  // ECS системы
  CallSystem = 'CallSystem',
  SystemError = 'SystemError',
}
