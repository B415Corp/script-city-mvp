import Phaser from 'phaser';
import { GameCore } from '@/core/game_core/game_core';
import { UIComponent } from '@/core/ui/ui_component';
import { createMainMenuButton } from '@/ui/main_menu_buttons/main_menu_button';

/**
 * Модальное окно меню игры (показывается по ESC).
 * Отображается по центру экрана с затемненным фоном.
 *
 * Теги: arch:ui, gameplay:menu, tech:phaser
 */
export class GameMenuModal extends UIComponent {
  private overlayBackground!: Phaser.GameObjects.Rectangle;
  private menuContainer!: Phaser.GameObjects.Container;
  private menuBackground!: Phaser.GameObjects.Rectangle;
  private isVisible: boolean = false;

  create(): void {
    // Создаём контейнер с модальным depth
    super.createContainer(0, 0, UIComponent.DEPTH.UI_MODAL);

    // Изначально скрываем меню
    this.container.setVisible(false);
  }

  /**
   * Показать модальное меню.
   */
  show(): void {
    if (this.isVisible) {
      return;
    }

    const { width, height } = this.scene.scale;

    // Создаём затемненный фон, если его еще нет
    if (!this.overlayBackground) {
      this.overlayBackground = this.scene.add.rectangle(
        width / 2,
        height / 2,
        width,
        height,
        0x000000,
        0.7, // Прозрачность
      );
      this.overlayBackground.setScrollFactor(0);
      this.overlayBackground.setDepth(UIComponent.DEPTH.UI_MODAL);
      this.overlayBackground.setInteractive();
      // Клик по затемненному фону закрывает меню
      this.overlayBackground.on('pointerdown', () => {
        this.hide();
      });
    } else {
      this.overlayBackground.setSize(width, height);
      this.overlayBackground.setPosition(width / 2, height / 2);
      this.overlayBackground.setVisible(true);
    }

    // Создаём контейнер меню, если его еще нет
    if (!this.menuContainer) {
      this.menuContainer = this.scene.add.container(width / 2, height / 2);
      this.menuContainer.setScrollFactor(0);
      this.menuContainer.setDepth(UIComponent.DEPTH.UI_MODAL + 1);

      // Фон меню
      this.menuBackground = this.scene.add.rectangle(0, 0, 400, 300, 0x2d2d2d, 0.95);
      this.menuContainer.add(this.menuBackground);

      // Заголовок
      const title = this.scene.add
        .text(0, -100, 'Меню игры', {
          fontSize: '36px',
          color: '#ffffff',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5);
      this.menuContainer.add(title);

      // Кнопки меню
      const resumeButton = createMainMenuButton({
        scene: this.scene,
        x: 0,
        y: -20,
        text: '▶ Продолжить',
        onClick: () => {
          this.hide();
        },
      });
      this.menuContainer.add(resumeButton);

      const settingsButton = createMainMenuButton({
        scene: this.scene,
        x: 0,
        y: 60,
        text: '⚙️ Настройки',
        onClick: () => {
          // TODO: Открыть настройки
          console.log('Settings clicked');
        },
      });
      this.menuContainer.add(settingsButton);

      const exitButton = createMainMenuButton({
        scene: this.scene,
        x: 0,
        y: 140,
        text: '♿️ В главное меню',
        onClick: () => {
          if (window.confirm('Вы уверены, что хотите выйти в главное меню?')) {
            this.hide();
            // Останавливаем core перед переходом в главное меню
            this.core.stop();
            this.scene.scene.start('MenuScene');
          }
        },
      });
      this.menuContainer.add(exitButton);
    } else {
      this.menuContainer.setPosition(width / 2, height / 2);
      this.menuContainer.setVisible(true);
    }

    this.container.setVisible(true);
    this.isVisible = true;
  }

  /**
   * Скрыть модальное меню.
   */
  hide(): void {
    if (!this.isVisible) {
      return;
    }

    if (this.overlayBackground) {
      this.overlayBackground.setVisible(false);
    }

    if (this.menuContainer) {
      this.menuContainer.setVisible(false);
    }

    this.container.setVisible(false);
    this.isVisible = false;
  }

  /**
   * Проверка, видимо ли меню.
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Переключение видимости меню.
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  resize(): void {
    if (this.isVisible) {
      const { width, height } = this.scene.scale;

      if (this.overlayBackground) {
        this.overlayBackground.setSize(width, height);
        this.overlayBackground.setPosition(width / 2, height / 2);
      }

      if (this.menuContainer) {
        this.menuContainer.setPosition(width / 2, height / 2);
      }
    }
  }

  destroy(): void {
    if (this.overlayBackground) {
      this.overlayBackground.destroy();
      this.overlayBackground = undefined as unknown as Phaser.GameObjects.Rectangle;
    }

    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = undefined as unknown as Phaser.GameObjects.Container;
    }

    super.destroy();
  }
}

