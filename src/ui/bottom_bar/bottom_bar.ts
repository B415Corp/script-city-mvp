import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';
import { ToolCategory, Tool } from '@/modules/tools/types';
import { SpeedControls } from '@/ui/speed_controls/speed_controls';

/**
 * Нижняя панель управления (в стиле Cities: Skylines)
 * Состоит из двух полос:
 * - Верхняя полоса: категории инструментов (при наведении показывается подполоса с инструментами НАД верхней полосой)
 * - Нижняя полоса: управление скоростью (первым), игровое время, статистика города
 *
 * Теги: arch:ui, gameplay:time-control, gameplay:editor, tech:phaser
 */
export class BottomBar extends UIComponent {
  // Константы размеров
  private readonly TOP_BAR_HEIGHT = 60;
  private readonly BOTTOM_BAR_HEIGHT = 80;
  private readonly TOOLS_SUBBAR_HEIGHT = 70;
  private readonly BUTTON_WIDTH = 60;
  private readonly BUTTON_HEIGHT = 50;
  private readonly CATEGORY_BUTTON_WIDTH = 80;
  private readonly CATEGORY_BUTTON_HEIGHT = 50;
  private readonly BUTTON_SPACING = 10;

  // Элементы верхней полосы (инструменты)
  private topBarBackground!: Phaser.GameObjects.Rectangle;
  private categoryButtons: Phaser.GameObjects.Container[] = [];
  private toolsSubbarBackground: Phaser.GameObjects.Rectangle | null = null;
  private toolsSubbarContainer: Phaser.GameObjects.Container | null = null;
  private toolButtons: Phaser.GameObjects.Container[] = [];
  private hoveredCategoryId: string | null = null;
  private hideSubbarTimeout: number | null = null;
  private isMouseOverSubbar: boolean = false;

  // Элементы нижней полосы (управление и статистика)
  private bottomBarBackground!: Phaser.GameObjects.Rectangle;
  private speedControls!: SpeedControls;

  // Элементы статистики
  private gameTimeText!: Phaser.GameObjects.Text;
  private cityNameText!: Phaser.GameObjects.Text;
  private financesText!: Phaser.GameObjects.Text;
  private populationText!: Phaser.GameObjects.Text;

  // Моковые данные
  private mockCityName = 'Новый Город';
  private mockFinances = 50000;
  private mockPopulation = 0;
  private gameDate = { year: 2024, month: 1, day: 1 };
  private tickCount = 0; // Счетчик тиков для обновления даты

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    const { width, height } = this.scene.scale;

    // Создаём контейнер с depth для панелей
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    // Создаём верхнюю полосу (инструменты)
    this.createTopBar(width, height);

    // Создаём нижнюю полосу (управление и статистика)
    this.createBottomBar(width, height);

    // Подписка на события
    this.subscribeToEvents();

    // Установка начального состояния
    this.updateStatistics();
  }

  private createTopBar(width: number, height: number): void {
    const topBarY = height - this.BOTTOM_BAR_HEIGHT - this.TOP_BAR_HEIGHT;

    // Фон верхней полосы
    this.topBarBackground = this.scene.add.rectangle(
      width / 2,
      topBarY + this.TOP_BAR_HEIGHT / 2,
      width,
      this.TOP_BAR_HEIGHT,
      0x2d2d2d,
      0.95,
    );
    this.container.add(this.topBarBackground);

    // Подполоса для инструментов создается только при показе (не создаем заранее)

    // Создаём кнопки категорий инструментов
    this.createCategoryButtons(topBarY);
  }

  private createCategoryButtons(topBarY: number): void {
    const toolManager = this.core.getToolManager();
    const categories = toolManager.getCategories();

    const { width } = this.scene.scale;
    const startX = 20;
    const rightMargin = 20; // Отступ от правого края
    let currentX = startX;

    categories.forEach((category) => {
      // Проверяем, чтобы кнопки не выходили за правый край экрана
      if (currentX + this.CATEGORY_BUTTON_WIDTH > width - rightMargin) {
        return; // Прекращаем создание кнопок, если они выходят за экран
      }

      const button = this.createCategoryButton(
        currentX,
        topBarY + this.TOP_BAR_HEIGHT / 2,
        category,
      );
      this.categoryButtons.push(button);
      this.container.add(button);

      currentX += this.CATEGORY_BUTTON_WIDTH + this.BUTTON_SPACING;
    });
  }

  private createCategoryButton(
    x: number,
    y: number,
    category: ToolCategory,
  ): Phaser.GameObjects.Container {
    // Позиционируем контейнер так, чтобы центр кнопки был в указанной позиции
    const container = this.scene.add.container(x + this.CATEGORY_BUTTON_WIDTH / 2, y);

    // Фон кнопки (отцентрован в контейнере)
    const bg = this.scene.add.rectangle(
      0,
      0,
      this.CATEGORY_BUTTON_WIDTH,
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
    const label = this.scene.add
      .text(0, 12, category.name, {
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
      // Отменяем скрытие подполосы, если оно было запланировано
      this.cancelHideSubbar();
      // Показываем подполосу для этой категории
      this.showToolsSubbar(category);
    };

    const handlePointerOut = (): void => {
      bg.setFillStyle(0x404040);
      // Сбрасываем hoveredCategoryId только если это была активная категория
      // Если мышка перейдет на подполосу или другую категорию, hoveredCategoryId будет обновлен
      if (this.hoveredCategoryId === category.id) {
        this.hoveredCategoryId = null;
      }
      // Начинаем отсчет задержки скрытия подполосы
      // Если мышка перейдет на подполосу или другую категорию, таймер будет отменен
      this.scheduleHideSubbar();
    };

    const handlePointerDown = (): void => {
      // При клике на категорию можно активировать первый инструмент или просто показать подполосу
      if (category.tools.length > 0) {
        const firstTool = category.tools[0];
        this.activateTool(firstTool.id);
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
    // Отменяем таймер скрытия, если он был запущен
    this.cancelHideSubbar();

    // Обновляем активную категорию
    this.hoveredCategoryId = category.id;

    const { width, height } = this.scene.scale;
    const topBarY = height - this.BOTTOM_BAR_HEIGHT - this.TOP_BAR_HEIGHT;
    const toolsSubbarY = Math.max(0, topBarY - this.TOOLS_SUBBAR_HEIGHT);

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

    // Создаём кнопки инструментов с проверкой границ
    const startX = 20;
    const rightMargin = 20;
    const centerY = this.TOOLS_SUBBAR_HEIGHT / 2; // Центр подполосы по вертикали
    let currentX = startX;

    category.tools.forEach((tool) => {
      // Проверяем, чтобы кнопки не выходили за правый край экрана
      if (currentX + this.BUTTON_WIDTH > width - rightMargin) {
        return;
      }

      const button = this.createToolButton(currentX, centerY, tool);
      this.toolButtons.push(button);
      if (this.toolsSubbarContainer) {
        this.toolsSubbarContainer.add(button);
      }

      currentX += this.BUTTON_WIDTH + this.BUTTON_SPACING;
    });

    // Настраиваем интерактивность для фона и контейнера подполосы
    // Это позволит отслеживать, когда курсор находится в пределах подполосы
    this.toolsSubbarBackground.setInteractive();
    this.toolsSubbarContainer.setInteractive();

    // Подписываемся на события мыши для скрытия подполосы при уходе курсора
    this.setupSubbarHoverHandlers();
  }

  private setupSubbarHoverHandlers(): void {
    if (!this.toolsSubbarBackground || !this.toolsSubbarContainer) {
      return;
    }

    // Очищаем предыдущие обработчики
    this.toolsSubbarBackground.removeAllListeners();
    this.toolsSubbarContainer.removeAllListeners();

    // Обработчики для показа подполосы при наведении на неё
    const handleSubbarPointerOver = (): void => {
      // Мышка наведена на подполосу - отменяем скрытие
      this.isMouseOverSubbar = true;
      this.cancelHideSubbar();
    };

    // Скрываем подполосу при уходе курсора (с задержкой)
    const handleSubbarPointerOut = (): void => {
      // Мышка ушла с подполосы (фон или контейнер)
      // Сбрасываем флаг и запускаем таймер скрытия
      // Если мышка вернется на любой элемент подполосы (включая кнопки),
      // флаг установится обратно и таймер отменится
      this.isMouseOverSubbar = false;
      this.scheduleHideSubbar();
    };

    this.toolsSubbarBackground.on('pointerover', handleSubbarPointerOver);
    this.toolsSubbarContainer.on('pointerover', handleSubbarPointerOver);
    this.toolsSubbarBackground.on('pointerout', handleSubbarPointerOut);
    this.toolsSubbarContainer.on('pointerout', handleSubbarPointerOut);
  }

  /**
   * Запланировать скрытие подполосы с задержкой.
   * Если мышка вернется на категорию или подполосу, таймер будет отменен.
   *
   * Следуем лучшим практикам UX для выпадающих меню:
   * - Задержка перед закрытием (300ms)
   * - Меню остается открытым пока курсор над ним или над триггером
   * - Меню закрывается только когда курсор ушел и с триггера, и с самого меню
   */
  private scheduleHideSubbar(): void {
    // Отменяем предыдущий таймер, если он был
    this.cancelHideSubbar();

    // Устанавливаем новый таймер с задержкой для комфортной навигации
    this.hideSubbarTimeout = window.setTimeout(() => {
      // Проверяем, что мышка действительно ушла и с категории, и с подполосы (включая кнопки)
      if (!this.isMouseOverSubbar && this.hoveredCategoryId === null) {
        this.hideToolsSubbar();
      }
      this.hideSubbarTimeout = null;
    }, 300) as unknown as number; // 300ms - стандартная задержка для выпадающих меню
  }

  /**
   * Отменить запланированное скрытие подполосы.
   */
  private cancelHideSubbar(): void {
    if (this.hideSubbarTimeout !== null) {
      window.clearTimeout(this.hideSubbarTimeout);
      this.hideSubbarTimeout = null;
    }
  }

  private hideToolsSubbar(): void {
    // Отменяем таймер скрытия
    this.cancelHideSubbar();

    // Сбрасываем флаги
    this.hoveredCategoryId = null;
    this.isMouseOverSubbar = false;

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

  private createToolButton(x: number, y: number, tool: Tool): Phaser.GameObjects.Container {
    // Позиционируем контейнер так, чтобы центр кнопки был в указанной позиции
    const container = this.scene.add.container(
      x + this.BUTTON_WIDTH / 2,
      y,
    ) as Phaser.GameObjects.Container & {
      toolId?: string;
    };
    // Сохраняем toolId в данных контейнера для последующего использования
    container.toolId = tool.id;

    // Фон кнопки (отцентрован в контейнере)
    const bg = this.scene.add.rectangle(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 0x505050, 1);

    // Иконка инструмента (отцентрована по горизонтали, смещена вверх)
    const icon = this.scene.add
      .text(0, -5, tool.icon, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0.5);

    // Название инструмента (отцентровано по горизонтали, смещено вниз)
    const label = this.scene.add
      .text(0, 15, tool.name, {
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
      // Важно: мышка над кнопкой инструмента - отменяем скрытие меню
      this.isMouseOverSubbar = true;
      this.cancelHideSubbar();
    };

    const handlePointerOut = (): void => {
      const toolManager = this.core.getToolManager();
      const isActive = toolManager.isToolActive(tool.id);
      bg.setFillStyle(isActive ? 0x4a90e2 : 0x505050);
      // Мышка ушла с кнопки - сбрасываем флаг
      // Если мышка не перейдет на другой элемент подполосы, таймер скрытия запустится
      this.isMouseOverSubbar = false;
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
  }

  private createBottomBar(width: number, height: number): void {
    const bottomBarY = height - this.BOTTOM_BAR_HEIGHT;

    // Фон нижней полосы
    this.bottomBarBackground = this.scene.add.rectangle(
      width / 2,
      bottomBarY + this.BOTTOM_BAR_HEIGHT / 2,
      width,
      this.BOTTOM_BAR_HEIGHT,
      0x1a1a1a,
      0.95,
    );
    this.container.add(this.bottomBarBackground);

    // Создаём компонент управления скоростью (монолитная конструкция)
    this.speedControls = new SpeedControls(this.scene, this.core);
    this.speedControls.create();

    // Позиционируем кнопки скорости первыми (слева)
    // Учитываем, что элементы в SpeedControls теперь позиционируются относительно левого края контейнера
    const speedControlsX = 20;
    const speedControlsY = bottomBarY + this.BOTTOM_BAR_HEIGHT / 2;
    this.speedControls.setPosition(speedControlsX, speedControlsY);

    // Элементы статистики (после кнопок скорости)
    // Позиция после кнопок скорости = начальная позиция + ширина кнопок + отступ
    const statisticsStartX = speedControlsX + this.speedControls.getWidth() + 30;
    this.createStatisticsElements(width, bottomBarY, statisticsStartX);
  }

  private createStatisticsElements(_width: number, barY: number, startX: number = 20): void {
    const spacing = 30;
    let currentX = startX;

    // Игровое время
    this.gameTimeText = this.scene.add
      .text(currentX, barY + this.BOTTOM_BAR_HEIGHT / 2, '2024-01-01', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.gameTimeText);
    currentX += this.gameTimeText.width + spacing;

    // Название города
    this.cityNameText = this.scene.add
      .text(currentX, barY + this.BOTTOM_BAR_HEIGHT / 2, this.mockCityName, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.cityNameText);
    currentX += this.cityNameText.width + spacing;

    // Финансы
    this.financesText = this.scene.add
      .text(
        currentX,
        barY + this.BOTTOM_BAR_HEIGHT / 2,
        `💰 ${this.formatMoney(this.mockFinances)}`,
        {
          fontSize: '16px',
          color: '#4ade80',
          fontFamily: 'Arial',
        },
      )
      .setOrigin(0, 0.5);
    this.container.add(this.financesText);
    currentX += this.financesText.width + spacing;

    // Население
    this.populationText = this.scene.add
      .text(
        currentX,
        barY + this.BOTTOM_BAR_HEIGHT / 2,
        `👥 ${this.formatPopulation(this.mockPopulation)}`,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
        },
      )
      .setOrigin(0, 0.5);
    this.container.add(this.populationText);
  }

  private formatMoney(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  }

  private formatPopulation(population: number): string {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    if (population >= 1000) {
      return `${(population / 1000).toFixed(1)}K`;
    }
    return `${population}`;
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на события инструментов
    eventBus.on<{ toolId: string; categoryId: string }>(Events.ToolActivated, () => {
      this.updateToolButtonsDisplay();
    });

    eventBus.on<{ toolId: string; categoryId: string }>(Events.ToolDeactivated, () => {
      this.updateToolButtonsDisplay();
    });

    // Подписка на тики для обновления даты
    eventBus.on(Events.TickEnded, () => {
      this.tickCount++;
      // Обновляем дату каждые 100 тиков
      if (this.tickCount >= 100) {
        this.tickCount = 0;
        this.incrementDate();
        this.updateStatistics();
      }
    });
  }

  private incrementDate(): void {
    // Увеличиваем день
    this.gameDate.day++;

    // Проверяем количество дней в месяце (упрощенная логика - 30 дней в каждом месяце)
    if (this.gameDate.day > 30) {
      this.gameDate.day = 1;
      this.gameDate.month++;

      // Проверяем количество месяцев
      if (this.gameDate.month > 12) {
        this.gameDate.month = 1;
        this.gameDate.year++;
      }
    }
  }

  private updateStatistics(): void {
    // Обновление игрового времени
    const dateStr = `${this.gameDate.year}-${String(this.gameDate.month).padStart(2, '0')}-${String(this.gameDate.day).padStart(2, '0')}`;
    this.gameTimeText.setText(dateStr);

    // Обновление финансов
    this.financesText.setText(`💰 ${this.formatMoney(this.mockFinances)}`);

    // Обновление населения
    this.populationText.setText(`👥 ${this.formatPopulation(this.mockPopulation)}`);
  }

  resize(): void {
    const { width, height } = this.scene.scale;
    const topBarY = height - this.BOTTOM_BAR_HEIGHT - this.TOP_BAR_HEIGHT;
    const bottomBarY = height - this.BOTTOM_BAR_HEIGHT;

    // Обновление верхней полосы
    this.topBarBackground.setSize(width, this.TOP_BAR_HEIGHT);
    this.topBarBackground.setPosition(width / 2, topBarY + this.TOP_BAR_HEIGHT / 2);

    // Пересоздаём кнопки категорий с учетом нового размера экрана
    this.categoryButtons.forEach((btn) => btn.destroy());
    this.categoryButtons = [];
    this.createCategoryButtons(topBarY);

    // Обновление подполосы инструментов (если она видна)
    if (this.toolsSubbarBackground && this.toolsSubbarContainer) {
      const toolsSubbarY = Math.max(0, topBarY - this.TOOLS_SUBBAR_HEIGHT);
      this.toolsSubbarBackground.setSize(width, this.TOOLS_SUBBAR_HEIGHT);
      this.toolsSubbarBackground.setPosition(
        width / 2,
        toolsSubbarY + this.TOOLS_SUBBAR_HEIGHT / 2,
      );
      this.toolsSubbarContainer.setPosition(0, toolsSubbarY);

      // Пересоздаём кнопки инструментов с учетом нового размера экрана
      const hoveredCategory = this.hoveredCategoryId
        ? this.core.getToolManager().getCategory(this.hoveredCategoryId)
        : null;
      if (hoveredCategory) {
        // Очищаем старые кнопки
        this.toolButtons.forEach((btn) => btn.destroy());
        this.toolButtons = [];

        // Создаём новые кнопки с проверкой границ
        const startX = 20;
        const rightMargin = 20;
        let currentX = startX;

        hoveredCategory.tools.forEach((tool) => {
          if (currentX + this.BUTTON_WIDTH > width - rightMargin) {
            return;
          }

          const button = this.createToolButton(currentX, this.TOOLS_SUBBAR_HEIGHT / 2, tool);
          this.toolButtons.push(button);
          if (this.toolsSubbarContainer) {
            this.toolsSubbarContainer.add(button);
          }

          currentX += this.BUTTON_WIDTH + this.BUTTON_SPACING;
        });
      }
    }

    // Обновление нижней полосы
    this.bottomBarBackground.setSize(width, this.BOTTOM_BAR_HEIGHT);
    this.bottomBarBackground.setPosition(width / 2, bottomBarY + this.BOTTOM_BAR_HEIGHT / 2);

    // Обновление позиции кнопок скорости
    const speedControlsX = 20;
    const speedControlsY = bottomBarY + this.BOTTOM_BAR_HEIGHT / 2;
    this.speedControls.setPosition(speedControlsX, speedControlsY);

    // Пересоздаём элементы статистики
    this.gameTimeText.destroy();
    this.cityNameText.destroy();
    this.financesText.destroy();
    this.populationText.destroy();
    const statisticsStartX = speedControlsX + this.speedControls.getWidth() + 30;
    this.createStatisticsElements(width, bottomBarY, statisticsStartX);
  }

  destroy(): void {
    // Уничтожаем подполосу инструментов если она существует
    this.hideToolsSubbar();

    if (this.speedControls) {
      this.speedControls.destroy();
    }
    super.destroy();
  }
}
