import { createWorld, addEntity, addComponent, World, EntityId } from 'bitecs';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Workplace,
} from '../../core/ecs/components';
import { ComponentManager } from '../../core/ecs/components/managers/component_manager';
/**
 * Простые test doubles для тестирования систем
 */
export class TestTimeProvider {
  constructor(private currentTime: number = 0) {}

  getCurrentTime(): number {
    return this.currentTime;
  }
  getCurrentDay(): number {
    return Math.floor(this.currentTime / (24 * 60));
  }
  getMinutesOfDay(): number {
    return this.currentTime % (24 * 60);
  }
  getHourOfDay(): number {
    return Math.floor(this.getMinutesOfDay() / 60);
  }
  setTime(time: number): void {
    this.currentTime = time;
  }
}

export class TestRandomProvider {
  private values: number[];
  private index: number = 0;

  constructor(values: number[] = [0.5]) {
    this.values = [...values];
  }

  random(): number {
    const value = this.values[this.index % this.values.length];
    this.index++;
    return value;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export class TestLogger {
  logs: string[] = [];

  info(message: string): void {
    this.logs.push(`INFO: ${message}`);
  }
  warn(message: string): void {
    this.logs.push(`WARN: ${message}`);
  }
  error(message: string): void {
    this.logs.push(`ERROR: ${message}`);
  }
  debug(message: string): void {
    this.logs.push(`DEBUG: ${message}`);
  }
}

export class TestEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Array<{ event: string; payload?: any }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, payload?: any): void {
    this.events.push({ event, payload });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (payload?: any) => void) {
    return { unsubscribe: () => {} };
  }
}

/**
 * Вспомогательный класс для тестирования bitECS компонентов
 * Упрощает создание тестовых миров и сущностей
 */
export class BitECSTestHelper {
  /**
   * Создает тестовый сценарий с ComponentManager
   */
  static createTestScenario() {
    const { world, entities } = this.createTestSetup();
    const componentManager = new ComponentManager(world);

    return {
      world,
      entities,
      componentManager,
    };
  }
  /**
   * Создает изолированный тестовый мир с указанным количеством сущностей
   */
  static createTestSetup(entityCount = 1) {
    const world = createWorld();
    const entities: EntityId[] = [];

    for (let i = 0; i < entityCount; i++) {
      entities.push(addEntity(world));
    }

    return { world, entities };
  }

  /**
   * Создает сущность с базовыми компонентами
   */
  static createBasicEntity(world: World): EntityId {
    const eid = addEntity(world);
    addComponent(world, eid, ID);
    addComponent(world, eid, Position);
    return eid;
  }

  /**
   * Создает жителя с базовыми компонентами
   */
  static createCitizenEntity(world: World): EntityId {
    const eid = this.createBasicEntity(world);

    // Добавляем компоненты жителя
    addComponent(world, eid, Person);
    addComponent(world, eid, Citizen);
    addComponent(world, eid, Needs);
    addComponent(world, eid, Schedule);
    addComponent(world, eid, Render);

    return eid;
  }

  /**
   * Создает рабочее место
   */
  static createWorkplaceEntity(world: World): EntityId {
    const eid = this.createBasicEntity(world);

    // Добавляем компоненты рабочего места
    addComponent(world, eid, Workplace);

    return eid;
  }

  /**
   * Устанавливает данные компонента Person
   */
  static setPersonData(
    eid: EntityId,
    data: {
      age?: number;
      gender?: number;
      name?: string;
      education?: number;
    },
  ) {
    if (data.age !== undefined) Person.age[eid] = data.age;
    if (data.gender !== undefined) Person.gender[eid] = data.gender;
    if (data.name !== undefined) Person.name[eid] = data.name;
    if (data.education !== undefined) Person.education[eid] = data.education;
  }

  /**
   * Устанавливает данные компонента Citizen
   */
  static setCitizenData(
    eid: EntityId,
    data: {
      happiness?: number;
      home?: number;
      workplace?: number;
      money?: number;
      energy?: number;
      housingType?: number;
      minimumExpenses?: number;
      salary?: number;
      isLookingForJob?: boolean;
      jobSearchAttempts?: number;
      lastJobSearchDay?: number;
      lastExpenseDay?: number;
    },
  ) {
    if (data.happiness !== undefined) Citizen.happiness[eid] = data.happiness;
    if (data.home !== undefined) Citizen.home[eid] = data.home;
    if (data.workplace !== undefined) Citizen.workplace[eid] = data.workplace;
    if (data.money !== undefined) Citizen.money[eid] = data.money;
    if (data.energy !== undefined) Citizen.energy[eid] = data.energy;
    if (data.housingType !== undefined) Citizen.housingType[eid] = data.housingType;
    if (data.minimumExpenses !== undefined) Citizen.minimumExpenses[eid] = data.minimumExpenses;
    if (data.salary !== undefined) Citizen.salary[eid] = data.salary;
    if (data.isLookingForJob !== undefined) Citizen.isLookingForJob[eid] = data.isLookingForJob;
    if (data.jobSearchAttempts !== undefined)
      Citizen.jobSearchAttempts[eid] = data.jobSearchAttempts;
    if (data.lastJobSearchDay !== undefined) Citizen.lastJobSearchDay[eid] = data.lastJobSearchDay;
    if (data.lastExpenseDay !== undefined) Citizen.lastExpenseDay[eid] = data.lastExpenseDay;
  }

  /**
   * Устанавливает данные компонента Needs
   */
  static setNeedsData(
    eid: EntityId,
    data: {
      food?: number;
      shopping?: number;
      work?: number;
      sleep?: number;
    },
  ) {
    if (data.food !== undefined) Needs.food[eid] = data.food;
    if (data.shopping !== undefined) Needs.shopping[eid] = data.shopping;
    if (data.work !== undefined) Needs.work[eid] = data.work;
    if (data.sleep !== undefined) Needs.sleep[eid] = data.sleep;
  }

  /**
   * Устанавливает позицию
   */
  static setPosition(eid: EntityId, x: number, y: number) {
    Position.x[eid] = x;
    Position.y[eid] = y;
  }

  /**
   * Получает данные компонента Person
   */
  static getPersonData(eid: EntityId) {
    return {
      age: Person.age[eid],
      gender: Person.gender[eid],
      name: Person.name[eid],
      education: Person.education[eid],
    };
  }

  /**
   * Получает данные компонента Citizen
   */
  static getCitizenData(eid: EntityId) {
    return {
      happiness: Citizen.happiness[eid],
      home: Citizen.home[eid],
      workplace: Citizen.workplace[eid],
      money: Citizen.money[eid],
      energy: Citizen.energy[eid],
      housingType: Citizen.housingType[eid],
      minimumExpenses: Citizen.minimumExpenses[eid],
      salary: Citizen.salary[eid],
      isLookingForJob: Citizen.isLookingForJob[eid],
      jobSearchAttempts: Citizen.jobSearchAttempts[eid],
      lastJobSearchDay: Citizen.lastJobSearchDay[eid],
      lastExpenseDay: Citizen.lastExpenseDay[eid],
    };
  }

  /**
   * Получает данные компонента Needs
   */
  static getNeedsData(eid: EntityId) {
    return {
      food: Needs.food[eid],
      shopping: Needs.shopping[eid],
      work: Needs.work[eid],
      sleep: Needs.sleep[eid],
    };
  }
}

// Test doubles уже экспортированы выше
