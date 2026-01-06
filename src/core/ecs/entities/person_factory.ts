import { addEntity, addComponent } from 'bitecs';
import { World, EntityId } from 'bitecs';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Gender,
  type PersonData,
  type CitizenData,
  type NeedsData,
  type PositionData,
  type IdData,
  type RenderData,
  SpriteType,
} from '../components';

/**
 * Фабрика для создания жителей
 */
export class PersonFactory {
  private nextId = 1;

  constructor(private world: World) {}

  /**
   * Создает жителя с базовыми компонентами
   */
  create(
    personData: PersonData,
    citizenData: CitizenData,
    positionData: PositionData,
    homeId?: EntityId,
  ): EntityId {
    const eid = addEntity(this.world);

    // Добавляем компоненты
    addComponent(this.world, eid, Person);
    addComponent(this.world, eid, Citizen);
    addComponent(this.world, eid, Needs);
    addComponent(this.world, eid, Position);
    addComponent(this.world, eid, ID);
    addComponent(this.world, eid, Render);

    // Заполняем данные
    this.setPersonData(eid, personData);
    this.setCitizenData(eid, citizenData);
    this.setNeedsData(eid, { food: 50, shopping: 30, work: 20, sleep: 20 });
    this.setPositionData(eid, positionData);
    this.setIdData(eid, { value: this.nextId++ });
    this.setRenderData(eid, {
      visible: 1,
      layer: 3, // UNITS layer
      spriteType: SpriteType.PERSON,
      color: personData.gender === Gender.MALE ? '#4A90E2' : '#E94B3C',
    });

    // Связываем с домом если указан
    if (homeId !== undefined) {
      citizenData.home = homeId;
      this.setCitizenData(eid, citizenData);
    }

    return eid;
  }

  /**
   * Создает случайного жителя
   */
  createRandom(positionData: PositionData, homeId?: EntityId): EntityId {
    const gender = Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE;
    const age = 18 + Math.random() * 60; // 18-78 лет

    const personData: PersonData = {
      age,
      gender,
      name: this.generateName(gender),
    };

    const citizenData: CitizenData = {
      happiness: 70 + Math.random() * 30, // 70-100
      home: homeId || 0,
      workplace: undefined,
      money: 100 + Math.random() * 900, // 100-1000
      energy: 80 + Math.random() * 20, // 80-100
    };

    return this.create(personData, citizenData, positionData, homeId);
  }

  /**
   * Генерирует имя в зависимости от пола
   */
  private generateName(gender: Gender): string {
    const maleNames = [
      'Александр',
      'Дмитрий',
      'Иван',
      'Михаил',
      'Сергей',
      'Андрей',
      'Алексей',
      'Николай',
    ];
    const femaleNames = [
      'Анна',
      'Елена',
      'Мария',
      'Ольга',
      'Татьяна',
      'Ирина',
      'Наталья',
      'Светлана',
    ];

    const names = gender === Gender.MALE ? maleNames : femaleNames;
    return names[Math.floor(Math.random() * names.length)];
  }

  // Методы для установки данных компонентов
  private setPersonData(eid: EntityId, data: PersonData) {
    Person.age[eid] = data.age;
    Person.gender[eid] = data.gender;
    Person.name[eid] = data.name;
  }

  private setCitizenData(eid: EntityId, data: CitizenData) {
    Citizen.happiness[eid] = data.happiness;
    Citizen.home[eid] = data.home;
    Citizen.workplace[eid] = data.workplace || 0;
    Citizen.money[eid] = data.money;
    Citizen.energy[eid] = data.energy;
  }

  private setNeedsData(eid: EntityId, data: NeedsData) {
    Needs.food[eid] = data.food;
    Needs.shopping[eid] = data.shopping;
    Needs.work[eid] = data.work;
    Needs.sleep[eid] = data.sleep;
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
