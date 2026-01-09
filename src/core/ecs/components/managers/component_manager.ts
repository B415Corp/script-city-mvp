import { World, EntityId } from 'bitecs';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Workplace,
  type PersonData,
  type CitizenData,
  type NeedsData,
  type PositionData,
  type IdData,
  type RenderData,
  type ScheduleData,
  type WorkplaceData,
} from '../index';

/**
 * Component Manager - изолированный интерфейс для работы с компонентами
 * Позволяет тестировать логику компонентов без глобального состояния
 */
export class ComponentManager {
  constructor(private world: World) {}

  // Person Component
  getPerson(eid: EntityId): PersonData {
    return {
      age: Person.age[eid] || 0,
      gender: Person.gender[eid] || 0,
      name: Person.name[eid] || '',
      education: Person.education[eid] || 0,
    };
  }

  setPerson(eid: EntityId, data: Partial<PersonData>): void {
    if (data.age !== undefined) Person.age[eid] = data.age;
    if (data.gender !== undefined) Person.gender[eid] = data.gender;
    if (data.name !== undefined) Person.name[eid] = data.name;
    if (data.education !== undefined) Person.education[eid] = data.education;
  }

  // Citizen Component
  getCitizen(eid: EntityId): CitizenData {
    return {
      happiness: Citizen.happiness[eid] || 0,
      home: Citizen.home[eid] || 0,
      workplace: Citizen.workplace[eid] || 0,
      money: Citizen.money[eid] || 0,
      energy: Citizen.energy[eid] || 0,
      housingType: Citizen.housingType[eid] || 0,
      minimumExpenses: Citizen.minimumExpenses[eid] || 0,
      salary: Citizen.salary[eid] || 0,
      isLookingForJob: Citizen.isLookingForJob[eid] || false,
      jobSearchAttempts: Citizen.jobSearchAttempts[eid] || 0,
      lastJobSearchDay: Citizen.lastJobSearchDay[eid] || 0,
      lastExpenseDay: Citizen.lastExpenseDay[eid] || 0,
    };
  }

  setCitizen(eid: EntityId, data: Partial<CitizenData>): void {
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

  // Needs Component
  getNeeds(eid: EntityId): NeedsData {
    return {
      food: Needs.food[eid] || 0,
      shopping: Needs.shopping[eid] || 0,
      work: Needs.work[eid] || 0,
      sleep: Needs.sleep[eid] || 0,
    };
  }

  setNeeds(eid: EntityId, data: Partial<NeedsData>): void {
    if (data.food !== undefined) Needs.food[eid] = data.food;
    if (data.shopping !== undefined) Needs.shopping[eid] = data.shopping;
    if (data.work !== undefined) Needs.work[eid] = data.work;
    if (data.sleep !== undefined) Needs.sleep[eid] = data.sleep;
  }

  // Position Component
  getPosition(eid: EntityId): PositionData {
    return {
      x: Position.x[eid] || 0,
      y: Position.y[eid] || 0,
    };
  }

  setPosition(eid: EntityId, data: Partial<PositionData>): void {
    if (data.x !== undefined) Position.x[eid] = data.x;
    if (data.y !== undefined) Position.y[eid] = data.y;
  }


  // Workplace Component
  getWorkplace(eid: EntityId): WorkplaceData {
    return {
      jobType: Workplace.jobType[eid] || '',
      salary: Workplace.salary[eid] || 0,
      worker: Workplace.worker[eid] || undefined,
      building: Workplace.building[eid] || 0,
      minEducationLevel: Workplace.minEducationLevel[eid] || 0,
    };
  }

  setWorkplace(eid: EntityId, data: Partial<WorkplaceData>): void {
    if (data.jobType !== undefined) Workplace.jobType[eid] = data.jobType;
    if (data.salary !== undefined) Workplace.salary[eid] = data.salary;
    if (data.worker !== undefined) Workplace.worker[eid] = data.worker;
    if (data.building !== undefined) Workplace.building[eid] = data.building;
    if (data.minEducationLevel !== undefined)
      Workplace.minEducationLevel[eid] = data.minEducationLevel;
  }

  // Utility methods
  isEmployed(eid: EntityId): boolean {
    const citizen = this.getCitizen(eid);
    return citizen.workplace !== undefined && citizen.workplace !== 0;
  }

  isUnemployed(eid: EntityId): boolean {
    return !this.isEmployed(eid);
  }

  canAffordJob(eid: EntityId, salary: number): boolean {
    const citizen = this.getCitizen(eid);
    return salary >= citizen.minimumExpenses;
  }

  meetsEducationRequirement(eid: EntityId, requiredEducation: number): boolean {
    const person = this.getPerson(eid);
    return person.education >= requiredEducation;
  }
}
