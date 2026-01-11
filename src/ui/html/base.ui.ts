export interface HTMLElementConfig {
  id?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  attributes?: Record<string, string>;
  textContent?: string;
  innerHTML?: string;
}

export abstract class BaseHTMLElement {
  protected element: HTMLElement;

  constructor(tagName: string, config: HTMLElementConfig = {}) {
    this.element = document.createElement(tagName);

    if (config.id) {
      this.element.id = config.id;
    }

    if (config.className) {
      this.element.className = config.className;
    }

    if (config.style) {
      Object.assign(this.element.style, config.style);
    }

    if (config.attributes) {
      Object.entries(config.attributes).forEach(([key, value]) => {
        this.element.setAttribute(key, value);
      });
    }

    if (config.textContent) {
      this.element.textContent = config.textContent;
    }

    if (config.innerHTML) {
      this.element.innerHTML = config.innerHTML;
    }

    // init() теперь вызывается дочерними классами после их полной инициализации
  }

  protected abstract init(): void;

  public getElement(): HTMLElement {
    return this.element;
  }

  public appendTo(parent: HTMLElement | string): this {
    const parentElement =
      typeof parent === 'string' ? (document.querySelector(parent) as HTMLElement) : parent;

    if (parentElement) {
      parentElement.appendChild(this.element);
    }

    return this;
  }

  public remove(): this {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    return this;
  }

  public addClass(className: string): this {
    this.element.classList.add(className);
    return this;
  }

  public removeClass(className: string): this {
    this.element.classList.remove(className);
    return this;
  }

  public toggleClass(className: string): this {
    this.element.classList.toggle(className);
    return this;
  }

  public setStyle(property: string, value: string): this {
    this.element.style.setProperty(property, value);
    return this;
  }

  public setText(text: string): this {
    this.element.textContent = text;
    return this;
  }

  public setHTML(html: string): this {
    this.element.innerHTML = html;
    return this;
  }

  public on(event: string, handler: EventListener): this {
    this.element.addEventListener(event, handler);
    return this;
  }

  public off(event: string, handler: EventListener): this {
    this.element.removeEventListener(event, handler);
    return this;
  }
}
