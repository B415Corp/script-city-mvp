import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';
import { Events } from '@/core/event_bus/events';

export class TickDebug extends DebugComponent {
  // данные
  private tick: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;

  // Phaser UI элементы
  private tickText!: Phaser.GameObjects.Text;
  private deltaTimeText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);

    this.eventBus.on(Events.TickStarted, (payload) => {
      if (payload) {
        this.tick = payload.time;
        this.deltaTime = Math.round(payload.delta);
        this.fps = Math.round(1000 / payload.delta);

        this.updateContent();
      }
    });
  }

  public onActivate(): void {}

  public onDeactivate(): void {}

  public createContent(contentContainer: Phaser.GameObjects.Container): void {
    const yOffset = 50;

    // Создаем и сохраняем текст для tick
    this.tickText = this.scene.add
      .text(15, yOffset + 25, '• Current tick: 0', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    contentContainer.add(this.tickText);

    // Создаем и сохраняем текст для delta time
    this.deltaTimeText = this.scene.add
      .text(15, yOffset + 45, '• Delta time: 16ms', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    contentContainer.add(this.deltaTimeText);

    // Создаем и сохраняем текст для FPS
    this.fpsText = this.scene.add
      .text(15, yOffset + 65, '• FPS: 0', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
      })
      .setOrigin(0, 0);
    contentContainer.add(this.fpsText);
  }

  private updateContent(): void {
    if (!this.tickText || !this.deltaTimeText || !this.fpsText) {
      return;
    }
    this.tickText.setText(`• Current tick: ${this.tick}`);
    this.deltaTimeText.setText(`• Delta time: ${this.deltaTime}ms`);
    this.fpsText.setText(`• FPS: ${this.fps}`);
  }
}
