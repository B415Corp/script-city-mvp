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
    super('button', {
      ...config,
      textContent: config.label,
      className: `html-button ${config.variant || 'primary'} ${config.size || 'medium'}`,
    });

    this.config = config;
  }

  protected init(): void {
    // Настройка базовых стилей кнопки
    this.setStyle('cursor', 'pointer');
    this.setStyle('border', 'none');
    this.setStyle('borderRadius', '4px');
    this.setStyle('padding', '8px 16px');
    this.setStyle('fontSize', '14px');
    this.setStyle('fontWeight', '500');
    this.setStyle('transition', 'all 0.2s ease');

    // Применение варианта стиля
    this.applyVariantStyles();

    // Применение размера
    this.applySizeStyles();

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

    // Hover эффекты
    this.on('mouseenter', () => {
      if (!this.config.disabled) {
        this.addClass('hover');
      }
    });

    this.on('mouseleave', () => {
      this.removeClass('hover');
    });
  }

  private applyVariantStyles(): void {
    const baseStyles = {
      primary: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        borderColor: '#007bff',
      },
      secondary: {
        backgroundColor: '#6c757d',
        color: '#ffffff',
        borderColor: '#6c757d',
      },
      success: {
        backgroundColor: '#28a745',
        color: '#ffffff',
        borderColor: '#28a745',
      },
      danger: {
        backgroundColor: '#dc3545',
        color: '#ffffff',
        borderColor: '#dc3545',
      },
      warning: {
        backgroundColor: '#ffc107',
        color: '#212529',
        borderColor: '#ffc107',
      },
    };

    const variant = this.config.variant || 'primary';
    const styles = baseStyles[variant as keyof typeof baseStyles];

    this.setStyle('backgroundColor', styles.backgroundColor);
    this.setStyle('color', styles.color);
    this.setStyle('borderColor', styles.borderColor);
  }

  private applySizeStyles(): void {
    const sizeStyles = {
      small: {
        padding: '4px 12px',
        fontSize: '12px',
      },
      medium: {
        padding: '8px 16px',
        fontSize: '14px',
      },
      large: {
        padding: '12px 24px',
        fontSize: '16px',
      },
    };

    const size = this.config.size || 'medium';
    const styles = sizeStyles[size];

    this.setStyle('padding', styles.padding);
    this.setStyle('fontSize', styles.fontSize);
  }

  public enable(): this {
    this.config.disabled = false;
    this.element.removeAttribute('disabled');
    this.removeClass('disabled');
    this.setStyle('cursor', 'pointer');
    this.setStyle('opacity', '1');
    return this;
  }

  public disable(): this {
    this.config.disabled = true;
    this.element.setAttribute('disabled', 'true');
    this.addClass('disabled');
    this.setStyle('cursor', 'not-allowed');
    this.setStyle('opacity', '0.6');
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
    this.applyVariantStyles();
    return this;
  }
}
