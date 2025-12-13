export interface ButtonConfig {
  xPos: number;
  yPos: number;
  w: number;
  h: number;
  text: string;
  depth: number;
  onClick?: () => void;
}

export class ButtonUI {
  private scene: Phaser.Scene;
  private button!: Phaser.GameObjects.Graphics;

  public container: Phaser.GameObjects.Container;
  public textObj!: Phaser.GameObjects.Text;

  public isHovered = false;
  public isPressed = false;
  public xPosition!: number;
  public yPosition!: number;
  public width!: number;
  public height!: number;

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    this.scene = scene;
    this.initializeButton(config);
    this.container = this.createContainer(config);
    this.setupInteractivity(config);
  }

  private initializeButton(config: ButtonConfig): void {
    const margin = { left: 0, right: 10, top: 0, bottom: 0 };
    this.height = config.h;
    this.width = config.w - (margin.right + margin.left);
    this.xPosition = config.xPos + margin.left;
    this.yPosition = config.yPos + margin.top;
  }

  private createContainer(config: ButtonConfig): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // Создаем graphics для кнопки
    this.button = this.scene.add.graphics();
    this.updateButtonAppearance();

    // Создаем текст
    this.textObj = this.scene.add
      .text(this.xPosition + this.width / 2, this.yPosition + this.height / 2, config.text, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5, 0.5);

    container.add(this.button);
    container.add(this.textObj);

    // Делаем контейнер интерактивным
    container.setInteractive(
      new Phaser.Geom.Rectangle(this.xPosition, this.yPosition, this.width, this.height),
      Phaser.Geom.Rectangle.Contains,
    );
    container.setDepth(config.depth);

    return container;
  }

  private setupInteractivity(config: ButtonConfig): void {
    // Обработчики событий
    this.container.on('pointerover', () => {
      this.isHovered = true;
      this.updateButtonAppearance();
      this.scene.input.setDefaultCursor('pointer');
    });

    this.container.on('pointerout', () => {
      this.isHovered = false;
      this.updateButtonAppearance();
      this.scene.input.setDefaultCursor('default');
    });

    this.container.on('pointerdown', () => {
      this.isPressed = true;
      this.updateButtonAppearance();
    });

    this.container.on('pointerup', () => {
      this.isPressed = false;
      this.updateButtonAppearance();

      // Вызываем callback при клике
      if (config.onClick) {
        config.onClick();
      }
    });
  }

  private updateButtonAppearance(): void {
    this.button.clear();

    let fillColor = 0x444444; // normal
    let strokeColor = 0x666666;

    if (this.isPressed) {
      fillColor = 0x222222; // pressed
      strokeColor = 0x888888;
    } else if (this.isHovered) {
      fillColor = 0x555555; // hover
      strokeColor = 0x999999;
    }

    this.button.fillStyle(fillColor, 1);
    this.button.fillRoundedRect(this.xPosition, this.yPosition, this.width, this.height, 10);
    this.button.lineStyle(2, strokeColor, 1);
    this.button.strokeRoundedRect(this.xPosition, this.yPosition, this.width, this.height, 10);
  }
}
