import Phaser from 'phaser';
import { createMainMenuButton } from '../ui/main_menu_buttons/main_menu_button';

/**
 * Сцена главного меню
 * Теги: arch:ui, tech:phaser
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Заголовок
    this.add
      .text(width / 2, height / 2 - 100, 'Script City', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Кнопка "Начать игру"
    createMainMenuButton({
      scene: this,
      x: width / 2,
      y: height / 2,
      text: 'Начать игру',
      onClick: () => {
        // Переход в игровую сцену
        this.scene.start('GameScene');
      },
    });
    // Кнопка "Выход"
    createMainMenuButton({
      scene: this,
      x: width / 2,
      y: height / 2,
      text: 'Выход',
      onClick: () => {
        // Переход в игровую сцену
        this.scene.stop();
      },
    });
  }
}
