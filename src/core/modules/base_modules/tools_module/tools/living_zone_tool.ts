import { Tool } from '../tool';
import { ToolActivatedPayload } from '../types';

export class LivingZoneTool extends Tool {
  readonly id = 'living_zone' as const;

  getActivatedPayload(): ToolActivatedPayload {
    return {
      type: this.id,
      mode: 'area_select',
      style: {
        hover: { fill: 0xffffff, fillAlpha: 0.06, line: 0x00ff00, lineAlpha: 0.8, lineWidth: 2 },
        selection: { fill: 0x00ff00, fillAlpha: 0.25, line: 0xffffff, lineAlpha: 1, lineWidth: 2 },
      },
    };
  }
}
