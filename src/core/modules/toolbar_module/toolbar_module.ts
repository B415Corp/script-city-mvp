import { EventBus } from '@/core/event_bus/event_bus';
import BaseModule from '../base_module';
import { Events } from '@/core/event_bus/events';
import { ButtonUI } from '@/ui/button.ui';

export class ToolbarModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isHovered = false;

  // UI элементы
  private container!: Phaser.GameObjects.Container;
  private toolBar!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('ToolbarModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
    this.container = scene.add.container();
    this.container.setDepth(1000);

    this.createToolbar();
  }

  private barContainer!: Phaser.GameObjects.Container;

  private createToolbar(): void {
    const margin = { left: 10, right: 10, top: 10, bottom: 10 };
    const height = 60;
    const width = this.scene.cameras.main.width / 2 - (margin.right + margin.left);
    const x = margin.left + this.scene.cameras.main.width / 2 - width / 2;
    const y = this.scene.cameras.main.height - height - margin.bottom;

    const livingZoneBtn = new ButtonUI(this.scene, {
      xPos: 15,
      yPos: height / 2 - 15,
      w: 150,
      h: 30,
      text: 'Жилая зона',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'living-zone' });
      },
    });

    const commercialZoneBtn = new ButtonUI(this.scene, {
      xPos: 15 + livingZoneBtn.width + 15,
      yPos: height / 2 - 15,
      w: 220,
      h: 30,
      text: 'Коммерческая зона',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'commercial-zone' });
      },
    });

    const clearZoneBtn = new ButtonUI(this.scene, {
      xPos: commercialZoneBtn.xPosition + commercialZoneBtn.width + 15,
      yPos: height / 2 - 15,
      w: 175,
      h: 30,
      text: 'Очистить зону',
      depth: 1001,
      onClick: (): void => {
        this.eventBus.emit(Events.SelectTool, { type: 'clear-zone' });
      },
    });

    // Контейнер бара
    this.barContainer = this.scene.add.container(x, y);
    this.barContainer.setDepth(1000);

    // Фон бара
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 16);
    // bg.lineStyle(2, 0x222222, 1);
    bg.strokeRoundedRect(0, 0, width, height, 16);

    this.barContainer.on('pointerover', () => {
      this.isHovered = true;
      bg.fillStyle(0x222222, 1);
      this.scene.input.setDefaultCursor('pointer');
    });

    this.barContainer.on('pointerout', () => {
      this.isHovered = false;
      bg.fillStyle(0x222222, 0.7);
      this.scene.input.setDefaultCursor('default');
    });

    this.barContainer.add(bg);

    this.barContainer.add(livingZoneBtn.container);
    this.barContainer.add(commercialZoneBtn.container);
    this.barContainer.add(clearZoneBtn.container);
    this.container.add(this.barContainer);
  }
}

export default ToolbarModule;
