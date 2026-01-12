import { createComponent } from '../../../core/smart_constructors';

/**
 * Компонент производительности для жителей
 * Оптимизирован для массового создания и тестирования
 */
export const PerformanceCitizenComponent = createComponent('PerformanceCitizen', {
  // Финансы
  money: 1000,

  // Счастье и здоровье (0-100%)
  happiness: 75,
  health: 100,

  // Позиция (float для точности)
  x: 0,
  y: 0,

  // Возраст
  age: 25,

  // Флаги активности
  isWorking: 0, // 0 или 1
  isAlive: 1,   // 0 или 1
});

/**
 * Компонент производительности для зданий
 */
export const PerformanceBuildingComponent = createComponent('PerformanceBuilding', {
  // Тип здания (0=жилое, 1=коммерческое, 2=промышленное)
  buildingType: 0,

  // Экономика
  income: 100,
  maintenanceCost: 10,

  // Вместимость
  capacity: 50,        // uint16
  occupants: 0,        // uint16

  // Координаты
  tileX: 0,
  tileY: 0,

  // Статус
  isActive: 1,
});

/**
 * Компонент производительности для транспорта
 */
export const PerformanceVehicleComponent = createComponent('PerformanceVehicle', {
  // Тип транспорта
  vehicleType: 0,      // 0=car, 1=bus, 2=truck

  // Движение
  speed: 0,
  targetX: 0,
  targetY: 0,

  // Состояние
  fuel: 100,
  isMoving: 0,

  // Вместимость
  passengerCount: 0,
  maxPassengers: 4,
});

/**
 * Простой компонент для массового тестирования
 * Минимум полей для максимальной скорости
 */
export const SimplePerformanceComponent = createComponent('SimplePerformance', {
  id: 0,      // uint32
  value: 0,   // uint32
  active: 1,  // uint8
});
