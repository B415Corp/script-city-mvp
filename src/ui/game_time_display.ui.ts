import { EventBus } from '../core/event_bus/event_bus';
import { TimeService } from '../core/tick/time_service';

/**
 * Компонент для отображения игрового времени в UI
 * Использует TimeService для получения данных о времени через eventBus
 */
export class GameTimeDisplay {
  private timeService: TimeService;
  private container: HTMLElement;
  private timeElement!: HTMLElement;
  private dateElement!: HTMLElement;
  private phaseElement!: HTMLElement;

  constructor(eventBus: EventBus, containerId: string) {
    this.timeService = TimeService.createFromEventBus(eventBus);
    this.container = document.getElementById(containerId)!;

    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.createUI();
    this.updateDisplay();
  }

  private createUI(): void {
    this.container.innerHTML = '';

    // Создаем элементы для отображения времени
    const timeContainer = document.createElement('div');
    timeContainer.className = 'game-time-display';
    timeContainer.innerHTML = `
      <div class="game-time-header">🕐 Игровое время</div>
      <div class="game-time-current" id="game-time-current">--:--</div>
      <div class="game-time-date" id="game-time-date">--.--.----</div>
      <div class="game-time-phase" id="game-time-phase">Загрузка...</div>
    `;

    this.container.appendChild(timeContainer);

    // Получаем ссылки на элементы
    this.timeElement = document.getElementById('game-time-current')!;
    this.dateElement = document.getElementById('game-time-date')!;
    this.phaseElement = document.getElementById('game-time-phase')!;

    // Обновляем отображение каждые 100ms (для плавности)
    setInterval(() => this.updateDisplay(), 100);
  }

  private updateDisplay(): void {
    try {
      const timeData = this.timeService.getTimeData();
      const debugInfo = this.timeService.getDebugInfo();

      // Обновляем элементы
      this.timeElement.textContent = timeData.timeOfDay;
      this.dateElement.textContent = timeData.date;
      this.phaseElement.textContent = this.getPhaseDescription(debugInfo.condition);
      this.phaseElement.className = `game-time-phase ${debugInfo.condition.toLowerCase()}`;
    } catch (error) {
      console.error('Error updating game time display:', error);
      this.phaseElement.textContent = 'Ошибка загрузки времени';
    }
  }

  private getPhaseDescription(condition: string): string {
    switch (condition) {
      case 'MORNING':
        return '🌅 Утро (работа)';
      case 'AFTERNOON':
        return '☀️ День (активность)';
      case 'EVENING':
        return '🌆 Вечер (покупки)';
      case 'NIGHT':
        return '🌙 Ночь (отдых)';
      default:
        return condition;
    }
  }

  /**
   * Получить текущие данные времени для использования в других компонентах
   */
  public getCurrentTime(): ReturnType<TimeService['getTimeData']> {
    return this.timeService.getTimeData();
  }

  /**
   * Проверить условия времени
   */
  public isWorkHours(): boolean {
    return this.timeService.isWorkHours();
  }

  public isEveningTime(): boolean {
    return this.timeService.isEveningTime();
  }

  public isWeekend(): boolean {
    return this.timeService.isWeekend();
  }
}
