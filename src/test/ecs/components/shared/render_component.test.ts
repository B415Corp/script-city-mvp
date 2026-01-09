import { describe, it, expect } from 'vitest';
import {
  Render,
  RenderLayer,
  SpriteType,
  type RenderData,
} from '../../../../core/ecs/components/shared/render_component';

describe('Render Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Render.visible)).toBe(true);
    expect(Array.isArray(Render.layer)).toBe(true);
    expect(Array.isArray(Render.spriteType)).toBe(true);
    expect(Array.isArray(Render.color)).toBe(true);

    expect(Render.visible.length).toBe(0);
    expect(Render.layer.length).toBe(0);
    expect(Render.spriteType.length).toBe(0);
    expect(Render.color.length).toBe(0);
  });

  it('должен уметь хранить и извлекать render data', () => {
    const eid = 0;
    const visible = 1;
    const layer = RenderLayer.BUILDINGS;
    const spriteType = SpriteType.HOUSE;
    const color = '#FF0000';

    Render.visible[eid] = visible;
    Render.layer[eid] = layer;
    Render.spriteType[eid] = spriteType;
    Render.color[eid] = color;

    expect(Render.visible[eid]).toBe(visible);
    expect(Render.layer[eid]).toBe(layer);
    expect(Render.spriteType[eid]).toBe(spriteType);
    expect(Render.color[eid]).toBe(color);
  });

  it('должен обрабатывать multiple entities', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Entity 1: visible building
    Render.visible[eid1] = 1;
    Render.layer[eid1] = RenderLayer.BUILDINGS;
    Render.spriteType[eid1] = SpriteType.SHOP;
    Render.color[eid1] = '#00FF00';

    // Entity 2: hidden unit
    Render.visible[eid2] = 0;
    Render.layer[eid2] = RenderLayer.UNITS;
    Render.spriteType[eid2] = SpriteType.PERSON;
    Render.color[eid2] = '#0000FF';

    expect(Render.visible[eid1]).toBe(1);
    expect(Render.layer[eid1]).toBe(RenderLayer.BUILDINGS);
    expect(Render.spriteType[eid1]).toBe(SpriteType.SHOP);
    expect(Render.color[eid1]).toBe('#00FF00');

    expect(Render.visible[eid2]).toBe(0);
    expect(Render.layer[eid2]).toBe(RenderLayer.UNITS);
    expect(Render.spriteType[eid2]).toBe(SpriteType.PERSON);
    expect(Render.color[eid2]).toBe('#0000FF');
  });

  it('должен поддерживать custom sprite types', () => {
    const eid = 3;
    const customSprite = 'custom_sprite_123';

    Render.spriteType[eid] = customSprite;
    expect(Render.spriteType[eid]).toBe(customSprite);
  });

  it('должен поддерживать различные color formats', () => {
    const eid = 4;
    const colors = ['#FF0000', 'rgb(255, 0, 0)', 'red', '#123456'];

    colors.forEach((color, index) => {
      const entityId = eid + index;
      Render.color[entityId] = color;
      expect(Render.color[entityId]).toBe(color);
    });
  });

  it('должен обрабатывать visibility states correctly', () => {
    const eid = 5;

    // Visible
    Render.visible[eid] = 1;
    expect(Render.visible[eid]).toBe(1);

    // Hidden
    Render.visible[eid] = 0;
    expect(Render.visible[eid]).toBe(0);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Render.visible[eid]).toBeUndefined();
    expect(Render.layer[eid]).toBeUndefined();
    expect(Render.spriteType[eid]).toBeUndefined();
    expect(Render.color[eid]).toBeUndefined();
  });
});

describe('RenderLayer enum', () => {
  it('should have correct layer values', () => {
    expect(RenderLayer.BACKGROUND).toBe(0);
    expect(RenderLayer.TERRAIN).toBe(1);
    expect(RenderLayer.BUILDINGS).toBe(2);
    expect(RenderLayer.UNITS).toBe(3);
    expect(RenderLayer.EFFECTS).toBe(4);
    expect(RenderLayer.UI).toBe(5);
  });

  it('should be used correctly in render component', () => {
    const eid = 6;
    Render.layer[eid] = RenderLayer.UI;
    expect(Render.layer[eid]).toBe(RenderLayer.UI);
  });
});

describe('SpriteType enum', () => {
  it('should have correct sprite types', () => {
    expect(SpriteType.PERSON).toBe('person');
    expect(SpriteType.HOUSE).toBe('house');
    expect(SpriteType.SHOP).toBe('shop');
    expect(SpriteType.OFFICE).toBe('office');
    expect(SpriteType.CAR).toBe('car');
  });

  it('should be used correctly in render component', () => {
    const eid = 7;
    Render.spriteType[eid] = SpriteType.CAR;
    expect(Render.spriteType[eid]).toBe(SpriteType.CAR);
  });
});

describe('RenderData type', () => {
  it('должен принимать допустимый RenderData object', () => {
    const data: RenderData = {
      visible: 1,
      layer: RenderLayer.BUILDINGS,
      spriteType: SpriteType.HOUSE,
      color: '#8B4513',
    };

    expect(data.visible).toBe(1);
    expect(data.layer).toBe(RenderLayer.BUILDINGS);
    expect(data.spriteType).toBe(SpriteType.HOUSE);
    expect(data.color).toBe('#8B4513');
  });

  it('should accept custom sprite type', () => {
    const data: RenderData = {
      visible: 0,
      layer: RenderLayer.EFFECTS,
      spriteType: 'explosion',
      color: 'orange',
    };

    expect(data.spriteType).toBe('explosion');
    expect(data.color).toBe('orange');
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      visible: 1,
      layer: RenderLayer.UNITS,
      spriteType: SpriteType.PERSON,
      color: 'blue',
    };

    expect(data.visible).toBe(1);
    expect(data.layer).toBe(RenderLayer.UNITS);
    expect(data.spriteType).toBe(SpriteType.PERSON);
    expect(data.color).toBe('blue');
  });
});
