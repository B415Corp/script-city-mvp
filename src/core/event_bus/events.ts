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

  // Состояние карты
  TileUnhovered = 'TileUnhovered',
  TileHovered = 'TileHovered',
  CameraZoomed = 'CameraZoomed',
  TileClicked = 'TileClickedDown',
  TileClickedUp = 'TileClickedUp',
  TilesSelected = 'TilesSelected',

  // Ивенты инструментов
  SelectTool = 'SelectTool',

  // модули
  ModuleEnabled = 'ModuleEnabled',
  ModuleDisabled = 'ModuleDisabled',
  ModuleError = 'ModuleError',
}
