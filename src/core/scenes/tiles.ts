type TilesType = Record<number, string>;

const Tiles: TilesType = {
  1: 'GRASS_BASE_0',
  2: 'SAND_BASE_0',
  3: 'SNOW_BASE_0',
  4: 'FOREST_BASE_0',
  5: 'MOUNTAIN_BASE_0',
};

function getTextureType(typeId: number): string {
  return Tiles[typeId] || 'UNKNOW';
}

export { getTextureType, Tiles };
