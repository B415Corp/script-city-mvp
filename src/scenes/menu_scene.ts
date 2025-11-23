import Phaser from 'phaser';
import { createMainMenuButton } from '../ui/main_menu_buttons/main_menu_button';
import { createMainMenu } from '../ui/main_menu/main_menu';

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
      .text(width / 2, height / 2 - 150, 'Script City', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Создаем кнопки меню
    const startButton = createMainMenuButton({
      scene: this,
      x: width / 2,
      y: 0, // Y будет установлен через createMainMenu
      text: '🌆 Начать игру',
      onClick: () => {
        this.scene.start('GameScene');
      },
    });

    const exitButton = createMainMenuButton({
      scene: this,
      x: width / 2,
      y: 0, // Y будет установлен через createMainMenu
      text: '♿️ Выход',
      onClick: () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
          this.scene.stop();
          window.close();
        } else {
          return;
        }
      },
    });

    const settingsButton = createMainMenuButton({
      scene: this,
      x: width / 2,
      y: 0, // Y будет установлен через createMainMenu
      text: '⚙️ Настройки',
      onClick: () => {
        this.scene.start('SettingsScene');
      },
    });

    // Располагаем кнопки вертикально
    createMainMenu({
      scene: this,
      x: width / 2,
      y: height / 2,
      items: [startButton, settingsButton, exitButton],
      spacing: 80,
    });
  }
}
