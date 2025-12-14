import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { ButtonUI } from '@/ui/button.ui';
import { BaseModule } from '../../extends';
import { ToolsEvents } from '../tools_module/types';

export class ToolbarModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  // UI элементы
  private container!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('ToolbarModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
    this.container = scene.add.container();
    this.container.setDepth(1000);

    this.createToolbar();
  }

  // UI контейнер в модуле
  private barContainer!: Phaser.GameObjects.Container;

  private createToolbar(): void {
    const margin = { left: 10, right: 10, top: 10, bottom: 10 };
    const height = 60;
    const width = this.scene.cameras.main.width - (margin.right + margin.left);
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
        this.eventBus.emit<ToolsEvents>(Events.SelectTool, { type: 'living_zone' });
      },
    });

    // Кнопка выбора жилой зоны
    const commercialZoneBtn = new ButtonUI(this.scene, {
      xPos: 15 + livingZoneBtn.width + 15,
      yPos: height / 2 - 15,
      w: 220,
      h: 30,
      text: 'Коммерческая зона',
      depth: 1001,
      onClick: (): void => {
        // Отправляем событие в шину по клику
        this.eventBus.emit(Events.SelectTool, { type: 'commercial_zone' });
      },
    });

    // Кнопка выбора коммерческой зоны
    const clearZoneBtn = new ButtonUI(this.scene, {
      xPos: commercialZoneBtn.xPosition + commercialZoneBtn.width + 15,
      yPos: height / 2 - 15,
      w: 175,
      h: 30,
      text: 'Очистить зону',
      depth: 1001,
      onClick: (): void => {
        // Отправляем событие в шину по клику
        this.eventBus.emit(Events.SelectTool, { type: 'clear_zone' });
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

    this.barContainer.add(bg);

    // Добавляем кнопки в бар
    this.barContainer.add(livingZoneBtn.container);
    this.barContainer.add(commercialZoneBtn.container);
    this.barContainer.add(clearZoneBtn.container);

    // Добавляем бар в контейнер модуля
    this.container.add(this.barContainer);
  }
}

export default ToolbarModule;
