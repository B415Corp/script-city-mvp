import { World } from 'bitecs';
import { EntityFactory } from './index';
import { Gender } from '../components';

/**
 * Инициализатор MVP симуляции
 * Создает начальное состояние: жителей, здания, работу
 */
export class MVPInitializer {
  constructor(
    private world: World,
    private entityFactory: EntityFactory,
  ) {}

  /**
   * Создает полную MVP симуляцию
   */
  initialize(): MVPSetup {
    console.log('🏗️ Initializing MVP simulation...');

    // Создаем здания
    const buildings = this.entityFactory.buildings;
    const jobs = this.entityFactory.jobs;

    const house = buildings.createSimpleHouse({ x: 100, y: 100 });
    const foodShop = buildings.createSimpleShop({ x: 200, y: 100 });
    const goodsShop = buildings.createSimpleShop({ x: 300, y: 100 });

    // Создаем рабочие места
    const workplaces = [
      buildings.createSimpleOffice({ x: 150, y: 200 }, 400), // Кассир в продуктовом
      buildings.createSimpleOffice({ x: 250, y: 200 }, 450), // Кассир в магазине товаров
      buildings.createSimpleOffice({ x: 350, y: 200 }, 500), // Офисный работник
      buildings.createSimpleOffice({ x: 150, y: 300 }, 550), // Офисный работник
      buildings.createSimpleOffice({ x: 250, y: 300 }, 600), // Офисный работник
    ];

    // Создаем жителей (5 мужчин + 5 женщин)
    const citizens = this.createCitizens(house);

    console.log(
      `✅ Created: ${citizens.length} citizens, 1 house, 2 shops, ${workplaces.length} workplaces`,
    );

    return {
      house,
      shops: [foodShop, goodsShop],
      workplaces,
      citizens,
    };
  }

  /**
   * Создает 10 жителей и размещает их в доме
   */
  private createCitizens(houseId: number): number[] {
    const citizens: number[] = [];

    // Создаем 5 мужчин
    for (let i = 0; i < 5; i++) {
      const citizen = this.entityFactory.persons.createRandom(
        { x: 100 + i * 20, y: 120 + i * 10 },
        houseId,
      );
      citizens.push(citizen);
    }

    // Создаем 5 женщин
    for (let i = 0; i < 5; i++) {
      const citizen = this.entityFactory.persons.createRandom(
        { x: 100 + i * 20, y: 140 + i * 10 },
        houseId,
      );
      citizens.push(citizen);
    }

    return citizens;
  }

  /**
   * Распределяет жителей по рабочим местам
   */
  assignJobs(citizens: number[], workplaces: number[]): void {
    // Простая логика распределения работы
    const availableWorkplaces = [...workplaces];

    for (const citizenId of citizens) {
      if (availableWorkplaces.length === 0) break;

      // Назначаем случайное рабочее место
      const workplaceIndex = Math.floor(Math.random() * availableWorkplaces.length);
      const workplaceId = availableWorkplaces.splice(workplaceIndex, 1)[0];

      // TODO: Установить workplace для гражданина
      // Это потребует обновления Citizen компонента
      console.log(`Assigned citizen ${citizenId} to workplace ${workplaceId}`);
    }
  }
}

/**
 * Структура начального состояния MVP
 */
export interface MVPSetup {
  /** Дом для жителей */
  house: number;
  /** Магазины */
  shops: number[];
  /** Рабочие места */
  workplaces: number[];
  /** Жители */
  citizens: number[];
}
