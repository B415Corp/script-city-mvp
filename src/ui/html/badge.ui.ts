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
    super('span', {
      ...config,
      textContent: config.text,
      className: `html-badge ${config.variant || 'default'} ${config.size || 'medium'}`,
    });

    this.config = config;
  }

  protected init(): void {
    // Настройка базовых стилей бейджа
    this.setStyle('display', 'inline-flex');
    this.setStyle('alignItems', 'center');
    this.setStyle('justifyContent', 'center');
    this.setStyle('fontWeight', '500');
    this.setStyle('textAlign', 'center');
    this.setStyle('transition', 'all 0.2s ease');

    // Применение варианта стиля
    this.applyVariantStyles();

    // Применение размера
    this.applySizeStyles();

    // Применение скругления
    if (this.config.rounded) {
      this.setStyle('borderRadius', '50%');
    }
  }

  private applyVariantStyles(): void {
    const baseStyles = {
      default: {
        backgroundColor: '#f8f9fa',
        color: '#212529',
        border: '1px solid #dee2e6',
      },
      primary: {
        backgroundColor: '#007bff',
        color: '#ffffff',
        border: '1px solid #007bff',
      },
      secondary: {
        backgroundColor: '#6c757d',
        color: '#ffffff',
        border: '1px solid #6c757d',
      },
      success: {
        backgroundColor: '#28a745',
        color: '#ffffff',
        border: '1px solid #28a745',
      },
      warning: {
        backgroundColor: '#ffc107',
        color: '#212529',
        border: '1px solid #ffc107',
      },
      danger: {
        backgroundColor: '#dc3545',
        color: '#ffffff',
        border: '1px solid #dc3545',
      },
    };

    const variant = this.config.variant || 'default';
    const styles = baseStyles[variant];

    this.setStyle('backgroundColor', styles.backgroundColor);
    this.setStyle('color', styles.color);
    this.setStyle('border', styles.border);
  }

  private applySizeStyles(): void {
    const sizeStyles = {
      small: {
        padding: '2px 6px',
        fontSize: '12px',
        lineHeight: '1.2',
        minWidth: '20px',
        height: '20px',
      },
      medium: {
        padding: '4px 8px',
        fontSize: '14px',
        lineHeight: '1.4',
        minWidth: '28px',
        height: '28px',
      },
      large: {
        padding: '6px 12px',
        fontSize: '16px',
        lineHeight: '1.5',
        minWidth: '36px',
        height: '36px',
      },
    };

    const size = this.config.size || 'medium';
    const styles = sizeStyles[size];

    this.setStyle('padding', styles.padding);
    this.setStyle('fontSize', styles.fontSize);
    this.setStyle('lineHeight', styles.lineHeight);
    this.setStyle('minWidth', styles.minWidth);
    this.setStyle('height', styles.height);
  }

  public updateText(text: string): this {
    this.config.text = text;
    this.setText(text);
    return this;
  }

  public setVariant(
    variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
  ): this {
    // Удаляем старый вариант
    Object.keys(this.element.classList).forEach((className) => {
      if (className.includes('html-badge') && className !== 'html-badge') {
        const parts = className.split(' ');
        parts.forEach((part) => {
          if (['default', 'primary', 'secondary', 'success', 'warning', 'danger'].includes(part)) {
            this.removeClass(part);
          }
        });
      }
    });

    this.addClass(variant);
    this.config.variant = variant;
    this.applyVariantStyles();
    return this;
  }

  public setSize(size: 'small' | 'medium' | 'large'): this {
    // Удаляем старый размер
    ['small', 'medium', 'large'].forEach((s) => this.removeClass(s));

    this.addClass(size);
    this.config.size = size;
    this.applySizeStyles();
    return this;
  }
}
