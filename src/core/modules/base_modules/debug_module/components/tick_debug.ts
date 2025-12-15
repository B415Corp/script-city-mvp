import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';

export class TickDebug extends DebugComponent {
  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
  }

  public createContent(contentContainer: Phaser.GameObjects.Container): void {
    const yOffset = 50;
    contentContainer.add(
      this.scene.add
        .text(15, yOffset + 25, '• Current tick: 0', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );

    contentContainer.add(
      this.scene.add
        .text(15, yOffset + 45, '• Delta time: 16ms', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0),
    );
  }
}
