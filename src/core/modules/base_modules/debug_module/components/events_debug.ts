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

const palette = ['#9cdcfe', '#c586c0', '#ce9178', '#b5cea8', '#dcdcaa', '#4ec9b0'];
const eventColorCache = new Map<Events, string>();

// получение цвета для события
const getEventColor = (event: Events): string => {
  const cached = eventColorCache.get(event);
  if (cached) return cached;

  // цвет на основе имени события
  const hash = Array.from(event).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const color = palette[hash % palette.length];
  eventColorCache.set(event, color);
  return color;
};

export class EventsDebug extends DebugComponent {
  private container!: Phaser.GameObjects.Container;
  private eventLog: EventLogEntry[] = [];
  private maxEvents = 10;
  private eventTexts: Phaser.GameObjects.Text[] = [];
  private eventUnsubscribers: (() => void)[] = [];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
  }

  // создание контента
  public createContent(contentContainer: Phaser.GameObjects.Container): void {
    this.container = contentContainer;
    this.container.add(this.clearButton());
  }

  // активация компонента
  public onActivate(): void {
    this.initEvents();
  }

  // деактивация компонента
  public onDeactivate(): void {
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventUnsubscribers = [];
  }

  // инициализация событий
  private initEvents(): void {
    events
      .filter((el) => !excludeList.includes(el))
      .forEach((event) => {
        const subscription = this.eventBus.on(event, (payload) => {
          this.addEvent(event, payload);
        });
        this.eventUnsubscribers.push(subscription.unsubscribe);
      });
  }

  // добавление события в лог
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

  // обновление отображения событий
  private updateEventDisplay(): void {
    // Очищаем предыдущие текстовые объекты
    this.eventTexts.forEach((text) => text.destroy());
    this.eventTexts = [];

    const yOffset = 50;
    const maxWidth = 200; // ширина текста с учётом левого/правого отступа
    let currentY = yOffset + 25;

    if (this.eventLog.length === 0) {
      const noEventsText = this.scene.add.text(15, currentY, '• No events yet', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
        wordWrap: { width: maxWidth, useAdvancedWrap: true },
      });
      noEventsText.setWordWrapWidth(maxWidth, true);
      noEventsText.setOrigin(0, 0);
      this.container.add(noEventsText);
      this.eventTexts.push(noEventsText);
      return;
    }

    this.eventLog.forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const payloadStr = entry.payload ? ` (${JSON.stringify(entry.payload)})` : '';
      const textContent = `• ${time} - ${entry.event}${payloadStr}`;
      const color = getEventColor(entry.event);

      const text = this.scene.add.text(15, currentY, textContent, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color,
        wordWrap: { width: maxWidth, useAdvancedWrap: true },
      });
      text.setWordWrapWidth(maxWidth, true);
      text.setOrigin(0, 0);

      this.container.add(text);
      this.eventTexts.push(text);

      // Обновляем позицию для следующего элемента с учетом реальной высоты текста
      currentY += text.displayHeight + 4;
    });
  }

  // кнопка очистки логов
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

  // очистка логов
  private clearLogs(): void {
    this.eventLog = [];
    this.updateEventDisplay();
  }
}
