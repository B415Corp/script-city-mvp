import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';
import { Events } from '@/core/event_bus/events';

interface EventLogEntry {
  event: Events;
  timestamp: number;
  payload?: unknown;
}

const events = Object.values(Events);
const excludeList: Array<Events> = [
  // tick
  Events.TickStarted,
  Events.TickEnded,
  Events.MapCentered,
  Events.SceneReady,
  Events.LogicTick,
  Events.GameTimeUpdated,

  // tiles
  Events.TileHovered,
  Events.TileUnhovered,
];

const palette = ['#9cdcfe', '#c586c0', '#ce9178', '#b5cea8', '#dcdcaa', '#4ec9b0'];
const eventColorCache = new Map<Events, string>();

// получение цвета для события
const getEventColorClass = (event: Events): string => {
  const cached = eventColorCache.get(event);
  if (cached) return cached;

  // цвет на основе имени события
  const hash = Array.from(event).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const colorIndex = hash % palette.length;
  const colorClass = `debug-event-color-${colorIndex}`;
  eventColorCache.set(event, colorClass);
  return colorClass;
};

export class EventsDebug extends DebugComponent {
  private eventsList!: HTMLElement;
  private eventLog: EventLogEntry[] = [];
  private maxEvents = 10;
  private eventUnsubscribers: (() => void)[] = [];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.initDOM();
  }

  private initDOM(): void {
    this.eventsList = document.getElementById('events-list')!;
    this.setupClearButton();
  }

  // создание контента
  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    // DOM элементы уже инициализированы в конструкторе
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
        const unsubscribe = this.eventBus.on(event, (payload) => {
          this.addEvent(event, payload);
        });
        this.eventUnsubscribers.push(unsubscribe);
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
    // Очищаем список
    this.eventsList.innerHTML = '';

    if (this.eventLog.length === 0) {
      const noEventsDiv = document.createElement('div');
      noEventsDiv.className = 'debug-no-events';
      noEventsDiv.textContent = '• No events yet';
      this.eventsList.appendChild(noEventsDiv);
      return;
    }

    this.eventLog.forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const payloadStr = entry.payload ? ` (${JSON.stringify(entry.payload)})` : '';
      const textContent = `• ${time} - ${entry.event}${payloadStr}`;

      const eventDiv = document.createElement('div');
      eventDiv.className = 'debug-event-item';
      eventDiv.textContent = textContent;

      // Добавляем цветовой класс
      const colorClass = getEventColorClass(entry.event);
      eventDiv.classList.add(colorClass);

      this.eventsList.appendChild(eventDiv);
    });

    // Автопрокрутка вниз
    this.eventsList.scrollTop = this.eventsList.scrollHeight;
  }

  // настройка кнопки очистки
  private setupClearButton(): void {
    const clearBtn = document.getElementById('clear-events')!;
    clearBtn.addEventListener('click', () => {
      this.clearLogs();
    });
  }

  // очистка логов
  private clearLogs(): void {
    this.eventLog = [];
    this.updateEventDisplay();
  }
}
