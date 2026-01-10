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
      spriteType: 1, // индекс спрайта дома
      color: 1, // индекс цвета (коричневый)
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
      spriteType: commercialData.type === CommercialType.SHOP ? 2 : 3, // индекс спрайта магазина или офиса
      color: commercialData.type === CommercialType.SHOP ? 2 : 3, // индекс цвета (зеленый/синий)
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
      spriteType: 3, // индекс спрайта офиса
      color: 4, // индекс цвета (серый)
    });

    return eid;
  }

  /**
   * Создает простой дом на 15 человек
   */
  createSimpleHouse(positionData: PositionData): EntityId {
    const residentialData: ResidentialData = {
      capacity: 15,
      occupied: 0, // количество текущих жителей
      quality: 75,
      buildingId: 0,
      rent: 150,
    };

    return this.createHouse(residentialData, positionData);
  }

  /**
   * Создает простой магазин
   */
  createSimpleShop(positionData: PositionData): EntityId {
    const commercialData: CommercialData = {
      type: CommercialType.SHOP,
      buildingId: 0,
      inventorySize: 175, // общий размер инвентаря (100+50+25)
      employeeCount: 0, // количество сотрудников
      customerCount: 0, // количество клиентов
      dailyRevenue: 0,
    };

    return this.createCommercial(commercialData, positionData);
  }

  /**
   * Создает простое рабочее место
   */
  createSimpleOffice(positionData: PositionData, salary: number = 500): EntityId {
    const workplaceData: WorkplaceData = {
      capacity: 5, // максимум 5 работников
      occupied: 0, // текущих работников
      buildingId: 0, // будет установлено позже
      salary,
      type: 1, // тип работы (офис)
      minEducationLevel: 2, // минимум среднее образование
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  /**
   * Создает рабочее место кассира в магазине
   */
  createShopCashier(positionData: PositionData, salary: number = 300): EntityId {
    const workplaceData: WorkplaceData = {
      capacity: 1, // только 1 кассир
      occupied: 0,
      buildingId: 0, // будет установлено позже
      salary,
      type: 0, // тип работы (кассир)
      minEducationLevel: 1, // минимум начальное образование
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  /**
   * Создает рабочее место менеджера магазина
   */
  createShopManager(positionData: PositionData, salary: number = 450): EntityId {
    const workplaceData: WorkplaceData = {
      capacity: 1, // только 1 менеджер
      occupied: 0,
      buildingId: 0, // будет установлено позже
      salary,
      type: 2, // тип работы (менеджер)
      minEducationLevel: 4, // минимум колледж
    };

    return this.createWorkplace(workplaceData, positionData);
  }

  // Методы для установки данных компонентов
  private setResidentialData(eid: EntityId, data: ResidentialData) {
    Residential.capacity[eid] = data.capacity;
    Residential.occupied[eid] = data.occupied;
    Residential.quality[eid] = data.quality;
    Residential.buildingId[eid] = data.buildingId;
    Residential.rent[eid] = data.rent;
  }

  private setCommercialData(eid: EntityId, data: CommercialData) {
    Commercial.type[eid] = data.type;
    Commercial.buildingId[eid] = data.buildingId;
    Commercial.inventorySize[eid] = data.inventorySize;
    Commercial.employeeCount[eid] = data.employeeCount;
    Commercial.customerCount[eid] = data.customerCount;
    Commercial.dailyRevenue[eid] = data.dailyRevenue;
  }

  private setWorkplaceData(eid: EntityId, data: WorkplaceData) {
    Workplace.capacity[eid] = data.capacity;
    Workplace.occupied[eid] = data.occupied;
    Workplace.buildingId[eid] = data.buildingId;
    Workplace.salary[eid] = data.salary;
    Workplace.type[eid] = data.type;
    Workplace.minEducationLevel[eid] = data.minEducationLevel;
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
