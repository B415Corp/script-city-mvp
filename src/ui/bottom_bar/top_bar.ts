import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';
import { ToolCategory, Tool } from '@/modules/tools/types';

/**
 * Верхняя полоса с категориями инструментов и подполосой инструментов.
 * При наведении на категорию показывается подполоса с инструментами НАД верхней полосой.
 *
 * Теги: arch:ui, gameplay:editor, tech:phaser
 */
export class TopBar extends UIComponent {
  // Константы размеров
  readonly TOP_BAR_HEIGHT = 60;
  readonly TOOLS_SUBBAR_HEIGHT = 70;
  readonly BUTTON_MIN_WIDTH = 60;
  readonly BUTTON_MAX_WIDTH = 120;
  readonly BUTTON_HEIGHT = 50;
  readonly BUTTON_PADDING = 8; // Отступы слева и справа от текста для кнопок инструментов
  readonly CATEGORY_BUTTON_MIN_WIDTH = 80;
  readonly CATEGORY_BUTTON_MAX_WIDTH = 150;
  readonly CATEGORY_BUTTON_HEIGHT = 50;
  readonly CATEGORY_BUTTON_PADDING = 12; // Отступы слева и справа от текста для кнопок категорий
  readonly BUTTON_SPACING = 10;

  // Элементы верхней полосы
  private topBarBackground!: Phaser.GameObjects.Rectangle;
  private categoryButtons: Phaser.GameObjects.Container[] = [];
  private toolsSubbarBackground: Phaser.GameObjects.Rectangle | null = null;
  private toolsSubbarContainer: Phaser.GameObjects.Container | null = null;
  private toolButtons: Phaser.GameObjects.Container[] = [];
  private activeCategoryId: string | null = null; // Категория, для которой открыта подполоса
  private cancelToolButton: Phaser.GameObjects.Container | null = null;

  // Позиция верхней полосы (вычисляется относительно высоты экрана)
  private topBarY: number = 0;
  private bottomBarHeight: number = 80;

  constructor(scene: Phaser.Scene, core: GameCore, bottomBarHeight: number) {
    super(scene, core);
    this.bottomBarHeight = bottomBarHeight;
  }

  create(): void {
    const { width, height } = this.scene.scale;
    this.topBarY = height - this.bottomBarHeight - this.TOP_BAR_HEIGHT;

    // Создаём контейнер
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    // Создаём верхнюю полосу
    this.createTopBar(width);

    // Подписка на события
    this.subscribeToEvents();
  }

  private createTopBar(width: number): void {
    // Фон верхней полосы
    this.topBarBackground = this.scene.add.rectangle(
      width / 2,
      this.topBarY + this.TOP_BAR_HEIGHT / 2,
      width,
      this.TOP_BAR_HEIGHT,
      0x2d2d2d,
      0.95,
    );
    this.container.add(this.topBarBackground);

    // Создаём кнопки категорий инструментов
    this.createCategoryButtons();

    // Создаём кнопку отмены инструмента (скрыта по умолчанию)
    this.createCancelToolButton(width);
  }

  private createCategoryButtons(): void {
    const toolManager = this.core.getToolManager();
    const categories = toolManager.getCategories();

    const { width } = this.scene.scale;
    const startX = 20;
    // Учитываем место для кнопки отмены инструмента: отступ справа + минимальная ширина кнопки + отступ между
    const rightMargin = 20 + this.CATEGORY_BUTTON_MIN_WIDTH + 20;
    let currentX = startX;
    let currentY = this.topBarY + this.TOP_BAR_HEIGHT / 2;
    const rowHeight = this.CATEGORY_BUTTON_HEIGHT + this.BUTTON_SPACING;

    categories.forEach((category) => {
      // Вычисляем ширину кнопки на основе текста
      const buttonWidth = this.calculateCategoryButtonWidth(category.name);

      // Проверяем, чтобы кнопки не выходили за правый край экрана (с учетом кнопки отмены)
      if (currentX + buttonWidth > width - rightMargin) {
        // Переносим на новую строку, если есть место по вертикали
        const newY = currentY - rowHeight;
        if (newY >= this.topBarY - this.TOP_BAR_HEIGHT / 2 + this.CATEGORY_BUTTON_HEIGHT / 2) {
          currentX = startX;
          currentY = newY;
        } else {
          // Если нет места для новой строки, прекращаем создание кнопок
          return;
        }
      }

      const button = this.createCategoryButton(currentX, currentY, category, buttonWidth);
      this.categoryButtons.push(button);
      this.container.add(button);

      currentX += buttonWidth + this.BUTTON_SPACING;
    });
  }

  /**
   * Вычисляет ширину кнопки категории на основе текста.
   * Учитывает минимальную и максимальную ширину для единообразия.
   */
  private calculateCategoryButtonWidth(text: string): number {
    // Создаем временный текст для измерения ширины
    const tempText = this.scene.add.text(0, 0, text, {
      fontSize: '12px',
      fontFamily: 'Arial',
    });
    const textWidth = tempText.width;
    tempText.destroy();

    // Вычисляем ширину с учетом отступов
    const buttonWidth = textWidth + this.CATEGORY_BUTTON_PADDING * 2;

    // Ограничиваем минимальной и максимальной шириной
    return Math.max(
      this.CATEGORY_BUTTON_MIN_WIDTH,
      Math.min(buttonWidth, this.CATEGORY_BUTTON_MAX_WIDTH),
    );
  }

  /**
   * Вычисляет ширину кнопки инструмента на основе текста.
   * Учитывает минимальную и максимальную ширину для единообразия.
   */
  private calculateToolButtonWidth(text: string): number {
    // Создаем временный текст для измерения ширины
    const tempText = this.scene.add.text(0, 0, text, {
      fontSize: '10px',
      fontFamily: 'Arial',
    });
    const textWidth = tempText.width;
    tempText.destroy();

    // Вычисляем ширину с учетом отступов
    const buttonWidth = textWidth + this.BUTTON_PADDING * 2;

    // Ограничиваем минимальной и максимальной шириной
    return Math.max(this.BUTTON_MIN_WIDTH, Math.min(buttonWidth, this.BUTTON_MAX_WIDTH));
  }

  private createCategoryButton(
    x: number,
    y: number,
    category: ToolCategory,
    buttonWidth: number,
  ): Phaser.GameObjects.Container {
    // Позиционируем контейнер так, чтобы центр кнопки был в указанной позиции
    const container = this.scene.add.container(
      x + buttonWidth / 2,
      y,
    ) as Phaser.GameObjects.Container & {
      categoryId?: string;
    };
    // Сохраняем categoryId в данных контейнера для последующего использования
    container.categoryId = category.id;

    // Фон кнопки (отцентрован в контейнере)
    const bg = this.scene.add.rectangle(
      0,
      0,
      buttonWidth,
      this.CATEGORY_BUTTON_HEIGHT,
      0x404040,
      1,
    );

    // Иконка категории (отцентрована по горизонтали, смещена вверх)
    const icon = this.scene.add
      .text(0, -8, category.icon, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    // Название категории (отцентровано по горизонтали, смещено вниз)
    // Обрезаем текст если он не помещается в кнопку
    const maxTextWidth = buttonWidth - this.CATEGORY_BUTTON_PADDING * 2;
    let displayText = category.name;
    const tempText = this.scene.add.text(0, 0, displayText, {
      fontSize: '12px',
      fontFamily: 'Arial',
    });
    if (tempText.width > maxTextWidth) {
      // Обрезаем текст с многоточием
      while (tempText.width > maxTextWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
        tempText.setText(displayText + '...');
      }
      displayText = displayText + '...';
    }
    tempText.destroy();

    const label = this.scene.add
      .text(0, 12, displayText, {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    container.add([bg, icon, label]);

    // Делаем интерактивным
    bg.setInteractive({ useHandCursor: true });
    icon.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });

    // Обработчики событий
    const handlePointerOver = (): void => {
      bg.setFillStyle(0x4a90e2);
    };

    const handlePointerOut = (): void => {
      // Если категория активна (подполоса открыта), подсвечиваем её
      bg.setFillStyle(this.activeCategoryId === category.id ? 0x4a90e2 : 0x404040);
    };

    const handlePointerDown = (): void => {
      // Переключаем подполосу: если уже открыта для этой категории - закрываем, иначе открываем
      if (this.activeCategoryId === category.id) {
        this.hideToolsSubbar();
      } else {
        this.showToolsSubbar(category);
      }
    };

    bg.on('pointerover', handlePointerOver);
    bg.on('pointerout', handlePointerOut);
    bg.on('pointerdown', handlePointerDown);

    icon.on('pointerover', handlePointerOver);
    icon.on('pointerout', handlePointerOut);
    icon.on('pointerdown', handlePointerDown);

    label.on('pointerover', handlePointerOver);
    label.on('pointerout', handlePointerOut);
    label.on('pointerdown', handlePointerDown);

    return container;
  }

  private showToolsSubbar(category: ToolCategory): void {
    // Обновляем активную категорию
    this.activeCategoryId = category.id;

    // Обновляем визуальное состояние кнопок категорий
    this.updateCategoryButtonsDisplay();

    const { width } = this.scene.scale;
    const toolsSubbarY = Math.max(0, this.topBarY - this.TOOLS_SUBBAR_HEIGHT);

    // Создаём подполосу только если её еще нет
    if (!this.toolsSubbarBackground) {
      this.toolsSubbarBackground = this.scene.add.rectangle(
        width / 2,
        toolsSubbarY + this.TOOLS_SUBBAR_HEIGHT / 2,
        width,
        this.TOOLS_SUBBAR_HEIGHT,
        0x3a3a3a,
        0.95,
      );
      this.container.add(this.toolsSubbarBackground);
    } else {
      // Обновляем позицию если уже существует
      this.toolsSubbarBackground.setPosition(
        width / 2,
        toolsSubbarY + this.TOOLS_SUBBAR_HEIGHT / 2,
      );
      this.toolsSubbarBackground.setVisible(true);
    }

    if (!this.toolsSubbarContainer) {
      this.toolsSubbarContainer = this.scene.add.container(0, toolsSubbarY);
      this.container.add(this.toolsSubbarContainer);
    } else {
      this.toolsSubbarContainer.setPosition(0, toolsSubbarY);
      this.toolsSubbarContainer.setVisible(true);
    }

    // Очищаем предыдущие кнопки инструментов
    this.toolButtons.forEach((btn) => btn.destroy());
    this.toolButtons = [];

    // Создаём кнопки инструментов с проверкой границ и поддержкой переноса на новую строку
    const startX = 20;
    const rightMargin = 20;
    const centerY = this.TOOLS_SUBBAR_HEIGHT / 2; // Центр подполосы по вертикали
    let currentX = startX;
    let currentY = centerY;
    const rowHeight = this.BUTTON_HEIGHT + this.BUTTON_SPACING;
    const maxRows = Math.floor(this.TOOLS_SUBBAR_HEIGHT / rowHeight);
    let currentRow = 0;

    category.tools.forEach((tool) => {
      // Вычисляем ширину кнопки на основе текста
      const buttonWidth = this.calculateToolButtonWidth(tool.name);

      // Проверяем, чтобы кнопки не выходили за правый край экрана
      if (currentX + buttonWidth > width - rightMargin) {
        // Переносим на новую строку, если есть место
        currentRow++;
        if (currentRow >= maxRows) {
          // Если нет места для новой строки, прекращаем создание кнопок
          return;
        }
        currentX = startX;
        currentY = centerY - currentRow * rowHeight;
      }

      const button = this.createToolButton(currentX, currentY, tool, buttonWidth);
      this.toolButtons.push(button);
      if (this.toolsSubbarContainer) {
        this.toolsSubbarContainer.add(button);
      }

      currentX += buttonWidth + this.BUTTON_SPACING;
    });
  }

  private hideToolsSubbar(): void {
    // Сбрасываем активную категорию
    this.activeCategoryId = null;

    // Обновляем визуальное состояние кнопок категорий
    this.updateCategoryButtonsDisplay();

    if (this.toolsSubbarBackground) {
      this.toolsSubbarBackground.setVisible(false);
    }
    if (this.toolsSubbarContainer) {
      this.toolsSubbarContainer.setVisible(false);
    }

    // Уничтожаем кнопки инструментов
    this.toolButtons.forEach((btn) => btn.destroy());
    this.toolButtons = [];

    // Уничтожаем подполосу полностью
    if (this.toolsSubbarBackground) {
      this.toolsSubbarBackground.destroy();
      this.toolsSubbarBackground = null;
    }
    if (this.toolsSubbarContainer) {
      this.toolsSubbarContainer.destroy();
      this.toolsSubbarContainer = null;
    }
  }

  private createToolButton(
    x: number,
    y: number,
    tool: Tool,
    buttonWidth: number,
  ): Phaser.GameObjects.Container {
    // Позиционируем контейнер так, чтобы центр кнопки был в указанной позиции
    const container = this.scene.add.container(
      x + buttonWidth / 2,
      y,
    ) as Phaser.GameObjects.Container & {
      toolId?: string;
    };
    // Сохраняем toolId в данных контейнера для последующего использования
    container.toolId = tool.id;

    // Фон кнопки (отцентрован в контейнере)
    const bg = this.scene.add.rectangle(0, 0, buttonWidth, this.BUTTON_HEIGHT, 0x505050, 1);

    // Иконка инструмента (отцентрована по горизонтали, смещена вверх)
    const icon = this.scene.add
      .text(0, -5, tool.icon, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    // Название инструмента (отцентровано по горизонтали, смещено вниз)
    // Обрезаем текст если он не помещается в кнопку
    const maxTextWidth = buttonWidth - this.BUTTON_PADDING * 2;
    let displayText = tool.name;
    const tempText = this.scene.add.text(0, 0, displayText, {
      fontSize: '10px',
      fontFamily: 'Arial',
    });
    if (tempText.width > maxTextWidth) {
      // Обрезаем текст с многоточием
      while (tempText.width > maxTextWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
        tempText.setText(displayText + '...');
      }
      displayText = displayText + '...';
    }
    tempText.destroy();

    const label = this.scene.add
      .text(0, 15, displayText, {
        fontSize: '10px',
        color: '#cccccc',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    container.add([bg, icon, label]);

    // Делаем интерактивным
    bg.setInteractive({ useHandCursor: true });
    icon.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });

    // Обработчики событий
    const handlePointerOver = (): void => {
      bg.setFillStyle(0x5aa0f2);
    };

    const handlePointerOut = (): void => {
      const toolManager = this.core.getToolManager();
      const isActive = toolManager.isToolActive(tool.id);
      bg.setFillStyle(isActive ? 0x4a90e2 : 0x505050);
    };

    const handlePointerDown = (): void => {
      this.activateTool(tool.id);
      // После выбора инструмента можно оставить меню открытым
      // для последовательного выбора нескольких инструментов
    };

    bg.on('pointerover', handlePointerOver);
    bg.on('pointerout', handlePointerOut);
    bg.on('pointerdown', handlePointerDown);

    icon.on('pointerover', handlePointerOver);
    icon.on('pointerout', handlePointerOut);
    icon.on('pointerdown', handlePointerDown);

    label.on('pointerover', handlePointerOver);
    label.on('pointerout', handlePointerOut);
    label.on('pointerdown', handlePointerDown);

    // Обновляем состояние при создании
    const toolManager = this.core.getToolManager();
    const isActive = toolManager.isToolActive(tool.id);
    bg.setFillStyle(isActive ? 0x4a90e2 : 0x505050);

    return container;
  }

  private activateTool(toolId: string): void {
    const toolManager = this.core.getToolManager();
    toolManager.activateTool(toolId);

    // Обновляем визуальное состояние всех кнопок инструментов
    this.updateToolButtonsDisplay();
  }

  private updateToolButtonsDisplay(): void {
    const toolManager = this.core.getToolManager();

    this.toolButtons.forEach((buttonContainer) => {
      const bg = buttonContainer.list[0] as Phaser.GameObjects.Rectangle;
      if (!bg) return;

      // Получаем toolId из данных контейнера
      const toolId = (buttonContainer as Phaser.GameObjects.Container & { toolId?: string }).toolId;
      if (!toolId) return;

      const isActive = toolManager.isToolActive(toolId);
      bg.setFillStyle(isActive ? 0x4a90e2 : 0x505050);
    });

    // Обновляем видимость кнопки отмены инструмента
    this.updateCancelToolButtonVisibility();
  }

  /**
   * Обновление визуального состояния кнопок категорий.
   */
  private updateCategoryButtonsDisplay(): void {
    this.categoryButtons.forEach((buttonContainer) => {
      const bg = buttonContainer.list[0] as Phaser.GameObjects.Rectangle;
      if (!bg) return;

      // Получаем categoryId из данных контейнера
      const categoryId = (buttonContainer as Phaser.GameObjects.Container & { categoryId?: string })
        .categoryId;
      if (!categoryId) return;

      // Подсвечиваем активную категорию
      bg.setFillStyle(categoryId === this.activeCategoryId ? 0x4a90e2 : 0x404040);
    });
  }

  /**
   * Создание кнопки отмены инструмента.
   * Кнопка показывается только когда есть активный инструмент.
   */
  private createCancelToolButton(width: number): void {
    const buttonX = width - 20 - this.CATEGORY_BUTTON_MIN_WIDTH / 2; // Справа с отступом
    const buttonY = this.topBarY + this.TOP_BAR_HEIGHT / 2;

    const container = this.scene.add.container(buttonX, buttonY);

    // Фон кнопки
    const bg = this.scene.add.rectangle(
      0,
      0,
      this.CATEGORY_BUTTON_MIN_WIDTH,
      this.CATEGORY_BUTTON_HEIGHT,
      0xdc2626, // Красный цвет для кнопки отмены
      1,
    );

    // Иконка отмены (крестик)
    const icon = this.scene.add
      .text(0, -8, '✕', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    // Надпись "Отмена"
    const label = this.scene.add
      .text(0, 12, 'Отмена', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    container.add([bg, icon, label]);

    // Делаем интерактивным
    bg.setInteractive({ useHandCursor: true });
    icon.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });

    // Обработчики событий
    const handlePointerOver = (): void => {
      bg.setFillStyle(0xf87171); // Светло-красный при наведении
    };

    const handlePointerOut = (): void => {
      bg.setFillStyle(0xdc2626); // Возвращаем красный цвет
    };

    const handlePointerDown = (): void => {
      this.deactivateTool();
    };

    bg.on('pointerover', handlePointerOver);
    bg.on('pointerout', handlePointerOut);
    bg.on('pointerdown', handlePointerDown);

    icon.on('pointerover', handlePointerOver);
    icon.on('pointerout', handlePointerOut);
    icon.on('pointerdown', handlePointerDown);

    label.on('pointerover', handlePointerOver);
    label.on('pointerout', handlePointerOut);
    label.on('pointerdown', handlePointerDown);

    this.cancelToolButton = container;
    this.container.add(container);

    // Изначально скрываем кнопку
    this.updateCancelToolButtonVisibility();
  }

  /**
   * Обновление видимости кнопки отмены инструмента.
   * Кнопка показывается только когда есть активный инструмент.
   */
  private updateCancelToolButtonVisibility(): void {
    if (!this.cancelToolButton) {
      return;
    }

    const toolManager = this.core.getToolManager();
    const activeTool = toolManager.getActiveTool();
    const hasActiveTool = activeTool.toolId !== null;

    this.cancelToolButton.setVisible(hasActiveTool);
  }

  /**
   * Деактивация текущего активного инструмента.
   */
  private deactivateTool(): void {
    const toolManager = this.core.getToolManager();
    toolManager.deactivateTool();

    // Обновляем визуальное состояние всех кнопок инструментов
    this.updateToolButtonsDisplay();
  }

  /**
   * Проверка, видима ли подполоса инструментов.
   */
  isSubbarVisible(): boolean {
    return (
      this.activeCategoryId !== null &&
      this.toolsSubbarBackground !== null &&
      this.toolsSubbarBackground.visible
    );
  }

  /**
   * Публичный метод для закрытия подполосы инструментов (используется из bottom_bar).
   */
  public closeSubbar(): void {
    this.hideToolsSubbar();
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на события инструментов
    eventBus.on<{ toolId: string; categoryId: string }>(Events.ToolActivated, () => {
      this.updateToolButtonsDisplay();
      this.updateCancelToolButtonVisibility();
    });

    eventBus.on<{ toolId: string; categoryId: string }>(Events.ToolDeactivated, () => {
      this.updateToolButtonsDisplay();
      this.updateCancelToolButtonVisibility();
    });
  }

  resize(width: number, height: number): void {
    this.topBarY = height - this.bottomBarHeight - this.TOP_BAR_HEIGHT;

    // Обновление верхней полосы
    this.topBarBackground.setSize(width, this.TOP_BAR_HEIGHT);
    this.topBarBackground.setPosition(width / 2, this.topBarY + this.TOP_BAR_HEIGHT / 2);

    // Пересоздаём кнопки категорий с учетом нового размера экрана
    this.categoryButtons.forEach((btn) => btn.destroy());
    this.categoryButtons = [];
    this.createCategoryButtons();

    // Обновляем позицию кнопки отмены инструмента
    if (this.cancelToolButton) {
      const buttonX = width - 20 - this.CATEGORY_BUTTON_MIN_WIDTH / 2;
      const buttonY = this.topBarY + this.TOP_BAR_HEIGHT / 2;
      this.cancelToolButton.setPosition(buttonX, buttonY);
    }

    // Обновление подполосы инструментов (если она видна)
    if (this.toolsSubbarBackground && this.toolsSubbarContainer) {
      const toolsSubbarY = Math.max(0, this.topBarY - this.TOOLS_SUBBAR_HEIGHT);
      this.toolsSubbarBackground.setSize(width, this.TOOLS_SUBBAR_HEIGHT);
      this.toolsSubbarBackground.setPosition(
        width / 2,
        toolsSubbarY + this.TOOLS_SUBBAR_HEIGHT / 2,
      );
      this.toolsSubbarContainer.setPosition(0, toolsSubbarY);

      // Пересоздаём кнопки инструментов с учетом нового размера экрана
      const activeCategory = this.activeCategoryId
        ? this.core.getToolManager().getCategory(this.activeCategoryId)
        : null;
      if (activeCategory) {
        // Очищаем старые кнопки
        this.toolButtons.forEach((btn) => btn.destroy());
        this.toolButtons = [];

        // Создаём новые кнопки с проверкой границ и поддержкой переноса на новую строку
        const startX = 20;
        const rightMargin = 20;
        const centerY = this.TOOLS_SUBBAR_HEIGHT / 2;
        let currentX = startX;
        let currentY = centerY;
        const rowHeight = this.BUTTON_HEIGHT + this.BUTTON_SPACING;
        const maxRows = Math.floor(this.TOOLS_SUBBAR_HEIGHT / rowHeight);
        let currentRow = 0;

        activeCategory.tools.forEach((tool) => {
          // Вычисляем ширину кнопки на основе текста
          const buttonWidth = this.calculateToolButtonWidth(tool.name);

          if (currentX + buttonWidth > width - rightMargin) {
            // Переносим на новую строку, если есть место
            currentRow++;
            if (currentRow >= maxRows) {
              // Если нет места для новой строки, прекращаем создание кнопок
              return;
            }
            currentX = startX;
            currentY = centerY - currentRow * rowHeight;
          }

          const button = this.createToolButton(currentX, currentY, tool, buttonWidth);
          this.toolButtons.push(button);
          if (this.toolsSubbarContainer) {
            this.toolsSubbarContainer.add(button);
          }

          currentX += buttonWidth + this.BUTTON_SPACING;
        });
      }
    }
  }

  destroy(): void {
    // Уничтожаем подполосу инструментов если она существует
    this.hideToolsSubbar();

    // Уничтожаем кнопку отмены инструмента
    if (this.cancelToolButton) {
      this.cancelToolButton.destroy();
      this.cancelToolButton = null;
    }

    super.destroy();
  }
}
