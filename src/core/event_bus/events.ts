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

  // Состояние карты
  TileUnhovered = 'TileUnhovered',
  TileHovered = 'TileHovered',
  CameraZoomed = 'CameraZoomed',
  TileClicked = 'TileClicked',

  // Ивенты инструментов
  SelectTool = 'SelectTool',
}
