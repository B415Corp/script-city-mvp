import { Tool } from '../tool';
import type { ToolActivatedPayload } from '../types';

export class CommercialZoneTool extends Tool {
  readonly id = 'commercial_zone' as const;

  getActivatedPayload(): ToolActivatedPayload {
    return {
      type: this.id,
      mode: 'area_select',
      cursor: 'pointer',
      style: {
        hover: { fill: 0xffffff, fillAlpha: 0.06, line: 0x0000ff, lineAlpha: 0.8, lineWidth: 2 }, // синий
        selection: { fill: 0x0000ff, fillAlpha: 0.25, line: 0xffffff, lineAlpha: 1, lineWidth: 2 },
      },
    };
  }
}
