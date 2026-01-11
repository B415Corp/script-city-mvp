import { BaseHTMLElement, HTMLElementConfig } from './base.ui';

export interface HTMLBadgeConfig extends HTMLElementConfig {
  text: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
}

export class HTMLBadge extends BaseHTMLElement {
  private config: HTMLBadgeConfig;

  constructor(config: HTMLBadgeConfig) {
    // Устанавливаем значения по умолчанию
    const defaultConfig: HTMLBadgeConfig = {
      variant: 'default',
      size: 'medium',
      rounded: false,
      ...config,
    };

    super('span', {
      ...defaultConfig,
      textContent: defaultConfig.text,
      className: `html-badge ${defaultConfig.variant} ${defaultConfig.size}`,
      style: { minWidth: '165px' },
    });

    this.config = defaultConfig;

    // Вызываем init после полной инициализации
    this.init();
  }

  protected init(): void {
    // Применение скругления
    if (this.config.rounded) {
      this.addClass('rounded');
    }
  }

  public updateText(text: string): this {
    this.config.text = text;
    this.setText(text);
    return this;
  }

  public setVariant(
    variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
  ): this {
    // Удаляем старые варианты
    const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'danger'];
    variants.forEach((v) => {
      this.removeClass(v);
    });

    this.addClass(variant);
    this.config.variant = variant;
    return this;
  }

  public setSize(size: 'small' | 'medium' | 'large'): this {
    // Удаляем старый размер
    ['small', 'medium', 'large'].forEach((s) => this.removeClass(s));

    this.addClass(size);
    this.config.size = size;
    return this;
  }
}
