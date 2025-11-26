import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { GridModule } from '@/modules/grid/grid_module';

/**
 * Компонент навигации по карте
 * Теги: arch:ui, gameplay:camera-control
 */
export class NavigationControls extends UIComponent {
  private gridModule: GridModule | null = null;
  private buttons: Array<{ bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }> = [];

  constructor(scene: Phaser.Scene, core: GameCore) {
    super(scene, core);
  }

  create(): void {
    // Получаем GridModule для управления камерой
    this.gridModule = this.core.getModuleManager().getModule<GridModule>('grid');

    // Создаём контейнер с depth для кнопок
    super.createContainer(0, 0, UIComponent.DEPTH.UI_PANELS);

    this.createNavigationButtons();
  }

  private createNavigationButtons(): void {
    const buttonSize = 40;
    const spacing = 5;
    const zoomButtonWidth = 50;

    // Кнопки направлений (крестовина)
    const directions = [
      {
        dir: 'up' as const,
        x: buttonSize + spacing,
        y: 0,
        text: '▲',
        width: buttonSize,
        height: buttonSize,
      },
      {
        dir: 'down' as const,
        x: buttonSize + spacing,
        y: (buttonSize + spacing) * 2,
        text: '▼',
        width: buttonSize,
        height: buttonSize,
      },
      {
        dir: 'left' as const,
        x: 0,
        y: buttonSize + spacing,
        text: '◀',
        width: buttonSize,
        height: buttonSize,
      },
      {
        dir: 'right' as const,
        x: (buttonSize + spacing) * 2,
        y: buttonSize + spacing,
        text: '▶',
        width: buttonSize,
        height: buttonSize,
      },
    ];

    directions.forEach(({ dir, x, y, text, width, height }) => {
      const button = this.createButton(x, y, width, height, text, () => {
        this.gridModule?.moveCamera(dir);
      });
      this.buttons.push(button);
    });

    // Кнопки зума (справа от крестовины)
    const zoomX = (buttonSize + spacing) * 3 + 10;

    const zoomInButton = this.createButton(zoomX, 0, zoomButtonWidth, buttonSize, '🔍+', () => {
      this.gridModule?.zoomIn();
    });
    this.buttons.push(zoomInButton);

    const zoomOutButton = this.createButton(
      zoomX,
      buttonSize + spacing,
      zoomButtonWidth,
      buttonSize,
      '🔍-',
      () => {
        this.gridModule?.zoomOut();
      },
    );
    this.buttons.push(zoomOutButton);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
  ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    // Фон кнопки
    const background = this.scene.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x2a2a2a,
      0.9,
    );
    background.setStrokeStyle(2, 0x4a4a4a);
    background.setInteractive({ useHandCursor: true });

    // Текст кнопки
    const label = this.scene.add.text(x + width / 2, y + height / 2, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });
    label.setOrigin(0.5);

    // Добавляем в контейнер
    this.container.add([background, label]);

    // Обработчики событий
    background.on('pointerover', () => {
      background.setFillStyle(0x3a3a3a);
    });

    background.on('pointerout', () => {
      background.setFillStyle(0x2a2a2a);
    });

    background.on('pointerdown', () => {
      background.setFillStyle(0x1a1a1a);
      onClick();
    });

    background.on('pointerup', () => {
      background.setFillStyle(0x3a3a3a);
    });

    return { bg: background, text: label };
  }

  public getWidth(): number {
    // Примерная ширина: 3 кнопки по 40px + 2 зазора по 5px + зазор 10px + зум 50px
    return 40 * 3 + 5 * 2 + 10 + 50;
  }

  public setPosition(x: number, y: number): void {
    if (this.container) {
      this.container.setPosition(x, y);
    }
  }

  destroy(): void {
    this.buttons.forEach(({ bg, text }) => {
      bg.destroy();
      text.destroy();
    });
    this.buttons = [];

    super.destroy();
  }
}
