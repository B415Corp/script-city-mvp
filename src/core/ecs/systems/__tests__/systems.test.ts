import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld, addEntity } from 'bitecs';
import { EventBus } from '../../../event_bus/event_bus';
import { TimeService } from '../../../tick/time_service';
import {
  WorkSystem,
  ScheduleManagerSystem,
  MovementSystem,
} from '../clusters/schedule_activity_systems';
import { Citizen, Person, Position, Schedule } from '../../components';

describe('ECS Systems Tests', () => {
  let world: ReturnType<typeof createWorld>;
  let eventBus: EventBus;
  let timeService: TimeService;

  beforeEach(() => {
    world = createWorld();
    eventBus = new EventBus();
    timeService = new TimeService(eventBus, 10);
  });

  describe('WorkSystem', () => {
    it('should pay salary to employed citizens daily', () => {
      // Create a citizen with a job
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid, {
        money: 100,
        workplace: 1, // Has workplace
        salary: 50,
        lastWorkDay: 0,
        isHomeless: 0,
      });
      Schedule.create(world, eid);

      // Set current day to 1
      timeService.setTime(1440); // 1 day

      // Run WorkSystem
      const entities = [eid];
      WorkSystem.update(world, entities, undefined, timeService);

      // Should receive daily salary
      expect(Citizen.money[eid]).toBe(100 + 50 / 7); // 50/7 ≈ 7.14
      expect(Citizen.lastWorkDay[eid]).toBe(1);
      expect(Citizen.experience[eid]).toBe(1);
    });

    it('should not pay salary to unemployed citizens', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid, {
        money: 100,
        workplace: 0, // No workplace
        salary: 50,
        lastWorkDay: 0,
      });
      Schedule.create(world, eid);

      const initialMoney = Citizen.money[eid];

      WorkSystem.update(world, [eid], undefined, timeService);

      // Money should not change
      expect(Citizen.money[eid]).toBe(initialMoney);
      expect(Citizen.lastWorkDay[eid]).toBe(0);
    });

    it('should not pay salary twice on the same day', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid, {
        money: 100,
        workplace: 1,
        salary: 50,
        lastWorkDay: 1, // Already worked today
        isHomeless: 0,
      });
      Schedule.create(world, eid);

      // Set current day to 1
      timeService.setTime(1440);

      const initialMoney = Citizen.money[eid];

      WorkSystem.update(world, [eid], undefined, timeService);

      // Money should not change (already worked today)
      expect(Citizen.money[eid]).toBe(initialMoney);
    });
  });

  describe('MovementSystem', () => {
    it('should update citizen position based on schedule activity', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);
      Position.create(world, eid, { x: 0, y: 0 });
      Schedule.create(world, eid, {
        currentActivity: 1, // work activity
      });

      // Create workplace
      const workplaceId = addEntity(world);
      Position.create(world, workplaceId, { x: 100, y: 200 });

      // Set workplace reference
      Citizen.workplace[eid] = workplaceId;

      MovementSystem.update(world, [eid]);

      // Should move to workplace position
      expect(Position.x[eid]).toBe(100);
      expect(Position.y[eid]).toBe(200);
    });

    it('should move to home when idle', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);
      Position.create(world, eid, { x: 50, y: 50 });
      Schedule.create(world, eid, {
        currentActivity: 0, // idle activity
      });

      // Create home
      const homeId = addEntity(world);
      Position.create(world, homeId, { x: 10, y: 20 });

      Citizen.home[eid] = homeId;

      MovementSystem.update(world, [eid]);

      // Should move to home position
      expect(Position.x[eid]).toBe(10);
      expect(Position.y[eid]).toBe(20);
    });

    it('should handle invalid workplace/home references', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);
      Position.create(world, eid, { x: 0, y: 0 });
      Schedule.create(world, eid, {
        currentActivity: 1, // work
      });

      Citizen.workplace[eid] = 999; // Invalid reference

      // Should not crash
      expect(() => MovementSystem.update(world, [eid])).not.toThrow();
    });
  });

  describe('ScheduleManagerSystem', () => {
    it('should update schedule phase based on time', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);
      Schedule.create(world, eid, {
        currentPhase: 0, // dawn
        currentActivity: 0,
        activityExecuted: 0,
      });

      // Set time to morning (6:00-12:00)
      timeService.setTime(6 * 60); // 6:00

      ScheduleManagerSystem.update(world, [eid], undefined, timeService);

      // Should change to morning phase and set activity
      expect(Schedule.currentPhase[eid]).toBe(1); // morning
      expect(Schedule.currentActivity[eid]).toBe(0); // idle for morning
      expect(Schedule.activityExecuted[eid]).toBe(1);
    });

    it("should not change phase if time hasn't changed", () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);
      Schedule.create(world, eid, {
        currentPhase: 1, // morning
        currentActivity: 0,
        activityExecuted: 1,
      });

      // Keep time in morning range
      timeService.setTime(9 * 60); // 9:00 (still morning)

      const originalPhase = Schedule.currentPhase[eid];

      ScheduleManagerSystem.update(world, [eid], undefined, timeService);

      // Phase should not change
      expect(Schedule.currentPhase[eid]).toBe(originalPhase);
    });
  });

  describe('System Integration', () => {
    it('should handle empty entity list gracefully', () => {
      expect(() => WorkSystem.update(world, [], undefined, timeService)).not.toThrow();
      expect(() => MovementSystem.update(world, [])).not.toThrow();
      expect(() => ScheduleManagerSystem.update(world, [], undefined, timeService)).not.toThrow();
    });

    it('should handle missing TimeService gracefully', () => {
      const eid = addEntity(world);
      Person.create(world, eid);
      Citizen.create(world, eid);

      // Should not crash without TimeService
      expect(() => WorkSystem.update(world, [eid])).not.toThrow();
      expect(() => ScheduleManagerSystem.update(world, [eid])).not.toThrow();
    });

    it('should work with multiple entities', () => {
      const eid1 = addEntity(world);
      const eid2 = addEntity(world);

      // Setup entities
      Person.create(world, eid1);
      Citizen.create(world, eid1, {
        money: 100,
        workplace: 1,
        salary: 50,
        lastWorkDay: 0,
      });
      Schedule.create(world, eid1);

      Person.create(world, eid2);
      Citizen.create(world, eid2, {
        money: 200,
        workplace: 0, // No job
        salary: 40,
        lastWorkDay: 0,
        isHomeless: 0,
      });
      Schedule.create(world, eid2);

      timeService.setTime(1440); // Day 1

      WorkSystem.update(world, [eid1, eid2], undefined, timeService);

      // Only employed citizen should get paid
      expect(Citizen.money[eid1]).toBe(100 + 50 / 7);
      expect(Citizen.money[eid2]).toBe(200); // No change
    });
  });
});
