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
