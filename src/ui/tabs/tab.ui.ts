export class TabButton {
  private scene: Phaser.Scene;
  private button: Phaser.GameObjects.Graphics;

  public container: Phaser.GameObjects.Container;
  public textObj: Phaser.GameObjects.Text;

  public isHovered = false;
  public isPressed = false;
  public isActive = false;

  public width: number;
  public height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    height: number,
    text: string,
    depth: number,
    paddingX: number,
    fontSize: number,
    fontFamily: string,
    fontColor: string,
    onClick?: () => void,
  ) {
    this.scene = scene;
    this.height = height;

    // контейнер таба, позиционируется СРАЗУ там, где нужен (локально для родителя)
    this.container = this.scene.add.container(x, y);
    this.container.setDepth(depth);
    this.container.setScrollFactor(0); // чтобы UI не зависел от камеры [web:72][web:86]

    // текст по центру, сначала без знания ширины кнопки
    this.textObj = this.scene.add
      .text(0, 0, text, {
        fontSize: `${fontSize}px`,
        color: fontColor,
        fontFamily,
      })
      .setOrigin(0.5, 0.5);

    const textWidth = this.textObj.width; // [web:32]
    this.width = textWidth + paddingX * 2;

    this.button = this.scene.add.graphics();
    this.updateAppearance();

    // теперь знаем размеры — ставим текст в центр кнопки
    this.textObj.setPosition(this.width / 2, this.height / 2);

    this.container.add(this.button);
    this.container.add(this.textObj);

    // размер контейнера и hitArea строго совпадают с отрисованной областью [web:23][web:38][web:79]
    this.container.setSize(this.width, this.height);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.width, this.height),
      Phaser.Geom.Rectangle.Contains,
    );

    this.container.on('pointerover', () => {
      this.isHovered = true;
      this.updateAppearance();
      this.scene.input.setDefaultCursor('pointer');
    });

    this.container.on('pointerout', () => {
      this.isHovered = false;
      this.updateAppearance();
      this.scene.input.setDefaultCursor('default');
    });

    this.container.on('pointerdown', () => {
      this.isPressed = true;
      this.updateAppearance();
    });

    this.container.on('pointerup', () => {
      this.isPressed = false;
      this.updateAppearance();
      onClick && onClick();
    });
  }

  public setActive(active: boolean): void {
    this.isActive = active;
    this.updateAppearance();
  }

  private updateAppearance(): void {
    this.button.clear();

    let fillColor = 0x444444;
    let strokeColor = 0x666666;

    if (this.isActive) {
      fillColor = 0x1a73e8;
      strokeColor = 0xffffff;
    } else if (this.isPressed) {
      fillColor = 0x222222;
      strokeColor = 0x888888;
    } else if (this.isHovered) {
      fillColor = 0x555555;
      strokeColor = 0x999999;
    }

    // всё рисуем в локальных координатах контейнера [0,0,width,height] [web:27][web:42][web:85]
    this.button.fillStyle(fillColor, 1);
    this.button.fillRoundedRect(0, 0, this.width, this.height, 10);
    this.button.lineStyle(2, strokeColor, 1);
    this.button.strokeRoundedRect(0, 0, this.width, this.height, 10);
  }
}
