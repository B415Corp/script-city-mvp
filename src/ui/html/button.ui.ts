import { BaseHTMLElement, HTMLElementConfig } from './base.ui';

export interface HTMLButtonConfig extends HTMLElementConfig {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

export class HTMLButton extends BaseHTMLElement {
  private config: HTMLButtonConfig;

  constructor(config: HTMLButtonConfig) {
    // Устанавливаем значения по умолчанию
    const defaultConfig: HTMLButtonConfig = {
      variant: 'primary',
      size: 'medium',
      ...config,
    };

    super('button', {
      ...defaultConfig,
      textContent: defaultConfig.label,
      className: `html-button ${defaultConfig.variant} ${defaultConfig.size}`,
    });

    this.config = defaultConfig;

    // Вызываем init после полной инициализации
    this.init();
  }

  protected init(): void {
    // Обработка disabled состояния
    if (this.config.disabled) {
      this.disable();
    }

    // Обработчик клика
    if (this.config.onClick) {
      this.on('click', (e) => {
        e.preventDefault();
        this.config.onClick?.();
      });
    }
  }

  public enable(): this {
    this.config.disabled = false;
    this.element.removeAttribute('disabled');
    this.removeClass('disabled');
    return this;
  }

  public disable(): this {
    this.config.disabled = true;
    this.element.setAttribute('disabled', 'true');
    this.addClass('disabled');
    return this;
  }

  public setLabel(label: string): this {
    this.config.label = label;
    this.setText(label);
    return this;
  }

  public setOnClick(handler: () => void): this {
    this.config.onClick = handler;
    return this;
  }

  public setVariant(variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'): this {
    // Удаляем старый вариант
    ['primary', 'secondary', 'success', 'danger', 'warning'].forEach((v) => {
      this.removeClass(v);
    });

    this.addClass(variant);
    this.config.variant = variant;
    return this;
  }
}
