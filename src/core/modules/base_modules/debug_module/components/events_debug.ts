import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';
import { Events } from '@/core/event_bus/events';
import { ButtonUI } from '@/ui/button.ui';

interface EventLogEntry {
  event: Events;
  timestamp: number;
  payload?: unknown;
}

const events = Object.values(Events);
const excludeList: Array<Events> = [
  Events.TickStarted,
  Events.TickEnded,
  Events.TileHovered,
  Events.TileUnhovered,
];

export class EventsDebug extends DebugComponent {
  private container!: Phaser.GameObjects.Container;
  private eventLog: EventLogEntry[] = [];
  private maxEvents = 20;
  private eventTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
  }

  public createContent(contentContainer: Phaser.GameObjects.Container): void {
    this.container = contentContainer;
    this.container.add(this.clearButton());
    this.initEvents();
  }

  private initEvents(): void {
    events
      .filter((el) => !excludeList.includes(el))
      .forEach((event) => {
        this.eventBus.on(event, (payload) => {
          this.addEvent(event, payload);
        });
      });
  }

  private addEvent(event: Events, payload?: unknown): void {
    const entry: EventLogEntry = {
      event,
      timestamp: Date.now(),
      payload,
    };

    this.eventLog.unshift(entry);

    // Ограничиваем стек 'private maxEvents' событиями
    if (this.eventLog.length > this.maxEvents) {
      this.eventLog = this.eventLog.slice(0, this.maxEvents);
    }

    this.updateEventDisplay();
  }

  private updateEventDisplay(): void {
    // Очищаем предыдущие текстовые объекты
    this.eventTexts.forEach((text) => text.destroy());
    this.eventTexts = [];

    const yOffset = 50;
    const lineHeight = 20;

    if (this.eventLog.length === 0) {
      const noEventsText = this.scene.add
        .text(15, yOffset + 25, '• No events yet', {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0);
      this.container.add(noEventsText);
      this.eventTexts.push(noEventsText);
      return;
    }

    this.eventLog.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const payloadStr = entry.payload ? ` (${JSON.stringify(entry.payload).slice(0, 50)})` : '';
      const textContent = `• ${time} - ${entry.event}${payloadStr}`;

      const text = this.scene.add
        .text(15, yOffset + 25 + index * lineHeight, textContent, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0);

      this.container.add(text);
      this.eventTexts.push(text);
    });
  }

  private clearButton(): Phaser.GameObjects.Container {
    const { container } = new ButtonUI(this.scene, {
      xPos: 220,
      yPos: 10,
      // w: 85,
      h: 30,
      text: 'clear',
      depth: 1,
      onClick: (): void => {
        this.clearLogs();
      },
    });

    return container;
  }

  private clearLogs(): void {
    this.eventLog = [];
    this.updateEventDisplay();
  }
}
