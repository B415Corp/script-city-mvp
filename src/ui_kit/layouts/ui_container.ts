/**
 * Flexbox-подобный контейнер для автоматического позиционирования дочерних элементов.
 *
 * **Теги**: `tech:phaser`, `arch:ui`, `arch:ui-kit`
 */

import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { UIBaseComponent } from '../core/ui_base_component';
import {
  UIFlexDirection,
  UIFlexAlign,
  UIFlexJustify,
  UIComponentConfig,
  UIComputedSize,
} from '../core/types';
import { normalizeSpacing } from '../core/ui_style';
import { UITheme } from '../core/ui_theme';

/**
 * Конфигурация дочернего компонента для контейнера
 */
export interface UIContainerChildConfig {
  component: UIBaseComponent | UIComponent;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

/**
 * Конфигурация UI контейнера
 */
export type UISizeMode = 'content' | 'fixed';

export interface UIContainerConfig extends UIComponentConfig {
  direction?: UIFlexDirection;
  align?: UIFlexAlign;
  justify?: UIFlexJustify;
  gap?: number;
  wrap?: boolean;
  children?: UIContainerChildConfig[];
  sizeMode?: {
    width?: UISizeMode;
    height?: UISizeMode;
  };
}

/**
 * Интерфейс для дочерних элементов контейнера
 */
export interface UIContainerChild {
  element: Phaser.GameObjects.GameObject;
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  visible?: boolean;
}

/**
 * Flexbox-подобный контейнер для UI элементов
 */
export class UIContainer extends UIBaseComponent {
  private direction: UIFlexDirection;
  private align: UIFlexAlign;
  private justify: UIFlexJustify;
  private gap: number;
  private wrap: boolean;
  private children: UIContainerChild[] = [];
  private containerConfig: UIContainerConfig;
  private widthMode: UISizeMode;
  private heightMode: UISizeMode;

  constructor(scene: Phaser.Scene, core: GameCore, config: UIContainerConfig = {}) {
    super(scene, core, config);
    this.containerConfig = config;
    // Умные значения по умолчанию для удобного использования
    this.direction = config.direction ?? 'row';
    this.align = config.align ?? 'center';
    this.justify = config.justify ?? 'start';
    this.gap = config.gap ?? UITheme.sizes.spacing.sm; // 8px по умолчанию
    this.wrap = config.wrap ?? false;
    const hasStyleWidth = this.style.width !== undefined;
    const hasStyleHeight = this.style.height !== undefined;
    this.widthMode = config.sizeMode?.width ?? (hasStyleWidth ? 'fixed' : 'content');
    this.heightMode = config.sizeMode?.height ?? (hasStyleHeight ? 'fixed' : 'content');
  }

  /**
   * Создание контейнера
   */
  create(): void {
    const x = this.style.x ?? 0;
    const y = this.style.y ?? 0;
    this.createBase(x, y);

    // Добавляем дочерние компоненты из конфигурации
    if (this.containerConfig.children && this.containerConfig.children.length > 0) {
      this.containerConfig.children.forEach((childConfig) => {
        // Создаем компонент, если он еще не создан
        // Проверяем наличие контейнера через безопасную проверку
        let childContainer: Phaser.GameObjects.Container | undefined;
        try {
          childContainer = childConfig.component.getContainer();
        } catch {
          // Компонент еще не создан
        }

        if (!childContainer) {
          childConfig.component.create();
        }
        // Добавляем компонент в контейнер
        this.addUIComponent(childConfig.component, childConfig.margin);
      });
    }
  }

  /**
   * Добавление дочернего элемента
   */
  addChild(
    element: Phaser.GameObjects.GameObject,
    width: number,
    height: number,
    margin?: { top?: number; right?: number; bottom?: number; left?: number },
  ): void {
    const normalizedMargin = {
      top: margin?.top ?? 0,
      right: margin?.right ?? 0,
      bottom: margin?.bottom ?? 0,
      left: margin?.left ?? 0,
    };

    this.children.push({
      element,
      width,
      height,
      margin: normalizedMargin,
      visible: true, // По умолчанию элемент видим
    });

    this.contentContainer.add(element);
    this.layout();
  }

  /**
   * Добавление UI компонента (автоматически получает размеры)
   */
  addUIComponent(
    component: UIBaseComponent | UIComponent,
    margin?: { top?: number; right?: number; bottom?: number; left?: number },
  ): void {
    const container = component.getContainer();

    // Получаем размеры в зависимости от типа компонента
    let width: number;
    let height: number;

    if (component instanceof UIBaseComponent) {
      // Для UIBaseComponent используем метод getSize()
      const size = component.getSize();
      width = size.width;
      height = size.height;
    } else {
      // Для UIComponent пытаемся использовать специальные методы, если они есть
      // Например, SpeedControls имеет метод getWidth()
      const displayBounds = container.getBounds();
      let foundSize = false;

      // Инициализируем размеры значениями по умолчанию
      width = displayBounds.width > 0 ? displayBounds.width : 100;
      height = displayBounds.height > 0 ? displayBounds.height : 50;

      // Ищем дочерний UIContainer напрямую в контейнере компонента
      for (const child of container.list) {
        // Если дочерний элемент - это Container, проверяем, является ли он UIContainer
        if (child instanceof Phaser.GameObjects.Container) {
          // Проверяем, есть ли ссылка на UIComponent в контейнере
          const childUIComponent = (
            child as Phaser.GameObjects.Container & { _uiComponent?: UIBaseComponent }
          )._uiComponent;

          if (childUIComponent && childUIComponent instanceof UIBaseComponent) {
            // Используем getSize() из UIBaseComponent
            const uiContainerSize = childUIComponent.getSize();
            // Используем contentWidth/contentHeight для получения фактических размеров содержимого
            if (
              uiContainerSize &&
              uiContainerSize.contentWidth > 0 &&
              uiContainerSize.contentHeight > 0
            ) {
              width = uiContainerSize.contentWidth;
              height = uiContainerSize.contentHeight;
              foundSize = true;
              break;
            }
          } else {
            // Если это обычный Container без _uiComponent, используем его bounds
            const childBounds = child.getBounds();
            if (childBounds.width > 0 && childBounds.height > 0) {
              width = childBounds.width;
              height = childBounds.height;
              foundSize = true;
              break;
            }
          }
        }
      }

      // Если не нашли размеры через дочерний контейнер, вычисляем из всех дочерних элементов
      if (!foundSize) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        container.list.forEach((child) => {
          let childBounds: Phaser.Geom.Rectangle | null = null;

          if ('getBounds' in child && typeof child.getBounds === 'function') {
            childBounds = (
              child as Phaser.GameObjects.GameObject & { getBounds: () => Phaser.Geom.Rectangle }
            ).getBounds();
          }

          if (childBounds && childBounds.width > 0 && childBounds.height > 0) {
            // Используем центр и размеры для вычисления границ
            const halfWidth = childBounds.width / 2;
            const halfHeight = childBounds.height / 2;
            minX = Math.min(minX, childBounds.x - halfWidth);
            maxX = Math.max(maxX, childBounds.x + halfWidth);
            minY = Math.min(minY, childBounds.y - halfHeight);
            maxY = Math.max(maxY, childBounds.y + halfHeight);
          }
        });

        if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
          width = maxX - minX;
          height = maxY - minY;
        }
      }
    }

    this.addChild(container, width, height, margin);
  }

  /**
   * Удаление дочернего элемента
   */
  removeChild(element: Phaser.GameObjects.GameObject): void {
    const index = this.children.findIndex((child) => child.element === element);
    if (index !== -1) {
      this.children.splice(index, 1);
      this.contentContainer.remove(element);
      this.layout();
    }
  }

  /**
   * Очистка всех дочерних элементов
   */
  clearChildren(): void {
    this.children.forEach((child) => {
      this.contentContainer.remove(child.element);
    });
    this.children = [];
    this.layout();
  }

  /**
   * Пересчет позиций дочерних элементов
   */
  layout(): void {
    // Фильтруем только видимые элементы для layout
    const visibleChildren = this.children.filter((child) => child.visible !== false);

    if (visibleChildren.length === 0) {
      this.computedSize = {
        width: this.style.width ?? 0,
        height: this.style.height ?? 0,
        contentWidth: 0,
        contentHeight: 0,
      };
      return;
    }

    const padding = normalizeSpacing(this.style.padding);

    if (this.direction === 'row') {
      this.layoutRow(padding, visibleChildren);
    } else {
      this.layoutColumn(padding, visibleChildren);
    }

    // Обновляем фон с новыми размерами
    if (this.style.background) {
      this.updateBackground();
    }
  }

  /**
   * Размещение элементов в ряд (row)
   */
  private layoutRow(
    padding: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    },
    visibleChildren: UIContainerChild[] = this.children,
  ): void {
    const pTop = padding.top ?? 0;
    const pRight = padding.right ?? 0;
    const pBottom = padding.bottom ?? 0;
    const pLeft = padding.left ?? 0;
    // Вычисляем общую ширину и максимальную высоту
    let totalWidth = 0;
    let maxHeight = 0;

    visibleChildren.forEach((child, index) => {
      const margin = child.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
      totalWidth += child.width + (margin.left ?? 0) + (margin.right ?? 0);
      if (index < visibleChildren.length - 1) {
        totalWidth += this.gap;
      }
      const childHeight = child.height + (margin.top ?? 0) + (margin.bottom ?? 0);
      if (childHeight > maxHeight) {
        maxHeight = childHeight;
      }
    });

    // Обновляем computed size
    const contentWidth = totalWidth;
    const contentHeight = maxHeight;

    if (this.widthMode === 'content' || this.style.width === undefined) {
      this.style.width = contentWidth + pLeft + pRight;
    }
    if (this.heightMode === 'content' || this.style.height === undefined) {
      this.style.height = contentHeight + pTop + pBottom;
    }

    this.computedSize = {
      width: this.style.width,
      height: this.style.height,
      contentWidth,
      contentHeight,
    };

    // Вычисляем начальную позицию в зависимости от justify
    let startX = -contentWidth / 2;
    const availableWidth = this.style.width - pLeft - pRight;

    switch (this.justify) {
      case 'center':
        startX = -totalWidth / 2;
        break;
      case 'end':
        startX = availableWidth / 2 - totalWidth;
        break;
      case 'start':
      default:
        startX = -availableWidth / 2;
        break;
    }

    // Для space-between и space-around вычисляем дополнительные отступы
    let spacing = this.gap;
    if (this.align === 'space-between' && visibleChildren.length > 1) {
      const totalChildWidth = visibleChildren.reduce((sum, child) => sum + child.width, 0);
      spacing = (availableWidth - totalChildWidth) / (visibleChildren.length - 1);
      startX = -availableWidth / 2;
    } else if (this.align === 'space-around' && visibleChildren.length > 0) {
      const totalChildWidth = visibleChildren.reduce((sum, child) => sum + child.width, 0);
      spacing = (availableWidth - totalChildWidth) / visibleChildren.length;
      startX = -availableWidth / 2 + spacing / 2;
    }

    // Позиционируем элементы
    let currentX = startX;

    visibleChildren.forEach((child) => {
      const margin = child.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
      currentX += margin.left ?? 0;

      // Вычисляем Y позицию в зависимости от align
      let y = 0;
      switch (this.align) {
        case 'center':
          y = 0;
          break;
        case 'end':
          y = (this.style.height! - pTop - pBottom) / 2 - child.height;
          break;
        case 'start':
        default:
          y = -(this.style.height! - pTop - pBottom) / 2;
          break;
      }

      y += ((margin.top ?? 0) - (margin.bottom ?? 0)) / 2;

      if ('setPosition' in child.element && typeof child.element.setPosition === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setPosition: (x: number, y: number) => void;
          }
        ).setPosition(currentX + child.width / 2, y);
      }

      currentX += child.width + (margin.right ?? 0) + spacing;
    });
  }

  /**
   * Размещение элементов в колонку (column)
   */
  private layoutColumn(
    padding: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    },
    visibleChildren: UIContainerChild[] = this.children,
  ): void {
    const pTop = padding.top ?? 0;
    const pRight = padding.right ?? 0;
    const pBottom = padding.bottom ?? 0;
    const pLeft = padding.left ?? 0;
    // Вычисляем максимальную ширину и общую высоту
    let maxWidth = 0;
    let totalHeight = 0;

    visibleChildren.forEach((child, index) => {
      const margin = child.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
      totalHeight += child.height + (margin.top ?? 0) + (margin.bottom ?? 0);
      if (index < visibleChildren.length - 1) {
        totalHeight += this.gap;
      }
      const childWidth = child.width + (margin.left ?? 0) + (margin.right ?? 0);
      if (childWidth > maxWidth) {
        maxWidth = childWidth;
      }
    });

    // Обновляем computed size
    const contentWidth = maxWidth;
    const contentHeight = totalHeight;

    if (this.widthMode === 'content' || this.style.width === undefined) {
      this.style.width = contentWidth + pLeft + pRight;
    }
    if (this.heightMode === 'content' || this.style.height === undefined) {
      this.style.height = contentHeight + pTop + pBottom;
    }

    this.computedSize = {
      width: this.style.width,
      height: this.style.height,
      contentWidth,
      contentHeight,
    };

    // Вычисляем начальную позицию в зависимости от justify
    let startY = -contentHeight / 2;
    const availableHeight = this.style.height - pTop - pBottom;

    switch (this.justify) {
      case 'center':
        startY = -totalHeight / 2;
        break;
      case 'end':
        startY = availableHeight / 2 - totalHeight;
        break;
      case 'start':
      default:
        startY = -availableHeight / 2;
        break;
    }

    // Для space-between и space-around вычисляем дополнительные отступы
    let spacing = this.gap;
    if (this.align === 'space-between' && visibleChildren.length > 1) {
      const totalChildHeight = visibleChildren.reduce((sum, child) => sum + child.height, 0);
      spacing = (availableHeight - totalChildHeight) / (visibleChildren.length - 1);
      startY = -availableHeight / 2;
    } else if (this.align === 'space-around' && visibleChildren.length > 0) {
      const totalChildHeight = visibleChildren.reduce((sum, child) => sum + child.height, 0);
      spacing = (availableHeight - totalChildHeight) / visibleChildren.length;
      startY = -availableHeight / 2 + spacing / 2;
    }

    // Позиционируем элементы
    let currentY = startY;

    visibleChildren.forEach((child) => {
      const margin = child.margin ?? { top: 0, right: 0, bottom: 0, left: 0 };
      currentY += margin.top ?? 0;

      // Вычисляем X позицию в зависимости от align
      let x = 0;
      switch (this.align) {
        case 'center':
          x = 0;
          break;
        case 'end':
          x = (this.style.width! - pLeft - pRight) / 2 - child.width;
          break;
        case 'start':
        default:
          x = -(this.style.width! - pLeft - pRight) / 2;
          break;
      }

      x += ((margin.left ?? 0) - (margin.right ?? 0)) / 2;

      if ('setPosition' in child.element && typeof child.element.setPosition === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setPosition: (x: number, y: number) => void;
          }
        ).setPosition(x, currentY + child.height / 2);
      }

      currentY += child.height + (margin.bottom ?? 0) + spacing;
    });
  }

  /**
   * Изменение направления
   */
  setDirection(direction: UIFlexDirection): void {
    this.direction = direction;
    this.layout();
  }

  /**
   * Изменение выравнивания
   */
  setAlign(align: UIFlexAlign): void {
    this.align = align;
    this.layout();
  }

  /**
   * Изменение justify
   */
  setJustify(justify: UIFlexJustify): void {
    this.justify = justify;
    this.layout();
  }

  /**
   * Изменение gap
   */
  setGap(gap: number): void {
    this.gap = gap;
    this.layout();
  }

  /**
   * Показать дочерний элемент
   * @param element - элемент для показа (Phaser объект или UI компонент)
   */
  showChild(element: Phaser.GameObjects.GameObject | UIBaseComponent | UIComponent): void {
    const phaserElement = this.getPhaserElement(element);
    const child = this.children.find((c) => c.element === phaserElement);
    if (child) {
      child.visible = true;
      if ('setVisible' in child.element && typeof child.element.setVisible === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(true);
      }
      this.layout();
    }
  }

  /**
   * Скрыть дочерний элемент
   * @param element - элемент для скрытия (Phaser объект или UI компонент)
   */
  hideChild(element: Phaser.GameObjects.GameObject | UIBaseComponent | UIComponent): void {
    const phaserElement = this.getPhaserElement(element);
    const child = this.children.find((c) => c.element === phaserElement);
    if (child) {
      child.visible = false;
      if ('setVisible' in child.element && typeof child.element.setVisible === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(false);
      }
      this.layout();
    }
  }

  /**
   * Переключить видимость дочернего элемента (toggle)
   * @param element - элемент для переключения (Phaser объект или UI компонент)
   * @returns новое состояние видимости (true - видим, false - скрыт)
   */
  toggleChild(element: Phaser.GameObjects.GameObject | UIBaseComponent | UIComponent): boolean {
    const phaserElement = this.getPhaserElement(element);
    const child = this.children.find((c) => c.element === phaserElement);
    if (child) {
      const newVisible = !(child.visible !== false);
      child.visible = newVisible;
      if ('setVisible' in child.element && typeof child.element.setVisible === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(newVisible);
      }
      this.layout();
      return newVisible;
    }
    return false;
  }

  /**
   * Проверить, видим ли дочерний элемент
   * @param element - элемент для проверки (Phaser объект или UI компонент)
   * @returns true, если элемент видим, false - если скрыт
   */
  isChildVisible(element: Phaser.GameObjects.GameObject | UIBaseComponent | UIComponent): boolean {
    const phaserElement = this.getPhaserElement(element);
    const child = this.children.find((c) => c.element === phaserElement);
    return child ? child.visible !== false : false;
  }

  /**
   * Вспомогательный метод для получения Phaser элемента из компонента
   */
  private getPhaserElement(
    element: Phaser.GameObjects.GameObject | UIBaseComponent | UIComponent,
  ): Phaser.GameObjects.GameObject {
    if (element instanceof UIBaseComponent || element instanceof UIComponent) {
      return element.getContainer();
    }
    return element;
  }

  /**
   * Показать все дочерние элементы
   */
  showAllChildren(): void {
    this.children.forEach((child) => {
      child.visible = true;
      if ('setVisible' in child.element && typeof child.element.setVisible === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(true);
      }
    });
    this.layout();
  }

  /**
   * Скрыть все дочерние элементы
   */
  hideAllChildren(): void {
    this.children.forEach((child) => {
      child.visible = false;
      if ('setVisible' in child.element && typeof child.element.setVisible === 'function') {
        (
          child.element as Phaser.GameObjects.GameObject & {
            setVisible: (visible: boolean) => void;
          }
        ).setVisible(false);
      }
    });
    this.layout();
  }
}
