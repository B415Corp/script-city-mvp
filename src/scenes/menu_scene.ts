import Phaser from 'phaser';

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
    const startButton = this.add
      .text(width / 2, height / 2, 'Начать игру', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#34495e',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        startButton.setStyle({ backgroundColor: '#2c3e50' });
      })
      .on('pointerout', () => {
        startButton.setStyle({ backgroundColor: '#34495e' });
      })
      .on('pointerdown', () => {
        // Переход в игровую сцену
        this.scene.start('GameScene');
      });
  }
}
