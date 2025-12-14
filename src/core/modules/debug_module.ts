import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';

type panelCategories = 'tick' | 'events' | 'tools' | 'map';

export class DebugModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;

  private isOpen: boolean = false;
  private category: panelCategories = 'events';

  // UI элементы
  private container!: Phaser.GameObjects.Container;
  // UI контейнер в модуле
  private panelContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('DebugModule: init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;

    this.container = scene.add.container();
    this.container.setDepth(2000);

    this.createPanel();
  }

  private openDebugPanel(): void {
    this.isOpen = !this.isOpen;
  }

  private createPanel(): void {
    const margin = { left: 0, right: 10, top: 10, bottom: 10 };
    const height = this.scene.cameras.main.height - (margin.top + margin.bottom);
    const width = 400 - (margin.right + margin.left);
    const x = this.scene.cameras.main.width - width - margin.right;
    const y = margin.top;

    // Контейнер бара
    this.panelContainer = this.scene.add.container(x, y);
    this.panelContainer.setDepth(2000);

    // Фон бара
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(0, 0, width, height, 16);
    // // bg.lineStyle(2, 0x222222, 1);
    bg.strokeRoundedRect(0, 0, width, height, 16);

    // Добавляем фон в контейнер панели
    this.panelContainer.add(bg);

    // Добавляем панель в контейнер модуля
    this.container.add(this.panelContainer);
  }
}
