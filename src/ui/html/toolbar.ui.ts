import { BaseHTMLElement, HTMLElementConfig } from './base.ui';
import { HTMLButton, HTMLButtonConfig } from './button.ui';

export interface ToolbarSection {
  id: string;
  className?: string;
  tools: HTMLButtonConfig[];
}

export interface ToolbarConfig extends HTMLElementConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
  orientation?: 'horizontal' | 'vertical';
  sections?: ToolbarSection[];
  // Устаревшие свойства для обратной совместимости
  tools?: HTMLButtonConfig[];
}

export class HTMLToolbar extends BaseHTMLElement {
  private config: ToolbarConfig;
  private sections: Map<string, HTMLElement> = new Map();
  private tools: Map<string, HTMLButton> = new Map();

  constructor(config: ToolbarConfig = {}) {
    // Устанавливаем значения по умолчанию для config
    const defaultConfig: ToolbarConfig = {
      position: 'top',
      orientation: 'horizontal',
      sections: [],
      ...config,
    };

    super('div', {
      ...defaultConfig,
      className: `html-toolbar ${defaultConfig.position} ${defaultConfig.orientation} floating`,
    });

    this.config = defaultConfig;

    // Вызываем init после полной инициализации
    this.init();
  }

  protected init(): void {
    // Настройка базовых стилей панели инструментов
    this.applyPositionStyles();
    this.applyOrientationStyles();

    // Создание секций или обратная совместимость с tools
    if (this.config.sections && this.config.sections.length > 0) {
      this.createSections();
    } else if (this.config.tools) {
      // Обратная совместимость: создаем одну секцию для старого API
      this.createDefaultSection();
    }
  }

  private createSections(): void {
    if (!this.config.sections) return;

    this.config.sections.forEach((section) => {
      const sectionElement = document.createElement('div');
      sectionElement.className = `toolbar-section ${section.className || ''}`;

      // Создаем контейнер для инструментов в секции
      const toolsContainer = document.createElement('div');
      toolsContainer.className = 'toolbar-section-tools';

      section.tools.forEach((toolConfig) => {
        const button = new HTMLButton(toolConfig);
        this.tools.set(`${section.id}-${toolConfig.label}`, button);
        toolsContainer.appendChild(button.getElement());
      });

      sectionElement.appendChild(toolsContainer);
      this.element.appendChild(sectionElement);
      this.sections.set(section.id, sectionElement);
    });
  }

  private createDefaultSection(): void {
    // Обратная совместимость: создаем одну секцию для старого API
    if (!this.config.tools) return;

    const sectionElement = document.createElement('div');
    sectionElement.className = 'toolbar-section default-section';

    const toolsContainer = document.createElement('div');
    toolsContainer.className = 'toolbar-section-tools';

    this.config.tools.forEach((toolConfig) => {
      const button = new HTMLButton(toolConfig);
      this.tools.set(toolConfig.label, button);
      toolsContainer.appendChild(button.getElement());
    });

    sectionElement.appendChild(toolsContainer);
    this.element.appendChild(sectionElement);
    this.sections.set('default', sectionElement);
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

  // Перегрузка для обратной совместимости
  public addTool(toolConfig: HTMLButtonConfig): HTMLButton;
  public addTool(sectionId: string, toolConfig: HTMLButtonConfig): HTMLButton;
  public addTool(
    sectionIdOrConfig: string | HTMLButtonConfig,
    toolConfig?: HTMLButtonConfig,
  ): HTMLButton {
    // Обработка перегрузки
    let sectionId: string;
    let config: HTMLButtonConfig;

    if (typeof sectionIdOrConfig === 'string' && toolConfig) {
      sectionId = sectionIdOrConfig;
      config = toolConfig;
    } else if (typeof sectionIdOrConfig === 'object' && !toolConfig) {
      // Обратная совместимость: добавляем в секцию по умолчанию
      sectionId = 'default';
      config = sectionIdOrConfig;
    } else {
      throw new Error('Invalid parameters for addTool');
    }

    const button = new HTMLButton({
      ...config,
      size: config.size || 'medium',
    });

    const sectionElement = this.sections.get(sectionId);
    if (sectionElement) {
      const toolsContainer = sectionElement.querySelector('.toolbar-section-tools');
      if (toolsContainer) {
        toolsContainer.appendChild(button.getElement());
      }
    }

    this.tools.set(`${sectionId}-${config.label}`, button);
    return button;
  }

  public addTools(sectionId: string, tools: HTMLButtonConfig[]): HTMLButton[] {
    return tools.map((tool) => this.addTool(sectionId, tool));
  }

  public removeTool(sectionId: string, toolLabel: string): this {
    const toolKey = `${sectionId}-${toolLabel}`;
    const button = this.tools.get(toolKey);
    if (button) {
      button.remove();
      this.tools.delete(toolKey);
    }
    return this;
  }

  public clearTools(sectionId?: string): this {
    if (sectionId) {
      // Очищаем инструменты только в указанной секции
      const sectionElement = this.sections.get(sectionId);
      if (sectionElement) {
        const toolsContainer = sectionElement.querySelector('.toolbar-section-tools');
        if (toolsContainer) {
          toolsContainer.innerHTML = '';
        }
      }
      // Удаляем инструменты из Map
      for (const [key, button] of this.tools) {
        if (key.startsWith(`${sectionId}-`)) {
          this.tools.delete(key);
        }
      }
    } else {
      // Очищаем все инструменты
      this.tools.forEach((button) => button.remove());
      this.tools.clear();
    }
    return this;
  }

  public getTool(sectionId: string, toolLabel: string): HTMLButton | undefined {
    return this.tools.get(`${sectionId}-${toolLabel}`);
  }

  public getTools(sectionId?: string): HTMLButton[] {
    if (sectionId) {
      return Array.from(this.tools.entries())
        .filter(([key]) => key.startsWith(`${sectionId}-`))
        .map(([, button]) => button);
    }
    return Array.from(this.tools.values());
  }

  public getSection(sectionId: string): HTMLElement | undefined {
    return this.sections.get(sectionId);
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
