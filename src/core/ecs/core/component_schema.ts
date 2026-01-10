import {
  defineComponent,
  ComponentSchema,
  FieldType,
  EnhancedComponent,
  NumberFieldConfig,
} from './component_builder';

// Экспортируем типы для использования в других модулях
export type { ComponentSchema, EnhancedComponent, FieldType, NumberFieldConfig };
import { addComponent, removeComponent } from 'bitecs';
import type { World } from 'bitecs';

/**
 * Higher-level API для создания компонентов ECS
 * Упрощает DX, скрывая низкоуровневые детали типов
 */

/**
 * Базовый билдер для полей компонента
 */
export class FieldBuilder<T = number> {
  protected config: NumberFieldConfig;

  constructor(
    protected type: FieldType,
    defaultValue: T,
  ) {
    this.config = { type, default: defaultValue as number };
  }

  /**
   * Установить минимальное значение
   */
  min(value: number): this {
    this.config.min = value;
    return this;
  }

  /**
   * Установить максимальное значение
   */
  max(value: number): this {
    this.config.max = value;
    return this;
  }

  /**
   * Установить диапазон значений
   */
  range(min: number, max: number): this {
    this.config.min = min;
    this.config.max = max;
    return this;
  }

  /**
   * Получить конфиг поля
   */
  getConfig(): NumberFieldConfig {
    return this.config;
  }
}

/**
 * Числовое поле (int8)
 */
export function int8(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('i8', defaultValue);
}

/**
 * Беззнаковое 8-битное целое
 */
export function uint8(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('ui8', defaultValue);
}

/**
 * Беззнаковое 16-битное целое
 */
export function uint16(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('ui16', defaultValue);
}

/**
 * Беззнаковое 32-битное целое (для entity IDs)
 */
export function uint32(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('ui32', defaultValue);
}

/**
 * 32-битное число с плавающей точкой
 */
export function float32(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('f32', defaultValue);
}

/**
 * 64-битное число с плавающей точкой
 */
export function float64(defaultValue: number = 0): FieldBuilder<number> {
  return new FieldBuilder<number>('f64', defaultValue);
}

/**
 * Поле для ID сущности
 */
export function entityId(defaultValue: number = 0): FieldBuilder<number> {
  return uint32(defaultValue);
}

/**
 * Поле для индексов (типов, размеров и т.д.)
 */
export function index(defaultValue: number = 0): FieldBuilder<number> {
  return uint8(defaultValue);
}

/**
 * Процентное значение (0-100)
 */
export function percentage(defaultValue: number = 0): FieldBuilder<number> {
  return uint8(defaultValue).range(0, 100);
}

/**
 * Количество (может быть большим)
 */
export function count(defaultValue: number = 0): FieldBuilder<number> {
  return uint16(defaultValue).min(0);
}

/**
 * Деньги/цена
 */
export function money(defaultValue: number = 0): FieldBuilder<number> {
  return float32(defaultValue).min(0);
}

/**
 * Автоматически определяет BitECS тип на основе значения по умолчанию
 */
function inferBitECSType(value: number): FieldType {
  // Отрицательные числа → signed integers
  if (value < 0) {
    if (value >= -128) return 'i8';
    if (value >= -32768) return 'i16';
    return 'i32';
  }

  // Числа с плавающей точкой → float
  if (value % 1 !== 0) {
    return 'f32'; // float32 для большинства случаев
  }

  // Целые положительные числа
  if (value <= 255) return 'ui8';
  if (value <= 65535) return 'ui16';
  return 'ui32'; // для очень больших значений
}

/**
 * Создает компонент из простого объекта с default значениями
 * Автоматически определяет BitECS типы на основе значений
 */
export function createSimpleComponent<T extends Record<string, number>>(
  name: string,
  defaults: T,
): EnhancedComponent<ComponentSchema> {
  // Создаем BitECS схему с автоматическим определением типов
  const bitECSSchema: ComponentSchema = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    bitECSSchema[key] = {
      type: inferBitECSType(defaultValue),
      default: defaultValue,
    };
  }

  // Создаем BitECS компонент
  const component = defineComponent(name, bitECSSchema);

  // Добавляем кеширование для производительности
  const keys = Object.keys(defaults);
  const cachedDefaults: Record<string, number> = { ...defaults };

  // Переопределяем create метод
  component.create = function (world: World, eid: number, data?: Partial<T>): void {
    // ✅ Добавляем компонент к сущности через BitECS
    addComponent(world, eid, component);

    // ✅ Заполняем данными
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data?.[key] ?? cachedDefaults[key];

      // Валидация только в dev mode (tree-shakable)
      if (import.meta.env.DEV) {
        // Базовая валидация типа
        if (typeof value !== 'number' || isNaN(value)) {
          console.warn(
            `[Component ${name}] Invalid value for "${key}": expected number, got ${typeof value}`,
          );
        }
      }

      // ✅ ПРЯМАЯ запись в TypedArray
      component[key][eid] = value;
    }
  };

  // Переопределяем remove метод
  component.remove = function (world: World, eid: number): void {
    // ✅ Удаляем компонент через BitECS
    removeComponent(world, eid, component);

    // Очищаем данные (устанавливаем defaults)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      component[key][eid] = cachedDefaults[key];
    }
  };

  return component;
}

/**
 * Создает схему компонента из полей (расширенный API для продвинутых случаев)
 */
export function createComponentSchema<T extends Record<string, FieldBuilder>>(
  name: string,
  fields: T,
): EnhancedComponent<ComponentSchema> {
  // Преобразуем fields в ComponentSchema
  const schema: ComponentSchema = {};

  for (const [key, fieldBuilder] of Object.entries(fields)) {
    schema[key] = fieldBuilder.getConfig();
  }

  return defineComponent(name, schema);
}

/**
 * ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
 *
 * // 🔥 НОВЫЙ ПРОСТОЙ API (рекомендуется):
 * const Citizen = createSimpleComponent('Citizen', {
 *   money: 100.0,      // → автоматически float32
 *   happiness: 70,     // → автоматически uint8 (0-255)
 *   workplace: 0,      // → автоматически uint32
 *   age: 25,           // → автоматически uint8
 *   education: 0,      // → автоматически uint8
 * });
 *
 * // 🔧 РАСШИРЕННЫЙ API (для особых случаев):
 * const AdvancedCitizen = createComponentSchema('AdvancedCitizen', {
 *   money: money(100),           // float32, min: 0
 *   happiness: percentage(70),   // uint8, range: 0-100
 *   workplace: entityId(),       // uint32, default: 0
 *   age: uint8(25).range(0, 120), // uint8, range: 0-120
 * });
 *
 * // АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ ТИПОВ:
 * - Целые числа 0-255 → uint8
 * - Целые числа 0-65535 → uint16
 * - Целые числа 0-4294967295 → uint32
 * - Числа с плавающей точкой → float32
 * - Отрицательные числа → int8/16/32
 *
 * // СПЕЦИАЛИЗИРОВАННЫЕ БИЛДЕРЫ:
 * - money() - для финансов (float32, min: 0)
 * - percentage() - для процентов (uint8, 0-100)
 * - entityId() - для ссылок на сущности (uint32)
 * - count() - для количества (uint16, min: 0)
 * - index() - для индексов (uint8)
 */
