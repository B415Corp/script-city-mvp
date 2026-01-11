import { BaseHTMLElement, HTMLElementConfig } from './base.ui';
import { HTMLButton, HTMLButtonConfig } from './button.ui';

export interface ToolbarConfig extends HTMLElementConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
  orientation?: 'horizontal' | 'vertical';
  tools?: HTMLButtonConfig[];
}

export class HTMLToolbar extends BaseHTMLElement {
  private config: ToolbarConfig;
  private tools: HTMLButton[] = [];

  constructor(config: ToolbarConfig = {}) {
    // Устанавливаем значения по умолчанию для config
    const defaultConfig: ToolbarConfig = {
      position: 'top',
      orientation: 'horizontal',
      ...config,
    };

    super('div', {
      ...defaultConfig,
      className: `html-toolbar ${defaultConfig.position} ${defaultConfig.orientation}`,
    });

    this.config = defaultConfig;

    // Вызываем init после полной инициализации
    this.init();
  }

  protected init(): void {
    // Настройка базовых стилей панели инструментов
    this.applyPositionStyles();
    this.applyOrientationStyles();

    // Добавление инструментов
    if (this.config.tools) {
      this.addTools(this.config.tools);
    }
  }

  private applyPositionStyles(): void {
    const position = this.config.position || 'top';

    switch (position) {
      case 'top':
        this.setStyle('top', '0');
        this.setStyle('left', '0');
        this.setStyle('right', '0');
        this.setStyle('width', '100%');
        break;
      case 'bottom':
        this.setStyle('bottom', '0');
        this.setStyle('left', '0');
        this.setStyle('right', '0');
        this.setStyle('width', '100%');
        break;
      case 'left':
        this.setStyle('top', '0');
        this.setStyle('left', '0');
        this.setStyle('bottom', '0');
        this.setStyle('height', '100%');
        break;
      case 'right':
        this.setStyle('top', '0');
        this.setStyle('right', '0');
        this.setStyle('bottom', '0');
        this.setStyle('height', '100%');
        break;
    }
  }

  private applyOrientationStyles(): void {
    const orientation = this.config.orientation || 'horizontal';

    this.setStyle('display', 'flex');
    this.setStyle('position', 'fixed');
    this.setStyle('zIndex', '1000');
    this.setStyle('backgroundColor', '#f8f9fa');
    this.setStyle('border', '1px solid #dee2e6');
    this.setStyle('boxShadow', '0 2px 4px rgba(0,0,0,0.1)');

    if (orientation === 'horizontal') {
      this.setStyle('flexDirection', 'row');
      this.setStyle('height', '50px');
      this.setStyle('alignItems', 'center');
      this.setStyle('padding', '0 16px');
      this.setStyle('gap', '8px');
    } else {
      this.setStyle('flexDirection', 'column');
      this.setStyle('width', '60px');
      this.setStyle('justifyContent', 'flex-start');
      this.setStyle('padding', '16px 0');
      this.setStyle('gap', '8px');
    }
  }

  public addTool(toolConfig: HTMLButtonConfig): HTMLButton {
    const button = new HTMLButton({
      ...toolConfig,
      size: toolConfig.size || 'medium',
    });

    this.tools.push(button);
    button.appendTo(this.element);

    return button;
  }

  public addTools(tools: HTMLButtonConfig[]): HTMLButton[] {
    return tools.map((tool) => this.addTool(tool));
  }

  public removeTool(index: number): this {
    if (index >= 0 && index < this.tools.length) {
      this.tools[index].remove();
      this.tools.splice(index, 1);
    }
    return this;
  }

  public clearTools(): this {
    this.tools.forEach((tool) => tool.remove());
    this.tools = [];
    return this;
  }

  public getTool(index: number): HTMLButton | undefined {
    return this.tools[index];
  }

  public getTools(): HTMLButton[] {
    return [...this.tools];
  }

  public setPosition(position: 'top' | 'bottom' | 'left' | 'right'): this {
    // Удаляем старые классы позиционирования
    ['top', 'bottom', 'left', 'right'].forEach((pos) => {
      this.removeClass(pos);
    });

    this.addClass(position);
    this.config.position = position;
    this.applyPositionStyles();
    return this;
  }

  public setOrientation(orientation: 'horizontal' | 'vertical'): this {
    this.removeClass(this.config.orientation || 'horizontal');
    this.addClass(orientation);
    this.config.orientation = orientation;
    this.applyOrientationStyles();
    return this;
  }

  public show(): this {
    this.setStyle('display', 'flex');
    return this;
  }

  public hide(): this {
    this.setStyle('display', 'none');
    return this;
  }

  public toggle(): this {
    const currentDisplay = this.element.style.display;
    if (currentDisplay === 'none') {
      this.show();
    } else {
      this.hide();
    }
    return this;
  }
}
