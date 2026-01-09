import { describe, it, expect, beforeEach } from 'vitest';
import { JobFactory } from '../../../core/ecs/entities/job_factory';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Job, Goods, GoodsType } from '../../../core/ecs/components';

describe('JobFactory', () => {
  let factory: JobFactory;
  let world: any;

  beforeEach(() => {
    world = BitECSTestHelper.createTestSetup().world;
    factory = new JobFactory(world);
  });

  describe('createJob', () => {
    it('должен создавать a job with correct components and data', () => {
      const jobData = {
        title: 'Программист',
        salary: 5000,
        requirements: ['higher_education', 'experience'],
        available: true,
      };

      const eid = factory.createJob(jobData);

      expect(Job.title[eid]).toBe('Программист');
      expect(Job.salary[eid]).toBe(5000);
      expect(Job.requirements[eid]).toEqual(['higher_education', 'experience']);
      expect(Job.available[eid]).toBe(true);
    });

    it('должен создавать job with minimal data', () => {
      const jobData = {
        title: 'Уборщик',
        salary: 200,
        requirements: ['basic_education'],
        available: false,
      };

      const eid = factory.createJob(jobData);

      expect(Job.title[eid]).toBe('Уборщик');
      expect(Job.salary[eid]).toBe(200);
      expect(Job.requirements[eid]).toEqual(['basic_education']);
      expect(Job.available[eid]).toBe(false);
    });
  });

  describe('createGoods', () => {
    it('должен создавать goods with correct components and data', () => {
      const goodsData = {
        type: GoodsType.FOOD,
        quantity: 100,
        price: 50,
        producer: 123,
      };

      const eid = factory.createGoods(goodsData);

      expect(Goods.type[eid]).toBe(GoodsType.FOOD);
      expect(Goods.quantity[eid]).toBe(100);
      expect(Goods.price[eid]).toBe(50);
      expect(Goods.producer[eid]).toBe(123);
    });

    it('должен создавать goods with different types', () => {
      const foodData = {
        type: GoodsType.FOOD,
        quantity: 200,
        price: 25,
        producer: 1,
      };

      const clothesData = {
        type: GoodsType.CLOTHES,
        quantity: 50,
        price: 100,
        producer: 2,
      };

      const electronicsData = {
        type: GoodsType.ELECTRONICS,
        quantity: 10,
        price: 500,
        producer: 3,
      };

      const foodEid = factory.createGoods(foodData);
      const clothesEid = factory.createGoods(clothesData);
      const electronicsEid = factory.createGoods(electronicsData);

      expect(Goods.type[foodEid]).toBe(GoodsType.FOOD);
      expect(Goods.type[clothesEid]).toBe(GoodsType.CLOTHES);
      expect(Goods.type[electronicsEid]).toBe(GoodsType.ELECTRONICS);
    });
  });

  describe('convenience methods', () => {
    describe('createCashierJob', () => {
      it('должен создавать a cashier job with default values', () => {
        const eid = factory.createCashierJob();

        expect(Job.title[eid]).toBe('Кассир');
        expect(Job.salary[eid]).toBe(300);
        expect(Job.requirements[eid]).toEqual(['basic_education']);
        expect(Job.available[eid]).toBe(true);
      });

      it('должен создавать a cashier job with custom salary', () => {
        const eid = factory.createCashierJob(400);

        expect(Job.title[eid]).toBe('Кассир');
        expect(Job.salary[eid]).toBe(400);
        expect(Job.requirements[eid]).toEqual(['basic_education']);
        expect(Job.available[eid]).toBe(true);
      });
    });

    describe('createOfficeJob', () => {
      it('должен создавать an office job with default values', () => {
        const eid = factory.createOfficeJob();

        expect(Job.title[eid]).toBe('Офисный работник');
        expect(Job.salary[eid]).toBe(500);
        expect(Job.requirements[eid]).toEqual(['higher_education']);
        expect(Job.available[eid]).toBe(true);
      });

      it('должен создавать an office job with custom salary', () => {
        const eid = factory.createOfficeJob(700);

        expect(Job.title[eid]).toBe('Офисный работник');
        expect(Job.salary[eid]).toBe(700);
        expect(Job.requirements[eid]).toEqual(['higher_education']);
        expect(Job.available[eid]).toBe(true);
      });
    });

    describe('createFoodGoods', () => {
      it('должен создавать food goods with default values', () => {
        const eid = factory.createFoodGoods();

        expect(Goods.type[eid]).toBe(GoodsType.FOOD);
        expect(Goods.quantity[eid]).toBe(100);
        expect(Goods.price[eid]).toBe(10);
        expect(Goods.producer[eid]).toBe(0);
      });

      it('должен создавать food goods with custom values', () => {
        const eid = factory.createFoodGoods(200, 15);

        expect(Goods.type[eid]).toBe(GoodsType.FOOD);
        expect(Goods.quantity[eid]).toBe(200);
        expect(Goods.price[eid]).toBe(15);
        expect(Goods.producer[eid]).toBe(0);
      });
    });

    describe('createClothesGoods', () => {
      it('должен создавать clothes goods with default values', () => {
        const eid = factory.createClothesGoods();

        expect(Goods.type[eid]).toBe(GoodsType.CLOTHES);
        expect(Goods.quantity[eid]).toBe(50);
        expect(Goods.price[eid]).toBe(50);
        expect(Goods.producer[eid]).toBe(0);
      });

      it('должен создавать clothes goods with custom values', () => {
        const eid = factory.createClothesGoods(75, 75);

        expect(Goods.type[eid]).toBe(GoodsType.CLOTHES);
        expect(Goods.quantity[eid]).toBe(75);
        expect(Goods.price[eid]).toBe(75);
        expect(Goods.producer[eid]).toBe(0);
      });
    });

    describe('createElectronicsGoods', () => {
      it('должен создавать electronics goods with default values', () => {
        const eid = factory.createElectronicsGoods();

        expect(Goods.type[eid]).toBe(GoodsType.ELECTRONICS);
        expect(Goods.quantity[eid]).toBe(25);
        expect(Goods.price[eid]).toBe(200);
        expect(Goods.producer[eid]).toBe(0);
      });

      it('должен создавать electronics goods with custom values', () => {
        const eid = factory.createElectronicsGoods(50, 300);

        expect(Goods.type[eid]).toBe(GoodsType.ELECTRONICS);
        expect(Goods.quantity[eid]).toBe(50);
        expect(Goods.price[eid]).toBe(300);
        expect(Goods.producer[eid]).toBe(0);
      });
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for jobs and goods', () => {
      const jobEid = factory.createCashierJob();
      const goodsEid = factory.createFoodGoods();

      // Проверяем что IDs разные (goods начинаются с 2000, jobs не имеют ID компонента)
      expect(jobEid).not.toBe(goodsEid);
    });
  });
});
