// Импорт необходимых типов
import { Events } from './events';
import { LogicTickData, SetSpeedPayload, TickStartedPayload } from '../tick/types';
import { GameTimeUpdateData } from '../ecs/types';
import {
  ToolActivatedPayload,
  SelectToolPayload,
} from '../modules/base_modules/tools_module/types';
import {
  TileHoveredPayload,
  TileClickedPayload,
  TilesSelectedPayload,
  CameraZoomedPayload,
  MapCenteredPayload,
} from '../modules/base_modules/map_module/types';
import { ModuleStatePayload, ModuleErrorPayload } from '../modules/extends/types';
import { EntityId } from 'bitecs';

// ============================================================================
// LEGACY EVENT PAYLOAD TYPES
// ============================================================================

export interface TimeTickPayload {
  tick: number;
  time: number;
}

export interface TimeDayPayload {
  day: number;
}

export interface CitizenHiredPayload {
  entityId: number;
  workplaceId: number;
  salary: number;
}

// ============================================================================
// EVENT PAYLOAD MAP (типобезопасный маппинг)
// ============================================================================

export interface EventPayloadMap {
  // Time events
  [Events.LogicTick]: LogicTickData;
  [Events.GameTimeUpdated]: GameTimeUpdateData;
  [Events.TickStarted]: TickStartedPayload;
  [Events.TickEnded]: undefined;
  [Events.SetGameSpeed]: SetSpeedPayload;

  // Game state events
  [Events.GameStarted]: undefined;
  [Events.GamePaused]: undefined;
  [Events.GameStopped]: undefined;
  [Events.GamePauseToggle]: undefined;

  // Map events
  [Events.MapCentered]: MapCenteredPayload;
  [Events.SceneReady]: undefined;

  // UI/Map interaction events
  [Events.TileHovered]: TileHoveredPayload;
  [Events.TileUnhovered]: TileClickedPayload;
  [Events.TileClicked]: TileClickedPayload;
  [Events.TileClickedUp]: TileClickedPayload;
  [Events.TilesSelected]: TilesSelectedPayload;
  [Events.CameraZoomed]: CameraZoomedPayload;

  // Tool events
  [Events.SelectTool]: SelectToolPayload;
  [Events.ToolActivated]: ToolActivatedPayload;
  [Events.ResetToolToDefault]: undefined;

  // Module events
  [Events.ModuleEnabled]: ModuleStatePayload;
  [Events.ModuleDisabled]: ModuleStatePayload;
  [Events.ModuleError]: ModuleErrorPayload;

  // System events
  [Events.CallSystem]: CallSystemPayload;
  [Events.SystemError]: { systemName: string; error: Error };

  // Legacy time events for tests (using string literals for backward compatibility)
  'time:tick': TimeTickPayload;
  'time:day': TimeDayPayload;

  // Citizen events
  'citizen:hired': CitizenHiredPayload;
}

// ============================================================================
// TYPE-SAFE EVENT BUS TYPES
// ============================================================================

export type EventCallback<T = unknown> = (payload?: T) => void;

export interface Subscription {
  unsubscribe(): void;
}

export interface HandlerInfo {
  handler: EventCallback<unknown>;
  once: boolean;
}

export type EventHandler<T = unknown> = (payload?: T) => void;

// Вспомогательный тип для получения payload типа по событию
export type EventPayload<T extends Events> = EventPayloadMap[T];

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Payload для вызова систем
export interface CallSystemPayload {
  systemName: string;
  entityId?: EntityId;
  extraData?: unknown;
}
