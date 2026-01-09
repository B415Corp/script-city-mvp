import { addEntity, addComponent } from 'bitecs';
import { World, EntityId } from 'bitecs';
import {
  Residential,
  Commercial,
  Workplace,
  Position,
  ID,
  Render,
  type ResidentialData,
  type CommercialData,
  type WorkplaceData,
  type PositionData,
  type IdData,
  type RenderData,
  CommercialType,
  SpriteType,
  EducationLevel,
} from '../components';

/**
 * Фабрика для создания зданий
 */
export class BuildingFactory {
  private nextId = 1000; // Начинаем с 1000, чтобы отличать от жителей

  constructor(private world: World) {}

  /**
   * Создает жилой дом
   */
  createHouse(residentialData: ResidentialData, positionData: PositionData): EntityId {
    const eid = addEntity(this.world);

    // Добавляем компоненты
    addComponent(this.world, eid, Residential);
    addComponent(this.world, eid, Position);
    addComponent(this.world, eid, ID);
    addComponent(this.world, eid, Render);

    // Заполняем данные
    this.setResidentialData(eid, residentialData);
    this.setPositionData(eid, positionData);
    this.setIdData(eid, { value: this.nextId++ });
    this.setRenderData(eid, {
      visible: 1,
      layer: 2, // BUILDINGS layer
      spriteType: SpriteType.HOUSE,
      color: '#8B4513', // Коричневый для домов
    });

    return eid;
  }

  /**
   * Создает коммерческое здание (магазин или офис)
   */
  createCommercial(commercialData: CommercialData, positionData: PositionData): EntityId {
    const eid = addEntity(this.world);

    // Добавляем компоненты
    addComponent(this.world, eid, Commercial);
    addComponent(this.world, eid, Position);
    addComponent(this.world, eid, ID);
    addComponent(this.world, eid, Render);

    // Заполняем данные
    this.setCommercialData(eid, commercialData);
    this.setPositionData(eid, positionData);
    this.setIdData(eid, { value: this.nextId++ });
    this.setRenderData(eid, {
      visible: 1,
      layer: 2, // BUILDINGS layer
      spriteType: commercialData.type === CommercialType.SHOP ? SpriteType.SHOP : SpriteType.OFFICE,
      color: commercialData.type === CommercialType.SHOP ? '#32CD32' : '#4169E1', // Зеленый для магазинов, синий для офисов
    });

    return eid;
  }

  /**
   * Создает рабочее место
   */
  createWorkplace(workplaceData: WorkplaceData, positionData: PositionData): EntityId {
    const eid = addEntity(this.world);

    // Добавляем компоненты
    addComponent(this.world, eid, Workplace);
    addComponent(this.world, eid, Position);
    addComponent(this.world, eid, ID);
    addComponent(this.world, eid, Render);

    // Заполняем данные
    this.setWorkplaceData(eid, workplaceData);
    this.setPositionData(eid, positionData);
    this.setIdData(eid, { value: this.nextId++ });
    this.setRenderData(eid, {
      visible: 1,
      layer: 2, // BUILDINGS layer
      spriteType: SpriteType.OFFICE,
      color: '#708090', // Серый для рабочих мест
    });

    return eid;
  }

  /**
   * Создает простой дом на 15 человек
   */
  createSimpleHouse(positionData: PositionData): EntityId {
    const residentialData: ResidentialData = {
      capacity: 15,
      occupants: [],
      quality: 75,
    };

    return this.createHouse(residentialData, positionData);
  }

  /**
   * Создает простой магазин
   */
  createSimpleShop(positionData: PositionData): EntityId {
    const commercialData: CommercialData = {
      type: CommercialType.SHOP,
      inventory: {
        food: 100,
        clothes: 50,
        electronics: 25,
      },
      employees: [],
      customers: [],
    };

    return this.createCommercial(commercialData, positionData);
  }

  /**
   * Создает простое рабочее место
   */
  createSimpleOffice(positionData: PositionData, salary: number = 500): EntityId {
    const workplaceData: WorkplaceData = {
      jobType: 'office_work',
      salary,
      worker: undefined,
      building: 0, // Будет установлено позже
      minEducationLevel: EducationLevel.SECONDARY, // Минимум среднее образование
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  /**
   * Создает рабочее место кассира в магазине
   */
  createShopCashier(positionData: PositionData, salary: number = 300): EntityId {
    const workplaceData: WorkplaceData = {
      jobType: 'cashier',
      salary,
      worker: undefined,
      building: 0, // Будет установлено позже
      minEducationLevel: EducationLevel.PRIMARY, // Минимум начальное образование
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  /**
   * Создает рабочее место менеджера магазина
   */
  createShopManager(positionData: PositionData, salary: number = 450): EntityId {
    const workplaceData: WorkplaceData = {
      jobType: 'manager',
      salary,
      worker: undefined,
      building: 0, // Будет установлено позже
      minEducationLevel: EducationLevel.COLLEGE, // Минимум колледж
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  // Методы для установки данных компонентов
  private setResidentialData(eid: EntityId, data: ResidentialData) {
    Residential.capacity[eid] = data.capacity;
    Residential.occupants[eid] = [...data.occupants];
    Residential.quality[eid] = data.quality;
  }

  private setCommercialData(eid: EntityId, data: CommercialData) {
    Commercial.type[eid] = data.type;
    Commercial.inventory[eid] = { ...data.inventory };
    Commercial.employees[eid] = [...data.employees];
    Commercial.customers[eid] = [...data.customers];
  }

  private setWorkplaceData(eid: EntityId, data: WorkplaceData) {
    Workplace.jobType[eid] = data.jobType;
    Workplace.salary[eid] = data.salary;
    Workplace.worker[eid] = data.worker || 0;
    Workplace.building[eid] = data.building;
    Workplace.minEducationLevel[eid] = data.minEducationLevel;
  }

  private setPositionData(eid: EntityId, data: PositionData) {
    Position.x[eid] = data.x;
    Position.y[eid] = data.y;
  }

  private setIdData(eid: EntityId, data: IdData) {
    ID.value[eid] = data.value;
  }

  private setRenderData(eid: EntityId, data: RenderData) {
    Render.visible[eid] = data.visible;
    Render.layer[eid] = data.layer;
    Render.spriteType[eid] = data.spriteType;
    Render.color[eid] = data.color;
  }
}
