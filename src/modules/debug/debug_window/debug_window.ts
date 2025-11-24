import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';

/**
 * Окно отладки с информацией о тиках, скорости и подписках
 * Теги: arch:ui, debug:info, tech:phaser
 */
export class DebugWindow extends UIComponent {
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private collapseButton!: Phaser.GameObjects.Text;
  private tickText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private modulesText!: Phaser.GameObjects.Text;
  private subscriptionsText!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;
  private isCollapsed: boolean = false;

  // Константы
  private readonly WINDOW_WIDTH = 400;
  private readonly WINDOW_HEIGHT = 500;
  private readonly COLLAPSED_HEIGHT = 50; // высота свернутого окна
  private readonly PADDING = 20;
  private readonly LINE_HEIGHT = 22; // высота одной строки текста
  private readonly SECTION_SPACING = 15; // отступ между секциями
  private readonly UPDATE_INTERVAL = 100; // обновление каждые 100ms

  private updateTimer: number = 0;
  private contentElements: (Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle)[] = [];

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    const { width } = this.scene.scale;
    const x = width - this.WINDOW_WIDTH - 20;
    const y = 20;

    // Создаём контейнер с depth для панелей
    super.createContainer(x, y, UIComponent.DEPTH.UI_PANELS);
    // Окно видимо по умолчанию для отладки
    this.isVisible = true;
    this.container.setVisible(true);

    // Фон окна
    this.background = this.scene.add.rectangle(
      this.WINDOW_WIDTH / 2,
      this.WINDOW_HEIGHT / 2,
      this.WINDOW_WIDTH,
      this.WINDOW_HEIGHT,
      0x1a1a1a,
      0.95,
    );
    this.background.setStrokeStyle(2, 0x4a90e2, 1);
    this.container.add(this.background);

    // Заголовок
    const titleY = this.PADDING;
    this.titleText = this.scene.add
      .text(this.PADDING, titleY, '🐛 Debug Info', {
        fontSize: '24px',
        color: '#4a90e2',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0);
    this.container.add(this.titleText);

    // Кнопка сворачивания/разворачивания
    this.collapseButton = this.scene.add
      .text(this.WINDOW_WIDTH - this.PADDING - 20, titleY + 5, '▼', {
        fontSize: '20px',
        color: '#4a90e2',
        fontFamily: 'Arial',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.collapseButton.on('pointerdown', () => this.toggleCollapse());
    this.container.add(this.collapseButton);

    // Текст тиков (6 строк: Tick, Game Time, Real Time, Tick Rate, Effective, Actual)
    const tickY = titleY + 35 + this.SECTION_SPACING;
    this.tickText = this.scene.add
      .text(this.PADDING, tickY, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.container.add(this.tickText);
    this.contentElements.push(this.tickText);

    // Текст скорости (2-3 строки: Speed, Locked, Locks)
    const speedY = tickY + this.LINE_HEIGHT * 6 + this.SECTION_SPACING;
    this.speedText = this.scene.add
      .text(this.PADDING, speedY, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.container.add(this.speedText);
    this.contentElements.push(this.speedText);

    // Текст модулей
    const modulesY = speedY + this.LINE_HEIGHT * 3 + this.SECTION_SPACING;
    this.modulesText = this.scene.add
      .text(this.PADDING, modulesY, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: this.WINDOW_WIDTH - this.PADDING * 2 },
        lineSpacing: 3,
      })
      .setOrigin(0, 0);
    this.container.add(this.modulesText);
    this.contentElements.push(this.modulesText);

    // Текст подписок
    const subscriptionsY = modulesY + this.LINE_HEIGHT * 4 + this.SECTION_SPACING;
    this.subscriptionsText = this.scene.add
      .text(this.PADDING, subscriptionsY, '', {
        fontSize: '14px',
        color: '#cccccc',
        fontFamily: 'Arial',
        wordWrap: { width: this.WINDOW_WIDTH - this.PADDING * 2 },
        lineSpacing: 3,
      })
      .setOrigin(0, 0);
    this.container.add(this.subscriptionsText);
    this.contentElements.push(this.subscriptionsText);

    // Подписка на клавишу для переключения (F3)
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });

    // Первоначальное обновление
    this.updateInfo();
  }

  update(delta: number): void {
    if (!this.isVisible) {
      return;
    }

    this.updateTimer += delta;
    if (this.updateTimer >= this.UPDATE_INTERVAL) {
      this.updateInfo();
      this.updateTimer = 0;
    }
  }

  private updateInfo(): void {
    if (this.isCollapsed) {
      return; // Не обновляем информацию когда свернуто
    }

    const tickManager = this.core.getTickManager();
    const eventBus = this.core.getEventBus();
    const moduleManager = this.core.getModuleManager();

    // Информация о тиках
    const currentTick = tickManager.getCurrentTick();
    const gameTime = tickManager.getGameTime();
    const realTime = tickManager.getRealTime();
    const tickRate = tickManager.getTickRate();
    const effectiveTickRate = tickManager.getEffectiveTickRate();
    const ticksPerSecond = tickManager.getTicksPerSecond();
    this.tickText.setText(
      `Tick: ${currentTick}\nGame Time: ${gameTime}\nReal Time: ${(realTime / 1000).toFixed(2)}s\nTick Rate: ${tickRate}/s\nEffective: ${effectiveTickRate.toFixed(1)}/s\nActual: ${ticksPerSecond}/s`,
    );

    // Информация о скорости
    const speed = tickManager.getSpeed();
    const isPaused = !tickManager.isActive();
    const isLocked = tickManager.isSpeedChangeLocked();
    const locks = tickManager.getSpeedChangeLocks();

    let speedInfo = `Speed: ${isPaused ? '⏸ Paused' : `${speed}x`}\nLocked: ${isLocked ? 'Yes' : 'No'}`;
    if (locks.length > 0) {
      speedInfo += `\nLocks: ${locks.join(', ')}`;
    }
    this.speedText.setText(speedInfo);

    // Информация о модулях
    const modules = moduleManager.getAllModules();
    let modulesInfo = `Modules: ${modules.length}`;
    if (modules.length > 0) {
      modulesInfo += '\n\n';
      modulesInfo += modules
        .map((module) => {
          const deps =
            module.dependencies && module.dependencies.length > 0
              ? ` (deps: ${module.dependencies.join(', ')})`
              : '';
          return `${module.id}${deps}`;
        })
        .join('\n');
    } else {
      modulesInfo += '\n\nNo modules registered';
    }
    this.modulesText.setText(modulesInfo);

    // Информация о подписках
    const subscriptions = eventBus.getSubscriptions();
    const eventTypes = Object.keys(subscriptions);
    const totalSubscriptions = eventTypes.reduce((sum, type) => sum + subscriptions[type].count, 0);

    let subscriptionsInfo = `Subscriptions: ${totalSubscriptions}`;
    if (eventTypes.length > 0) {
      subscriptionsInfo += '\n\n';
      subscriptionsInfo += eventTypes
        .map((type) => {
          const sub = subscriptions[type];
          return `${type}: ${sub.count}${sub.once > 0 ? ` (${sub.once} once)` : ''}`;
        })
        .join('\n');
    } else {
      subscriptionsInfo += '\n\nNo active subscriptions';
    }

    this.subscriptionsText.setText(subscriptionsInfo);
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.updateCollapseState();
  }

  private updateCollapseState(): void {
    // Обновляем иконку кнопки
    this.collapseButton.setText(this.isCollapsed ? '▶' : '▼');

    // Скрываем/показываем контент
    this.contentElements.forEach((element) => {
      element.setVisible(!this.isCollapsed);
    });

    // Изменяем размер окна
    const newHeight = this.isCollapsed ? this.COLLAPSED_HEIGHT : this.WINDOW_HEIGHT;
    this.background.setSize(this.WINDOW_WIDTH, newHeight);
    this.background.setPosition(this.WINDOW_WIDTH / 2, newHeight / 2);
  }

  destroy(): void {
    super.destroy();
  }
}
