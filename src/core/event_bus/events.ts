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
  //
  TileUnhovered = 'TileUnhovered',
  TileHovered = 'TileHovered',
  CameraZoomed = 'CameraZoomed',
  TileClicked = 'TileClicked',
}
