import Phaser from 'phaser';
import { UIComponent } from '@/core/ui/ui_component';
import { Events } from '@/core/event_bus/events';
import { formatMoney, formatPopulation } from './utils';

/**
 * Компонент статистики города (время, название, финансы, население).
 *
 * Теги: arch:ui, gameplay:time-control, tech:phaser
 */
export class StatisticsBar extends UIComponent {
  readonly BOTTOM_BAR_HEIGHT = 80;

  // Элементы статистики
  private gameTimeText!: Phaser.GameObjects.Text;
  private cityNameText!: Phaser.GameObjects.Text;
  private financesText!: Phaser.GameObjects.Text;
  private populationText!: Phaser.GameObjects.Text;

  // Моковые данные
  private mockCityName = 'Новый Город';
  private mockFinances = 50000;
  private mockPopulation = 0;
  private gameDate = { year: 2024, month: 1, day: 1 };
  private tickCount = 0; // Счетчик тиков для обновления даты

  // Позиция нижней полосы
  private barY: number = 0;
  private startX: number = 20;

  create(): void {
    // Создаём контейнер
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    // Создаём элементы статистики
    this.createStatisticsElements(this.startX);

    // Подписка на события
    this.subscribeToEvents();

    // Установка начального состояния
    this.updateStatistics();
  }

  /**
   * Инициализация позиции компонента.
   * Должна быть вызвана перед create() или после для обновления позиции.
   */
  initialize(barY: number, startX: number): void {
    this.barY = barY;
    this.startX = startX;
  }

  private createStatisticsElements(startX: number = 20): void {
    const spacing = 30;
    let currentX = startX;

    // Игровое время
    this.gameTimeText = this.scene.add
      .text(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2, '2024-01-01', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.gameTimeText);
    currentX += this.gameTimeText.width + spacing;

    // Название города
    this.cityNameText = this.scene.add
      .text(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2, this.mockCityName, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.cityNameText);
    currentX += this.cityNameText.width + spacing;

    // Финансы
    this.financesText = this.scene.add
      .text(
        currentX,
        this.barY + this.BOTTOM_BAR_HEIGHT / 2,
        `💰 ${formatMoney(this.mockFinances)}`,
        {
          fontSize: '16px',
          color: '#4ade80',
          fontFamily: 'Arial',
        },
      )
      .setOrigin(0, 0.5);
    this.container.add(this.financesText);
    currentX += this.financesText.width + spacing;

    // Население
    this.populationText = this.scene.add
      .text(
        currentX,
        this.barY + this.BOTTOM_BAR_HEIGHT / 2,
        `👥 ${formatPopulation(this.mockPopulation)}`,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
        },
      )
      .setOrigin(0, 0.5);
    this.container.add(this.populationText);
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на тики для обновления даты
    eventBus.on(Events.TickEnded, () => {
      this.tickCount++;
      // Обновляем дату каждые 100 тиков
      if (this.tickCount >= 100) {
        this.tickCount = 0;
        this.incrementDate();
        this.updateStatistics();
      }
    });
  }

  private incrementDate(): void {
    // Увеличиваем день
    this.gameDate.day++;

    // Проверяем количество дней в месяце (упрощенная логика - 30 дней в каждом месяце)
    if (this.gameDate.day > 30) {
      this.gameDate.day = 1;
      this.gameDate.month++;

      // Проверяем количество месяцев
      if (this.gameDate.month > 12) {
        this.gameDate.month = 1;
        this.gameDate.year++;
      }
    }
  }

  private updateStatistics(): void {
    // Обновление игрового времени
    const dateStr = `${this.gameDate.year}-${String(this.gameDate.month).padStart(2, '0')}-${String(this.gameDate.day).padStart(2, '0')}`;
    this.gameTimeText.setText(dateStr);

    // Обновление финансов
    this.financesText.setText(`💰 ${formatMoney(this.mockFinances)}`);

    // Обновление населения
    this.populationText.setText(`👥 ${formatPopulation(this.mockPopulation)}`);
  }

  resize(barY: number, startX: number): void {
    this.barY = barY;

    // Пересоздаём элементы статистики
    this.gameTimeText.destroy();
    this.cityNameText.destroy();
    this.financesText.destroy();
    this.populationText.destroy();
    this.createStatisticsElements(startX);
  }
}
