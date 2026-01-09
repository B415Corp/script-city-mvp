import { describe, it, expect, beforeEach } from 'vitest';
import { BuildingFactory } from '../../../core/ecs/entities/building_factory';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import {
  Residential,
  Commercial,
  Workplace,
  Position,
  ID,
  Render,
  CommercialType,
  SpriteType,
  EducationLevel,
} from '../../../core/ecs/components';

describe('BuildingFactory', () => {
  let factory: BuildingFactory;
  let world: any;

  beforeEach(() => {
    world = BitECSTestHelper.createTestSetup().world;
    factory = new BuildingFactory(world);
  });

  describe('createHouse', () => {
    it('должен создавать a house with correct components and data', () => {
      const residentialData = {
        capacity: 20,
        occupants: [1, 2, 3],
        quality: 85,
      };
      const positionData = { x: 10, y: 20 };

      const eid = factory.createHouse(residentialData, positionData);

      // Проверяем компоненты
      expect(Residential.capacity[eid]).toBe(20);
      expect(Residential.occupants[eid]).toEqual([1, 2, 3]);
      expect(Residential.quality[eid]).toBe(85);

      expect(Position.x[eid]).toBe(10);
      expect(Position.y[eid]).toBe(20);

      expect(ID.value[eid]).toBeGreaterThanOrEqual(1000);

      expect(Render.visible[eid]).toBe(1);
      expect(Render.layer[eid]).toBe(2);
      expect(Render.spriteType[eid]).toBe(SpriteType.HOUSE);
      expect(Render.color[eid]).toBe('#8B4513');
    });
  });

  describe('createCommercial', () => {
    it('должен создавать a shop with correct components and data', () => {
      const commercialData = {
        type: CommercialType.SHOP,
        inventory: {
          food: 100,
          clothes: 50,
          electronics: 25,
        },
        employees: [10, 11],
        customers: [20, 21, 22],
      };
      const positionData = { x: 30, y: 40 };

      const eid = factory.createCommercial(commercialData, positionData);

      // Проверяем компоненты
      expect(Commercial.type[eid]).toBe(CommercialType.SHOP);
      expect(Commercial.inventory[eid]).toEqual({
        food: 100,
        clothes: 50,
        electronics: 25,
      });
      expect(Commercial.employees[eid]).toEqual([10, 11]);
      expect(Commercial.customers[eid]).toEqual([20, 21, 22]);

      expect(Position.x[eid]).toBe(30);
      expect(Position.y[eid]).toBe(40);

      expect(Render.spriteType[eid]).toBe(SpriteType.SHOP);
      expect(Render.color[eid]).toBe('#32CD32'); // Зеленый для магазинов
    });

    it('должен создавать an office with correct components and data', () => {
      const commercialData = {
        type: CommercialType.OFFICE,
        inventory: {
          food: 0,
          clothes: 0,
          electronics: 10,
        },
        employees: [30],
        customers: [],
      };
      const positionData = { x: 50, y: 60 };

      const eid = factory.createCommercial(commercialData, positionData);

      expect(Commercial.type[eid]).toBe(CommercialType.OFFICE);
      expect(Render.spriteType[eid]).toBe(SpriteType.OFFICE);
      expect(Render.color[eid]).toBe('#4169E1'); // Синий для офисов
    });
  });

  describe('createWorkplace', () => {
    it('должен создавать a workplace with correct components and data', () => {
      const workplaceData = {
        jobType: 'Программист',
        salary: 5000,
        worker: 123,
        building: 456,
        minEducationLevel: EducationLevel.UNIVERSITY,
      };
      const positionData = { x: 70, y: 80 };

      const eid = factory.createWorkplace(workplaceData, positionData);

      // Проверяем компоненты
      expect(Workplace.jobType[eid]).toBe('Программист');
      expect(Workplace.salary[eid]).toBe(5000);
      expect(Workplace.worker[eid]).toBe(123);
      expect(Workplace.building[eid]).toBe(456);
      expect(Workplace.minEducationLevel[eid]).toBe(EducationLevel.UNIVERSITY);

      expect(Position.x[eid]).toBe(70);
      expect(Position.y[eid]).toBe(80);

      expect(Render.spriteType[eid]).toBe(SpriteType.OFFICE);
      expect(Render.color[eid]).toBe('#708090'); // Серый для рабочих мест
    });
  });

  describe('convenience methods', () => {
    describe('createSimpleHouse', () => {
      it('должен создавать a simple house with default values', () => {
        const positionData = { x: 100, y: 200 };

        const eid = factory.createSimpleHouse(positionData);

        expect(Residential.capacity[eid]).toBe(15);
        expect(Residential.occupants[eid]).toEqual([]);
        expect(Residential.quality[eid]).toBe(75);

        expect(Position.x[eid]).toBe(100);
        expect(Position.y[eid]).toBe(200);
      });
    });

    describe('createSimpleShop', () => {
      it('должен создавать a simple shop with default inventory', () => {
        const positionData = { x: 150, y: 250 };

        const eid = factory.createSimpleShop(positionData);

        expect(Commercial.type[eid]).toBe(CommercialType.SHOP);
        expect(Commercial.inventory[eid]).toEqual({
          food: 100,
          clothes: 50,
          electronics: 25,
        });
        expect(Commercial.employees[eid]).toEqual([]);
        expect(Commercial.customers[eid]).toEqual([]);

        expect(Position.x[eid]).toBe(150);
        expect(Position.y[eid]).toBe(250);
      });
    });

    describe('createSimpleOffice', () => {
      it('должен создавать a simple office with default values', () => {
        const positionData = { x: 300, y: 400 };

        const eid = factory.createSimpleOffice(positionData, 600);

        expect(Workplace.jobType[eid]).toBe('office_work');
        expect(Workplace.salary[eid]).toBe(600);
        expect(Workplace.worker[eid]).toBe(0);
        expect(Workplace.building[eid]).toBe(0);
        expect(Workplace.minEducationLevel[eid]).toBe(EducationLevel.SECONDARY);

        expect(Position.x[eid]).toBe(300);
        expect(Position.y[eid]).toBe(400);
      });

      it('should use default salary when not provided', () => {
        const positionData = { x: 350, y: 450 };

        const eid = factory.createSimpleOffice(positionData);

        expect(Workplace.salary[eid]).toBe(500);
      });
    });

    describe('createShopCashier', () => {
      it('должен создавать a cashier position with correct requirements', () => {
        const positionData = { x: 400, y: 500 };

        const eid = factory.createShopCashier(positionData, 350);

        expect(Workplace.jobType[eid]).toBe('cashier');
        expect(Workplace.salary[eid]).toBe(350);
        expect(Workplace.minEducationLevel[eid]).toBe(EducationLevel.PRIMARY);
      });

      it('should use default salary when not provided', () => {
        const positionData = { x: 450, y: 550 };

        const eid = factory.createShopCashier(positionData);

        expect(Workplace.salary[eid]).toBe(300);
      });
    });

    describe('createShopManager', () => {
      it('должен создавать a manager position with correct requirements', () => {
        const positionData = { x: 500, y: 600 };

        const eid = factory.createShopManager(positionData, 550);

        expect(Workplace.jobType[eid]).toBe('manager');
        expect(Workplace.salary[eid]).toBe(550);
        expect(Workplace.minEducationLevel[eid]).toBe(EducationLevel.COLLEGE);
      });

      it('should use default salary when not provided', () => {
        const positionData = { x: 550, y: 650 };

        const eid = factory.createShopManager(positionData);

        expect(Workplace.salary[eid]).toBe(450);
      });
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for different buildings', () => {
      const positionData = { x: 0, y: 0 };

      const eid1 = factory.createSimpleHouse(positionData);
      const eid2 = factory.createSimpleShop(positionData);
      const eid3 = factory.createSimpleOffice(positionData);

      const id1 = ID.value[eid1];
      const id2 = ID.value[eid2];
      const id3 = ID.value[eid3];

      expect(id1).toBeGreaterThanOrEqual(1000);
      expect(id2).toBe(id1 + 1);
      expect(id3).toBe(id2 + 1);
    });
  });
});
