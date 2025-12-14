export interface TabConfig {
  text: string;
  onClick?: () => void;
}

export interface TabsConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  containerWidth: number; // ширина области табов
  height: number; // высота таба
  depth: number;
  tabs: TabConfig[];
  defaultActiveIndex?: number;
  paddingX?: number; // горизонтальный паддинг текста
  gap?: number; // расстояние между табами
  fontSize?: number; // размер шрифта в px
  fontFamily?: string; // шрифт
  fontColor?: string; // цвет текста
}
