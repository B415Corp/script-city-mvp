import { Tool } from './tool';

export interface ToolsEvents {
  type: string;
}

export type ToolStackType = Record<
  string,
  {
    localeName: string;
    description: string | null;
    icon: string | null;
    class: Tool;
  }
>;

export type ToolId =
  | 'info'
  | 'select'
  | 'area_select'
  | 'living_zone'
  | 'commercial_zone'
  | 'clear_zone';

export type MapInteractionMode = 'hover_only' | 'area_select';

export interface ToolStyle {
  hover: { fill: number; fillAlpha: number; line: number; lineAlpha: number; lineWidth: number };
  selection: {
    fill: number;
    fillAlpha: number;
    line: number;
    lineAlpha: number;
    lineWidth: number;
  };
}

// Инструмент сообщает миру: "я активирован, вот как рисовать"
export interface ToolActivatedPayload {
  type: ToolId;
  mode: MapInteractionMode;
  style: ToolStyle;
  cursor: string; // CSS cursor string
}

/**
 * Данные события SelectTool
 * Содержит информацию о выбранном инструменте
 */
export interface SelectToolPayload {
  /** Тип выбранного инструмента */
  type: string;
}
