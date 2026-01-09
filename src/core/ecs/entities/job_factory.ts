import { addEntity, addComponent } from 'bitecs';
import { World, EntityId } from 'bitecs';
import { Job, Goods, type JobData, type GoodsData, GoodsType } from '../components';
import { EducationLevel } from '../components/population/person_component';

/**
 * Фабрика для создания рабочих мест и товаров
 */
export class JobFactory {
  private nextId = 2000; // Начинаем с 2000 для товаров

  constructor(private world: World) {}

  /**
   * Создает вакансию
   */
  createJob(jobData: JobData): EntityId {
    const eid = addEntity(this.world);

    addComponent(this.world, eid, Job);

    this.setJobData(eid, jobData);

    return eid;
  }

  /**
   * Создает товар
   */
  createGoods(goodsData: GoodsData): EntityId {
    const eid = addEntity(this.world);

    addComponent(this.world, eid, Goods);

    this.setGoodsData(eid, goodsData);

    return eid;
  }

  /**
   * Создает базовую вакансию кассира
   */
  createCashierJob(salary: number = 300): EntityId {
    const jobData: JobData = {
      title: 'Кассир',
      salary,
      requirements: ['basic_education'],
      available: true,
    };

    return this.createJob(jobData);
  }

  /**
   * Создает вакансию офисного работника
   */
  createOfficeJob(salary: number = 500): EntityId {
    const jobData: JobData = {
      title: 'Офисный работник',
      salary,
      requirements: ['higher_education'],
      available: true,
    };

    return this.createJob(jobData);
  }

  /**
   * Создает товар еды
   */
  createFoodGoods(quantity: number = 100, price: number = 10): EntityId {
    const goodsData: GoodsData = {
      type: GoodsType.FOOD,
      quantity,
      price,
      producer: 0, // Магазин-источник
    };

    return this.createGoods(goodsData);
  }

  /**
   * Создает товар одежды
   */
  createClothesGoods(quantity: number = 50, price: number = 50): EntityId {
    const goodsData: GoodsData = {
      type: GoodsType.CLOTHES,
      quantity,
      price,
      producer: 0, // Магазин-источник
    };

    return this.createGoods(goodsData);
  }

  /**
   * Создает товар электроники
   */
  createElectronicsGoods(quantity: number = 25, price: number = 200): EntityId {
    const goodsData: GoodsData = {
      type: GoodsType.ELECTRONICS,
      quantity,
      price,
      producer: 0, // Магазин-источник
    };

    return this.createGoods(goodsData);
  }

  // Методы для установки данных компонентов
  private setJobData(eid: EntityId, data: JobData) {
    Job.title[eid] = data.title;
    Job.salary[eid] = data.salary;
    Job.requirements[eid] = [...data.requirements];
    Job.available[eid] = data.available;
  }

  private setGoodsData(eid: EntityId, data: GoodsData) {
    Goods.type[eid] = data.type;
    Goods.quantity[eid] = data.quantity;
    Goods.price[eid] = data.price;
    Goods.producer[eid] = data.producer;
  }
}
