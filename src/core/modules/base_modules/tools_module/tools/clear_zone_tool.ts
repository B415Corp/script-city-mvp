import { Tool } from '../tool';
import { ToolActivatedPayload } from '../types';

export class ClearZoneTool extends Tool {
  readonly id = 'clear_zone' as const;

  getActivatedPayload(): ToolActivatedPayload {
    return {
      type: this.id,
      mode: 'area_select',
      style: {
        hover: { fill: 0xffffff, fillAlpha: 0.06, line: 0xffff00, lineAlpha: 0.9, lineWidth: 2 },
        selection: { fill: 0xffff00, fillAlpha: 0.25, line: 0xffffff, lineAlpha: 1, lineWidth: 2 },
      },
    };
  }
}
