import { TabButton } from './tab.ui';

export interface TabConfig {
  text: string;
  onClick?: () => void;
}

export interface TabsConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  containerWidth: number;
  height: number;
  depth: number;
  tabs: TabConfig[];
  defaultActiveIndex?: number;
  paddingX?: number;
  gap?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
}

export class TabsGroup {
  private scene: Phaser.Scene;
  public tabs: TabButton[] = [];
  public activeIndex = 0;

  public container: Phaser.GameObjects.Container;

  private containerWidth: number;
  private height: number;
  private depth: number;
  private paddingX: number;
  private gap: number;
  private fontSize: number;
  private fontFamily: string;
  private fontColor: string;

  constructor(config: TabsConfig) {
    this.scene = config.scene;
    this.containerWidth = config.containerWidth;
    this.height = config.height;
    this.depth = config.depth;
    this.paddingX = config.paddingX ?? 16;
    this.gap = config.gap ?? 8;
    this.fontSize = config.fontSize ?? 20;
    this.fontFamily = config.fontFamily ?? 'monospace';
    this.fontColor = config.fontColor ?? '#ffffff';

    // общий контейнер табов, локально позиционируется относительно родителя [web:27][web:42]
    this.container = this.scene.add.container(config.x, config.y);
    this.container.setDepth(this.depth);
    this.container.setScrollFactor(0);

    this.createTabs(config.tabs, config.defaultActiveIndex ?? 0);
  }

  private createTabs(tabsConfig: TabConfig[], defaultActiveIndex: number): void {
    let currentX = 0;
    const maxX = this.containerWidth;

    tabsConfig.forEach((tabCfg, index) => {
      const tabButton = new TabButton(
        this.scene,
        currentX,
        0,
        this.height,
        tabCfg.text,
        this.depth + 1,
        this.paddingX,
        this.fontSize,
        this.fontFamily,
        this.fontColor,
        () => {
          this.setActiveTab(index);
          tabCfg.onClick && tabCfg.onClick();
        },
      );

      if (currentX + tabButton.width > maxX) {
        tabButton.container.destroy();
        tabButton.textObj.destroy();
        return;
      }

      this.tabs.push(tabButton);
      this.container.add(tabButton.container);

      currentX += tabButton.width + this.gap;
    });

    this.setActiveTab(defaultActiveIndex);
  }

  public setActiveTab(index: number): void {
    if (index < 0 || index >= this.tabs.length) return;

    this.tabs.forEach((tab, i) => {
      tab.setActive(i === index);
    });

    this.activeIndex = index;
  }
}
