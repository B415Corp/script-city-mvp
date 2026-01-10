/**
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ НОВОГО HIGHER-LEVEL API КОМПОНЕНТОВ
 *
 * Этот файл показывает, насколько проще стало создавать компоненты ECS
 * после внедрения fluent API для полей компонентов.
 */

import {
  createComponentSchema,
  money,
  percentage,
  entityId,
  count,
  index,
  uint8,
  uint16,
  float32,
} from '../core/component_schema';

/**
 * ПРИМЕР 1: Простой компонент с семантическими типами полей
 */
export const Wallet = createComponentSchema('Wallet', {
  balance: money(0), // float32, min: 0
  savings: money(0), // float32, min: 0
});

/**
 * ПРИМЕР 2: Компонент работника с различными типами полей
 */
export const Employee = createComponentSchema('Employee', {
  jobType: index(0), // uint8, индекс типа работы
  salary: money(50), // float32, зарплата
  experience: count(0), // uint16, опыт работы
  satisfaction: percentage(70), // uint8, удовлетворенность 0-100%
  supervisor: entityId(), // uint32, ссылка на руководителя
});

/**
 * ПРИМЕР 3: Компонент транспортного средства
 */
export const Vehicle = createComponentSchema('Vehicle', {
  type: index(0), // uint8, тип транспорта (авто, грузовик и т.д.)
  fuelLevel: percentage(100), // uint8, уровень топлива 0-100%
  mileage: uint16(0), // uint16, пробег
  maxSpeed: uint8(120), // uint8, макс. скорость
  owner: entityId(), // uint32, владелец
});

/**
 * ПРИМЕР 4: Компонент здания с комплексными полями
 */
export const Building = createComponentSchema('Building', {
  buildingType: index(0), // uint8, тип здания
  capacity: count(10), // uint16, вместимость
  condition: percentage(100), // uint8, состояние 0-100%
  rentPrice: money(100), // float32, стоимость аренды
  owner: entityId(), // uint32, владелец
  constructionYear: uint16(2024), // uint16, год постройки
});

/**
 * ПРИМЕР 5: Компонент с кастомными ограничениями
 */
export const Student = createComponentSchema('Student', {
  age: uint8(18).range(6, 25), // возраст 6-25 лет
  grade: uint8(1).range(1, 12), // класс 1-12
  gpa: float32(3.0).range(0, 4.0), // средний балл 0-4.0
  credits: count(0), // зачетные единицы
  major: index(0), // специализация
});

/**
 * СРАВНЕНИЕ: Старый vs Новый подход
 */

// СТАРЫЙ ПОДХОД (низкоуровневый):
/*
import { defineComponent } from '../core/component_builder';

export const OldEmployee = defineComponent('Employee', {
  jobType: { type: 'ui8', default: 0 },
  salary: { type: 'f32', default: 50, min: 0 },
  experience: { type: 'ui16', default: 0, min: 0 },
  satisfaction: { type: 'ui8', default: 70, min: 0, max: 100 },
  supervisor: { type: 'ui32', default: 0 },
});

// ПРОБЛЕМЫ:
- Нужно помнить типы данных ('ui8', 'ui16', 'f32' и т.д.)
- Нужно вручную указывать min/max для валидации
- Многословный синтаксис
- Легко ошибиться в типах
*/

// НОВЫЙ ПОДХОД (высокоуровневый):
/*
export const NewEmployee = createComponentSchema('Employee', {
  jobType: index(0),        // понятно, что это индекс
  salary: money(50),        // понятно, что это деньги (>= 0)
  experience: count(0),     // понятно, что это количество (>= 0)
  satisfaction: percentage(70), // понятно, что это процент (0-100)
  supervisor: entityId(),   // понятно, что это ссылка на сущность
});

// ПРЕИМУЩЕСТВА:
+ Семантические имена функций (money, percentage, entityId)
+ Автоматические ограничения (min/max)
+ Короткий и читаемый синтаксис
+ Меньше возможностей для ошибок
+ Лучшая DX для разработчиков
*/

/**
 * ИСПОЛЬЗОВАНИЕ В КОДЕ:
 */
/*
// Регистрация компонентов (один раз при старте)
Employee.register(world);
Vehicle.register(world);
Building.register(world);

// Создание сущностей
const employeeId = addEntity(world);
Employee.create(world, employeeId, {
  jobType: 1,      // менеджер
  salary: 75,      // $75/час
  experience: 5,   // 5 лет опыта
  satisfaction: 85 // 85% удовлетворенности
});

// Работа с данными в системах
export const SalarySystem = (world: World) => {
  const entities = query(world, [Employee]);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Прямой доступ к данным (максимальная производительность)
    const currentSalary = Employee.salary[eid];
    const experience = Employee.experience[eid];

    // Расчет новой зарплаты на основе опыта
    const newSalary = currentSalary + (experience * 2);
    Employee.salary[eid] = newSalary;
  }
};
*/
