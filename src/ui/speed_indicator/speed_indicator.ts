import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';

/**
 * Визуальный индикатор скорости игры
 * Объект на экране, который движется в зависимости от игровой скорости
 * Теги: arch:ui, gameplay:time-control, tech:phaser
 */
export class SpeedIndicator extends UIComponent {
  private circle!: Phaser.GameObjects.Arc;
  private text!: Phaser.GameObjects.Text;
  private baseX: number = 0;
  private baseY: number = 0;
  private animationTime: number = 0;

  // Константы
  private readonly CIRCLE_RADIUS = 30;
  private readonly ANIMATION_SPEED = 0.002; // базовая скорость анимации

  constructor(scene: Phaser.Scene, core: GameCore, x: number, y: number) {
    super(scene, core);
    this.baseX = x;
    this.baseY = y;
  }

  create(): void {
    // Создаём контейнер с базовым depth
    super.createContainer(this.baseX, this.baseY, UIComponent.DEPTH.UI_BASE);

    // Создаем круг
    this.circle = this.scene.add.circle(0, 0, this.CIRCLE_RADIUS, 0x4a90e2, 0.8);
    this.circle.setStrokeStyle(2, 0xffffff, 1);

    // Создаем текст с текущей скоростью
    this.text = this.scene.add
      .text(0, 0, '1x', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    this.container.add([this.circle, this.text]);

    // Подписка на события изменения скорости
    this.subscribeToEvents();

    // Установка начального состояния
    this.updateSpeedDisplay();
  }

  update(delta: number): void {
    if (!this.container || !this.core) {
      return;
    }

    // Получаем текущую скорость из TickManager
    const speed = this.core.getTickManager().getSpeed();
    const isPaused = !this.core.getTickManager().isActive();

    // Обновляем анимацию в зависимости от скорости
    if (!isPaused && speed > 0) {
      // Анимация движения по кругу
      this.animationTime += delta * this.ANIMATION_SPEED * speed;
      const radius = 50; // радиус движения
      const offsetX = Math.cos(this.animationTime) * radius;
      const offsetY = Math.sin(this.animationTime) * radius;

      this.container.setPosition(this.baseX + offsetX, this.baseY + offsetY);

      // Изменяем цвет в зависимости от скорости
      const hue = Math.min(240 + speed * 20, 360); // от синего к красному
      const color = Phaser.Display.Color.HSVToRGB(hue / 360, 0.8, 0.9).color;
      this.circle.setFillStyle(color, 0.8);
    } else {
      // На паузе - серый цвет и без движения
      this.circle.setFillStyle(0x7f7f7f, 0.5);
    }
  }

  private subscribeToEvents(): void {
    const eventBus = this.core.getEventBus();

    // Подписка на изменение скорости
    eventBus.on<{ oldSpeed: number; newSpeed: number }>('SpeedChanged', () => {
      this.updateSpeedDisplay();
    });

    // Подписка на паузу/возобновление
    eventBus.on('SimulationPaused', () => {
      this.updateSpeedDisplay();
    });

    eventBus.on('SimulationResumed', () => {
      this.updateSpeedDisplay();
    });
  }

  private updateSpeedDisplay(): void {
    if (!this.text) {
      return;
    }

    const speed = this.core.getTickManager().getSpeed();
    const isPaused = !this.core.getTickManager().isActive();

    if (isPaused || speed === 0) {
      this.text.setText('⏸');
    } else {
      this.text.setText(`${speed}x`);
    }
  }

  destroy(): void {
    super.destroy();
  }
}
