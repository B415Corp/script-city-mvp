// Импорт необходимых типов
import { Events } from './events';
import { LogicTickData, SetSpeedPayload, TickStartedPayload } from '../tick/types';
import { GameTimeUpdateData } from '../ecs/types';
import { ToolActivatedPayload, SelectToolPayload } from '../modules/base_modules/tools_module/types';
import {
  TileHoveredPayload,
  TileClickedPayload,
  TilesSelectedPayload,
  CameraZoomedPayload,
  MapCenteredPayload
} from '../modules/base_modules/map_module/types';
import { ModuleStatePayload, ModuleErrorPayload } from '../modules/extends/types';

export interface Subscription {
  unsubscribe(): void;
}

export interface HandlerInfo {
  handler: EventHandler;
  once: boolean;
}

export type EventHandler<T = unknown> = (payload?: T) => void;

// Маппинг событий к их payload типам
export interface EventPayloadMap {
  [Events.GameStarted]: undefined;
  [Events.GamePaused]: undefined;
  [Events.GameStopped]: undefined;
  [Events.TickStarted]: TickStartedPayload;
  [Events.TickEnded]: undefined;
  [Events.MapCentered]: MapCenteredPayload;
  [Events.SceneReady]: undefined;
  [Events.LogicTick]: LogicTickData;
  [Events.GamePauseToggle]: undefined;
  [Events.SetGameSpeed]: SetSpeedPayload;
  [Events.GameTimeUpdated]: GameTimeUpdateData;
  [Events.TileUnhovered]: TileClickedPayload;
  [Events.TileHovered]: TileHoveredPayload;
  [Events.CameraZoomed]: CameraZoomedPayload;
  [Events.TileClicked]: TileClickedPayload;
  [Events.TileClickedUp]: TileClickedPayload;
  [Events.TilesSelected]: TilesSelectedPayload;
  [Events.SelectTool]: SelectToolPayload;
  [Events.ToolActivated]: ToolActivatedPayload;
  [Events.ResetToolToDefault]: null;
  [Events.ModuleEnabled]: ModuleStatePayload;
  [Events.ModuleDisabled]: ModuleStatePayload;
  [Events.ModuleError]: ModuleErrorPayload;
}

// Вспомогательный тип для получения payload типа по событию
export type EventPayload<T extends Events> = EventPayloadMap[T];
