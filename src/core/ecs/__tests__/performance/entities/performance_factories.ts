import { addEntity } from 'bitecs';
import { createEntityFactory } from '../../../core/smart_constructors';
import {
  PerformanceCitizenComponent,
  PerformanceBuildingComponent,
  PerformanceVehicleComponent,
  SimplePerformanceComponent
} from '../components/performance_components';

/**
 * Фабрика для быстрого создания жителей
 */
export const createPerformanceCitizen = createEntityFactory(
  'performance_citizen',
  (world) => {
    const entityId = addEntity(world);

    // Используем create метод компонента для автоматического addComponent
    PerformanceCitizenComponent.create(world, entityId, {
      money: Math.floor(Math.random() * 5000 + 500),    // 500-5500
      happiness: Math.floor(Math.random() * 100),        // 0-100
      health: Math.floor(Math.random() * 50 + 50),       // 50-100
      x: Math.random() * 10000,
      y: Math.random() * 10000,
      age: Math.floor(Math.random() * 100),
      isWorking: Math.random() > 0.5 ? 1 : 0,
      isAlive: 1,
    });

    return entityId;
  },
  'Создает жителя для тестов производительности',
);

/**
 * Фабрика для создания зданий
 */
export const createPerformanceBuilding = createEntityFactory(
  'performance_building',
  (world) => {
    const entityId = addEntity(world);

    const buildingTypes = [0, 1, 2]; // residential, commercial, industrial
    const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];

    PerformanceBuildingComponent.create(world, entityId, {
      buildingType,
      income: Math.floor(Math.random() * 1000 + 100),
      maintenanceCost: Math.floor(Math.random() * 200 + 20),
      capacity: Math.floor(Math.random() * 200) + 10,
      occupants: 0,
      tileX: Math.floor(Math.random() * 100),
      tileY: Math.floor(Math.random() * 100),
      isActive: 1,
    });

    return entityId;
  },
  'Создает здание для тестов производительности',
);

/**
 * Фабрика для создания транспорта
 */
export const createPerformanceVehicle = createEntityFactory(
  'performance_vehicle',
  (world) => {
    const entityId = addEntity(world);

    PerformanceVehicleComponent.create(world, entityId, {
      vehicleType: Math.floor(Math.random() * 3),
      speed: Math.random() * 50 + 10,
      targetX: Math.random() * 10000,
      targetY: Math.random() * 10000,
      fuel: Math.floor(Math.random() * 100),
      isMoving: Math.random() > 0.5 ? 1 : 0,
      passengerCount: Math.floor(Math.random() * 4),
      maxPassengers: Math.floor(Math.random() * 50) + 1,
    });

    return entityId;
  },
  'Создает транспортное средство для тестов производительности',
);

/**
 * Фабрика для создания простых сущностей (максимальная скорость)
 */
export const createSimplePerformanceEntity = createEntityFactory(
  'simple_performance_entity',
  (world) => {
    const entityId = addEntity(world);

    SimplePerformanceComponent.create(world, entityId, {
      id: entityId,
      value: Math.floor(Math.random() * 1000),
      active: 1,
    });

    return entityId;
  },
  'Создает простую сущность для тестов максимальной производительности',
);

/**
 * Массовое создание сущностей для тестов
 */
export const createBulkPerformanceEntities = createEntityFactory(
  'bulk_performance_entities',
  (world, count: number = 1000) => {
    const entities = [];

    for (let i = 0; i < count; i++) {
      entities.push(createSimplePerformanceEntity.factory(world));
    }

    return entities[0]; // Возвращаем ID первой сущности для совместимости
  },
  'Создает большое количество простых сущностей для bulk-тестов',
);
