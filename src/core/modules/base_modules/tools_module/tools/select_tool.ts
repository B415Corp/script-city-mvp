import { Tool } from '../tool';
import { ToolActivatedPayload } from '../types';

export class SelectTool extends Tool {
  readonly id = 'select' as const;

  getActivatedPayload(): ToolActivatedPayload {
    return {
      type: this.id,
      mode: 'hover_only',
      style: {
        hover: { fill: 0xffffff, fillAlpha: 0.06, line: 0xffffff, lineAlpha: 0.9, lineWidth: 2 },
        selection: { fill: 0xffffff, fillAlpha: 0.25, line: 0xffffff, lineAlpha: 1, lineWidth: 2 },
      },
    };
  }
}
