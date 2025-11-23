import Phaser from 'phaser';

/**
 * Конфигурация главного меню
 */
export interface MainMenuConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  items: Phaser.GameObjects.GameObject[];
  spacing?: number;
}

/**
 * Создает главное меню с вертикальным расположением элементов
 * Простой способ расположить элементы друг под другом
 * Теги: arch:ui, tech:phaser
 */
export function createMainMenu(config: MainMenuConfig): void {
  const { items, spacing = 60 } = config;
  let { y } = config;

  items.forEach((item) => {
    // Устанавливаем Y позицию для текущего элемента
    if (item instanceof Phaser.GameObjects.Text) {
      item.setY(y);
    }

    // Перемещаемся вниз для следующего элемента
    y += spacing;
  });
}
