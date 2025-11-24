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
    const { width } = this.scene.scale;
    const rightMargin = 20; // Отступ справа от края экрана
    let currentX = startX;
    const centerY = this.barY + this.BOTTOM_BAR_HEIGHT / 2;

    // Игровое время
    const dateStr = `${this.gameDate.year}-${String(this.gameDate.month).padStart(2, '0')}-${String(this.gameDate.day).padStart(2, '0')}`;
    this.gameTimeText = this.scene.add
      .text(currentX, centerY, dateStr, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.gameTimeText);

    // Проверяем, помещается ли элемент, и обновляем позицию
    if (this.gameTimeText.x + this.gameTimeText.width > width - rightMargin) {
      // Если не помещается, обрезаем или уменьшаем шрифт
      this.gameTimeText.setVisible(false);
    } else {
      currentX += this.gameTimeText.width + spacing;
    }

    // Название города
    this.cityNameText = this.scene.add
      .text(currentX, centerY, this.mockCityName, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.cityNameText);

    // Проверяем границы и обрезаем текст если нужно
    const maxCityNameWidth = width - currentX - rightMargin - spacing * 2;
    if (this.cityNameText.width > maxCityNameWidth) {
      // Обрезаем текст с многоточием
      let truncatedName = this.mockCityName;
      while (this.cityNameText.width > maxCityNameWidth && truncatedName.length > 0) {
        truncatedName = truncatedName.slice(0, -1);
        this.cityNameText.setText(truncatedName + '...');
      }
    }

    if (this.cityNameText.x + this.cityNameText.width > width - rightMargin) {
      this.cityNameText.setVisible(false);
    } else {
      currentX += this.cityNameText.width + spacing;
    }

    // Финансы
    const financesStr = `💰 ${formatMoney(this.mockFinances)}`;
    this.financesText = this.scene.add
      .text(currentX, centerY, financesStr, {
        fontSize: '16px',
        color: '#4ade80',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.financesText);

    if (this.financesText.x + this.financesText.width > width - rightMargin) {
      this.financesText.setVisible(false);
    } else {
      currentX += this.financesText.width + spacing;
    }

    // Население
    const populationStr = `👥 ${formatPopulation(this.mockPopulation)}`;
    this.populationText = this.scene.add
      .text(currentX, centerY, populationStr, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.populationText);

    if (this.populationText.x + this.populationText.width > width - rightMargin) {
      this.populationText.setVisible(false);
    }
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
    const { width } = this.scene.scale;
    const spacing = 30;
    const rightMargin = 20;
    let currentX = this.startX;

    // Обновление игрового времени
    const dateStr = `${this.gameDate.year}-${String(this.gameDate.month).padStart(2, '0')}-${String(this.gameDate.day).padStart(2, '0')}`;
    this.gameTimeText.setText(dateStr);
    this.gameTimeText.setPosition(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2);

    if (this.gameTimeText.x + this.gameTimeText.width > width - rightMargin) {
      this.gameTimeText.setVisible(false);
    } else {
      this.gameTimeText.setVisible(true);
      currentX += this.gameTimeText.width + spacing;
    }

    // Обновление названия города
    this.cityNameText.setText(this.mockCityName);
    this.cityNameText.setPosition(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2);

    // Проверяем границы и обрезаем текст если нужно
    const maxCityNameWidth = width - currentX - rightMargin - spacing * 2;
    if (this.cityNameText.width > maxCityNameWidth) {
      let truncatedName = this.mockCityName;
      while (this.cityNameText.width > maxCityNameWidth && truncatedName.length > 0) {
        truncatedName = truncatedName.slice(0, -1);
        this.cityNameText.setText(truncatedName + '...');
      }
    }

    if (this.cityNameText.x + this.cityNameText.width > width - rightMargin) {
      this.cityNameText.setVisible(false);
    } else {
      this.cityNameText.setVisible(true);
      currentX += this.cityNameText.width + spacing;
    }

    // Обновление финансов
    const financesStr = `💰 ${formatMoney(this.mockFinances)}`;
    this.financesText.setText(financesStr);
    this.financesText.setPosition(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2);

    if (this.financesText.x + this.financesText.width > width - rightMargin) {
      this.financesText.setVisible(false);
    } else {
      this.financesText.setVisible(true);
      currentX += this.financesText.width + spacing;
    }

    // Обновление населения
    const populationStr = `👥 ${formatPopulation(this.mockPopulation)}`;
    this.populationText.setText(populationStr);
    this.populationText.setPosition(currentX, this.barY + this.BOTTOM_BAR_HEIGHT / 2);

    if (this.populationText.x + this.populationText.width > width - rightMargin) {
      this.populationText.setVisible(false);
    } else {
      this.populationText.setVisible(true);
    }
  }

  resize(barY: number, startX: number): void {
    this.barY = barY;
    this.startX = startX;

    // Обновляем позиции элементов на основе их реальной ширины
    this.updateStatistics();
  }
}
