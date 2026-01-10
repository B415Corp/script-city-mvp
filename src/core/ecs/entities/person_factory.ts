import { addEntity, addComponent } from 'bitecs';
import { World, EntityId } from 'bitecs';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Gender,
  EducationLevel,
  HousingType,
  type PersonData,
  type CitizenData,
  type NeedsData,
  type PositionData,
  type IdData,
  type RenderData,
  type ScheduleData,
  SpriteType,
  DEFAULT_SCHEDULES,
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

    // Используем .create() методы для компонентов
    Person.create(this.world, eid, {
      age: personData.age,
      gender: personData.gender,
      firstName: personData.firstName,
      lastName: personData.lastName,
    });

    Citizen.create(this.world, eid, {
      happiness: citizenData.happiness,
      home: homeId || citizenData.home,
      workplace: citizenData.workplace || 0,
      money: citizenData.money,
      energy: citizenData.energy,
      housingType: citizenData.housingType,
      minimumExpenses: citizenData.minimumExpenses,
      salary: citizenData.salary,
      lastWorkDay: citizenData.lastWorkDay || 0,
      isLookingForJob: citizenData.isLookingForJob ? 1 : 0,
      jobSearchAttempts: citizenData.jobSearchAttempts,
      lastJobSearchDay: citizenData.lastJobSearchDay,
      lastExpenseDay: citizenData.lastExpenseDay,
      isHomeless: citizenData.isHomeless || 0,
      age: citizenData.age,
      education: citizenData.education,
      experience: citizenData.experience || 0,
      skills: citizenData.skills || 0,
    });

    Needs.create(this.world, eid, {
      food: 50,
      shopping: 30,
      work: 20,
      sleep: 20,
    });

    Schedule.create(this.world, eid, {
      currentPhase: 4, // night
      currentActivity: 0, // idle
      activityExecuted: 0,
      nextActivityTime: 0,
      entityType: 0, // citizen
    });

    Position.create(this.world, eid, positionData);

    ID.create(this.world, eid, {
      value: this.nextId++,
    });

    Render.create(this.world, eid, {
      visible: 1,
      layer: 3, // UNITS layer
      spriteType: 0, // PERSON
      color: 0, // default color index
    });

    return eid;
  }

  /**
   * Создает случайного жителя
   */
  createRandom(positionData: PositionData, homeId?: EntityId): EntityId {
    const gender = Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE;
    const age = 18 + Math.random() * 60; // 18-78 лет
    const education = this.generateRandomEducation(age);

    const personData: PersonData = {
      age,
      gender,
      firstName: this.getRandomNameIndex(),
      lastName: this.getRandomLastNameIndex(),
    };

    const housingType = Math.random() < 0.7 ? HousingType.OWNED : HousingType.RENTED;
    const rentCost = housingType === HousingType.RENTED ? 200 + Math.random() * 300 : 0; // Аренда 200-500
    const foodCost = 150 + Math.random() * 200; // Еда 150-350
    const minimumExpenses = rentCost + foodCost;

    const citizenData: CitizenData = {
      happiness: 70 + Math.random() * 30, // 70-100
      home: homeId || 0,
      workplace: 0,
      money: 100 + Math.random() * 900, // 100-1000
      energy: 80 + Math.random() * 20, // 80-100
      housingType,
      minimumExpenses,
      salary: 0, // Пока нет работы
      lastWorkDay: 0,
      isLookingForJob: 1, // Начинает с поиска работы
      jobSearchAttempts: 0,
      lastJobSearchDay: 0,
      lastExpenseDay: 0,
      isHomeless: homeId ? 0 : 1,
      age,
      education,
      experience: 0,
      skills: 0,
    };

    return this.create(personData, citizenData, positionData, homeId);
  }

  /**
   * Генерирует имя в зависимости от пола
   */
  private getRandomNameIndex(): number {
    // Возвращаем случайный индекс имени (0-999 для простоты)
    // В реальном приложении здесь был бы массив имен
    return Math.floor(Math.random() * 1000);
  }

  /**
   * Генерирует фамилию
   */
  private getRandomLastNameIndex(): number {
    // Возвращаем случайный индекс фамилии (0-999 для простоты)
    // В реальном приложении здесь был бы массив фамилий
    return Math.floor(Math.random() * 1000);
  }

  /**
   * Генерирует случайный уровень образования в зависимости от возраста
   */
  private generateRandomEducation(age: number): EducationLevel {
    // Распределение образования по возрастам
    if (age < 25) {
      // Молодежь - чаще имеют высшее образование
      const rand = Math.random();
      if (rand < 0.3) return EducationLevel.NONE;
      if (rand < 0.5) return EducationLevel.PRIMARY;
      if (rand < 0.7) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else if (age < 45) {
      // Средний возраст - смешанное образование
      const rand = Math.random();
      if (rand < 0.2) return EducationLevel.NONE;
      if (rand < 0.4) return EducationLevel.PRIMARY;
      if (rand < 0.6) return EducationLevel.SECONDARY;
      if (rand < 0.8) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    } else {
      // Старшее поколение - чаще низкое образование
      const rand = Math.random();
      if (rand < 0.4) return EducationLevel.NONE;
      if (rand < 0.6) return EducationLevel.PRIMARY;
      if (rand < 0.8) return EducationLevel.SECONDARY;
      if (rand < 0.9) return EducationLevel.COLLEGE;
      return EducationLevel.UNIVERSITY;
    }
  }

  // Старые методы установки данных больше не нужны - используем .create() методы компонентов
}
