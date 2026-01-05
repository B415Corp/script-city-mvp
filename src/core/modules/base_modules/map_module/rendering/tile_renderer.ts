import { getTextureType } from '@/core/scenes';
import { IsometricMath } from '../infrastructure/isometric_math';
import { DEFAULT_MAP } from '../infrastructure/maps/default_map';

export class TileRenderer {
  private container: Phaser.GameObjects.Container;
  private isometricMath: IsometricMath;

  constructor(
    private scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    private readonly tileWidth: number,
    private readonly tileHeight: number,
    private readonly gridWidth: number,
    private readonly gridHeight: number,
  ) {
    this.container = container;
    this.isometricMath = new IsometricMath(tileWidth, tileHeight);
  }

  public renderGrid(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.renderTile(x, y, DEFAULT_MAP.tiles[y][x]);
      }
    }
  }

  private renderTile(tileX: number, tileY: number, tileType: number): void {
    const textureKey = getTextureType(tileType);

    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`Texture ${textureKey} missing for tile ${tileX},${tileY}`);
      return;
    }

    const center = this.isometricMath.tileToScreen(tileX, tileY);
    const img = this.scene.add.image(center.x, center.y, textureKey);
    const texture = this.scene.textures.get(textureKey);

    img.setOrigin(0.5, 0.5);
    img.setScale(
      this.tileWidth / texture.source[0]?.width!,
      this.tileHeight / texture.source[0]?.height!,
    );

    const baseDepth = 10;
    const sortOffset = (tileY + tileX) * 0.01;
    img.setDepth(baseDepth + sortOffset);

    this.container.add(img);
  }

  public getTileInfo(tileX: number, tileY: number) {
    if (tileX < 0 || tileX >= this.gridWidth || tileY < 0 || tileY >= this.gridHeight) {
      return null;
    }

    const tileType = DEFAULT_MAP.tiles[tileY][tileX];
    const typeName = getTextureType(tileType);

    return { x: tileX, y: tileY, type: tileType, typeName };
  }

  public getIsometricMath(): IsometricMath {
    return this.isometricMath;
  }
}
