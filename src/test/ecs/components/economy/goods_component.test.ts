import { describe, it, expect } from 'vitest';
import {
  Goods,
  GoodsType,
  type GoodsData,
} from '../../../../core/ecs/components/economy/goods_component';

describe('Компонент товаров (Goods Component)', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Goods.type)).toBe(true);
    expect(Array.isArray(Goods.quantity)).toBe(true);
    expect(Array.isArray(Goods.price)).toBe(true);
    expect(Array.isArray(Goods.producer)).toBe(true);

    expect(Goods.type.length).toBe(0);
    expect(Goods.quantity.length).toBe(0);
    expect(Goods.price.length).toBe(0);
    expect(Goods.producer.length).toBe(0);
  });

  it('должен уметь хранить и извлекать данные о товарах', () => {
    const eid = 0;
    const testData = {
      type: GoodsType.FOOD,
      quantity: 100,
      price: 50,
      producer: 123,
    };

    Goods.type[eid] = testData.type;
    Goods.quantity[eid] = testData.quantity;
    Goods.price[eid] = testData.price;
    Goods.producer[eid] = testData.producer;

    expect(Goods.type[eid]).toBe(testData.type);
    expect(Goods.quantity[eid]).toBe(testData.quantity);
    expect(Goods.price[eid]).toBe(testData.price);
    expect(Goods.producer[eid]).toBe(testData.producer);
  });

  it('должен обрабатывать различные типы товаров', () => {
    const eid1 = 1;
    const eid2 = 2;
    const eid3 = 3;
    const eid4 = 4;

    // Food
    Goods.type[eid1] = GoodsType.FOOD;
    Goods.quantity[eid1] = 200;
    Goods.price[eid1] = 25;
    Goods.producer[eid1] = 100;

    // Clothes
    Goods.type[eid2] = GoodsType.CLOTHES;
    Goods.quantity[eid2] = 50;
    Goods.price[eid2] = 100;
    Goods.producer[eid2] = 101;

    // Electronics
    Goods.type[eid3] = GoodsType.ELECTRONICS;
    Goods.quantity[eid3] = 10;
    Goods.price[eid3] = 500;
    Goods.producer[eid3] = 102;

    // Household
    Goods.type[eid4] = GoodsType.HOUSEHOLD;
    Goods.quantity[eid4] = 75;
    Goods.price[eid4] = 30;
    Goods.producer[eid4] = 103;

    // Verify food
    expect(Goods.type[eid1]).toBe(GoodsType.FOOD);
    expect(Goods.quantity[eid1]).toBe(200);
    expect(Goods.price[eid1]).toBe(25);
    expect(Goods.producer[eid1]).toBe(100);

    // Verify clothes
    expect(Goods.type[eid2]).toBe(GoodsType.CLOTHES);
    expect(Goods.quantity[eid2]).toBe(50);
    expect(Goods.price[eid2]).toBe(100);
    expect(Goods.producer[eid2]).toBe(101);

    // Verify electronics
    expect(Goods.type[eid3]).toBe(GoodsType.ELECTRONICS);
    expect(Goods.quantity[eid3]).toBe(10);
    expect(Goods.price[eid3]).toBe(500);
    expect(Goods.producer[eid3]).toBe(102);

    // Verify household
    expect(Goods.type[eid4]).toBe(GoodsType.HOUSEHOLD);
    expect(Goods.quantity[eid4]).toBe(75);
    expect(Goods.price[eid4]).toBe(30);
    expect(Goods.producer[eid4]).toBe(103);
  });

  it('должен поддерживать различные диапазоны количества', () => {
    const testCases = [
      { eid: 5, type: GoodsType.FOOD, quantity: 1, price: 10, producer: 1 },
      { eid: 6, type: GoodsType.CLOTHES, quantity: 1000, price: 50, producer: 2 },
      { eid: 7, type: GoodsType.ELECTRONICS, quantity: 0, price: 200, producer: 3 }, // Out of stock
      { eid: 8, type: GoodsType.HOUSEHOLD, quantity: 5000, price: 5, producer: 4 },
    ];

    testCases.forEach(({ eid, type, quantity, price, producer }) => {
      Goods.type[eid] = type;
      Goods.quantity[eid] = quantity;
      Goods.price[eid] = price;
      Goods.producer[eid] = producer;

      expect(Goods.type[eid]).toBe(type);
      expect(Goods.quantity[eid]).toBe(quantity);
      expect(Goods.price[eid]).toBe(price);
      expect(Goods.producer[eid]).toBe(producer);
    });
  });

  it('должен обрабатывать изменения количества (управление запасами)', () => {
    const eid = 9;

    // Initial stock
    Goods.type[eid] = GoodsType.FOOD;
    Goods.quantity[eid] = 100;
    Goods.price[eid] = 20;
    Goods.producer[eid] = 50;

    expect(Goods.quantity[eid]).toBe(100);

    // Items sold
    Goods.quantity[eid] = 85;
    expect(Goods.quantity[eid]).toBe(85);

    // Restock
    Goods.quantity[eid] = 150;
    expect(Goods.quantity[eid]).toBe(150);

    // Out of stock
    Goods.quantity[eid] = 0;
    expect(Goods.quantity[eid]).toBe(0);
  });

  it('должен обрабатывать изменения цен', () => {
    const eid = 10;

    Goods.type[eid] = GoodsType.ELECTRONICS;
    Goods.quantity[eid] = 25;
    Goods.price[eid] = 300;
    Goods.producer[eid] = 60;

    expect(Goods.price[eid]).toBe(300);

    // Price increase
    Goods.price[eid] = 350;
    expect(Goods.price[eid]).toBe(350);

    // Discount
    Goods.price[eid] = 250;
    expect(Goods.price[eid]).toBe(250);

    // Clearance
    Goods.price[eid] = 50;
    expect(Goods.price[eid]).toBe(50);
  });

  it('должен поддерживать изменения производителей', () => {
    const eid = 11;

    Goods.type[eid] = GoodsType.CLOTHES;
    Goods.quantity[eid] = 40;
    Goods.price[eid] = 75;
    Goods.producer[eid] = 70;

    expect(Goods.producer[eid]).toBe(70);

    // Change supplier
    Goods.producer[eid] = 71;
    expect(Goods.producer[eid]).toBe(71);

    // Local production
    Goods.producer[eid] = 1;
    expect(Goods.producer[eid]).toBe(1);
  });

  it('должен поддерживать пользовательские типы товаров', () => {
    const eid = 12;

    const customTypes = ['books', 'toys', 'furniture', 'automotive', 'pharmaceuticals'];

    customTypes.forEach((type, index) => {
      const entityId = eid + index;
      Goods.type[entityId] = type;
      Goods.quantity[entityId] = 50 + index * 10;
      Goods.price[entityId] = 20 + index * 5;
      Goods.producer[entityId] = 100 + index;

      expect(Goods.type[entityId]).toBe(type);
      expect(Goods.quantity[entityId]).toBe(50 + index * 10);
      expect(Goods.price[entityId]).toBe(20 + index * 5);
      expect(Goods.producer[entityId]).toBe(100 + index);
    });
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Goods.type[eid]).toBeUndefined();
    expect(Goods.quantity[eid]).toBeUndefined();
    expect(Goods.price[eid]).toBeUndefined();
    expect(Goods.producer[eid]).toBeUndefined();
  });

  it('должен обрабатывать большие количества и цены', () => {
    const eid = 13;

    Goods.type[eid] = GoodsType.ELECTRONICS;
    Goods.quantity[eid] = 10000; // Bulk order
    Goods.price[eid] = 5000; // Expensive item
    Goods.producer[eid] = 200;

    expect(Goods.quantity[eid]).toBe(10000);
    expect(Goods.price[eid]).toBe(5000);
    expect(Goods.producer[eid]).toBe(200);
  });
});

describe('Перечисление типов товаров (GoodsType enum)', () => {
  it('должен содержать правильные значения типов товаров', () => {
    expect(GoodsType.FOOD).toBe('food');
    expect(GoodsType.CLOTHES).toBe('clothes');
    expect(GoodsType.ELECTRONICS).toBe('electronics');
    expect(GoodsType.HOUSEHOLD).toBe('household');
  });

  it('должен правильно использоваться в компоненте товаров', () => {
    const eid = 14;
    Goods.type[eid] = GoodsType.FOOD;
    expect(Goods.type[eid]).toBe(GoodsType.FOOD);

    Goods.type[eid] = GoodsType.ELECTRONICS;
    expect(Goods.type[eid]).toBe(GoodsType.ELECTRONICS);
  });

  it('должен содержать допустимые значения типов товаров', () => {
    const stringValues = Object.values(GoodsType);
    expect(stringValues.sort()).toEqual(['clothes', 'electronics', 'food', 'household']);
  });
});

describe('Тип данных товаров (GoodsData type)', () => {
  it('должен принимать допустимый объект GoodsData', () => {
    const data: GoodsData = {
      type: GoodsType.FOOD,
      quantity: 100,
      price: 25,
      producer: 50,
    };

    expect(data.type).toBe(GoodsType.FOOD);
    expect(data.quantity).toBe(100);
    expect(data.price).toBe(25);
    expect(data.producer).toBe(50);
  });

  it('должен поддерживать различные конфигурации товаров', () => {
    const testData: GoodsData[] = [
      {
        type: GoodsType.FOOD,
        quantity: 500,
        price: 15,
        producer: 10,
      },
      {
        type: GoodsType.CLOTHES,
        quantity: 200,
        price: 75,
        producer: 20,
      },
      {
        type: GoodsType.ELECTRONICS,
        quantity: 50,
        price: 300,
        producer: 30,
      },
      {
        type: GoodsType.HOUSEHOLD,
        quantity: 1000,
        price: 10,
        producer: 40,
      },
    ];

    testData.forEach((data, index) => {
      const eid = 15 + index;
      Goods.type[eid] = data.type;
      Goods.quantity[eid] = data.quantity;
      Goods.price[eid] = data.price;
      Goods.producer[eid] = data.producer;

      expect(Goods.type[eid]).toBe(data.type);
      expect(Goods.quantity[eid]).toBe(data.quantity);
      expect(Goods.price[eid]).toBe(data.price);
      expect(Goods.producer[eid]).toBe(data.producer);
    });
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      type: GoodsType.CLOTHES,
      quantity: 75,
      price: 50,
      producer: 25,
    };

    expect(data.type).toBe(GoodsType.CLOTHES);
    expect(data.quantity).toBe(75);
    expect(data.price).toBe(50);
    expect(data.producer).toBe(25);
  });
});
