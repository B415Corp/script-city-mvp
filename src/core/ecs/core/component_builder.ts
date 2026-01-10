import { registerComponent, addComponent, removeComponent } from 'bitecs';
import type { World } from 'bitecs';

// ============================================================================
// TYPES
// ============================================================================

export type FieldType = 'ui8' | 'ui16' | 'ui32' | 'i8' | 'i16' | 'i32' | 'f32' | 'f64';

export interface BaseFieldConfig {
  type: FieldType;
  default?: number;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  min?: number;
  max?: number;
}

export type FieldConfig = NumberFieldConfig;

export type ComponentSchema = Record<string, FieldConfig>;

// Извлекаем TypeScript тип из схемы
export type ComponentData<T extends ComponentSchema> = {
  [K in keyof T]: number;
};

// Создаем TypedArray на основе типа поля
type TypedArrayForType<T extends FieldType> = T extends 'ui8'
  ? Uint8Array
  : T extends 'ui16'
    ? Uint16Array
    : T extends 'ui32'
      ? Uint32Array
      : T extends 'i8'
        ? Int8Array
        : T extends 'i16'
          ? Int16Array
          : T extends 'i32'
            ? Int32Array
            : T extends 'f32'
              ? Float32Array
              : T extends 'f64'
                ? Float64Array
                : never;

// ✅ Enhanced component with TypedArrays and helpers
export type EnhancedComponent<T extends ComponentSchema> = {
  // TypedArrays для каждого поля
  [K in keyof T]: TypedArrayForType<T[K]['type']>;
} & {
  // Метаданные
  name: string;
  schema: T;

  // Регистрация в BitECS мире
  register(world: World): void;

  // Helper методы (НЕ использовать в системах!)
  create(world: World, eid: number, data?: Partial<ComponentData<T>>): void;
  remove(world: World, eid: number): void;
  inspect(world: World, eid: number): Record<string, number>;
};

// ============================================================================
// VALIDATION (только dev mode)
// ============================================================================

function validateField(value: number, field: FieldConfig, fieldName: string): boolean {
  // ✅ Tree-shakable в production
  if (import.meta.env.PROD) return true;

  if (typeof value !== 'number' || isNaN(value)) {
    console.warn(
      `[Component] Invalid value for "${fieldName}": expected number, got ${typeof value}`,
    );
    return false;
  }

  if (field.min !== undefined && value < field.min) {
    console.warn(`[Component] Value ${value} for "${fieldName}" is below min ${field.min}`);
    return false;
  }

  if (field.max !== undefined && value > field.max) {
    console.warn(`[Component] Value ${value} for "${fieldName}" is above max ${field.max}`);
    return false;
  }

  return true;
}

function getDefaultValue(field: FieldConfig): number {
  if (field.default !== undefined) return field.default;
  if (field.min !== undefined) return field.min;
  return 0;
}

// Create TypedArray for field type
function createTypedArray(
  type: FieldType,
  initialSize = 10000,
):
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array {
  switch (type) {
    case 'ui8': // 8-битное целое число без знака
      return new Uint8Array(initialSize);
    case 'ui16': // 16-битное целое число без знака
      return new Uint16Array(initialSize);
    case 'ui32': // 32-битное целое число без знака
      return new Uint32Array(initialSize);
    case 'i8': // 8-битное целое число со знаком
      return new Int8Array(initialSize);
    case 'i16': // 16-битное целое число со знаком
      return new Int16Array(initialSize);
    case 'i32': // 32-битное целое число со знаком
      return new Int32Array(initialSize);
    case 'f32': // 32-битное число с плавающей точкой
      return new Float32Array(initialSize);
    case 'f64': // 64-битное число с плавающей точкой
      return new Float64Array(initialSize);
    default:
      throw new Error(`Unknown field type: ${type}`);
  }
}

// ============================================================================
// COMPONENT BUILDER
// ============================================================================

export function defineComponent<T extends ComponentSchema>(
  name: string,
  schema: T,
): EnhancedComponent<T> {
  // Создаем объект компонента с TypedArrays
  const component = {} as any;

  // Создаем TypedArray для каждого поля
  for (const [key, config] of Object.entries(schema)) {
    component[key] = createTypedArray(config.type);
  }

  // ✅ ОПТИМИЗАЦИЯ: Кешируем при создании (один раз!)
  const keys = Object.keys(schema);
  const defaults: Record<string, number> = {};

  for (const key of keys) {
    defaults[key] = getDefaultValue(schema[key]);
  }

  // Метод для регистрации компонента в мире BitECS
  component.register = function (world: World): void {
    registerComponent(world, component);
  };

  // ============================================================================
  // HELPER: CREATE (только для фабрик!)
  // ============================================================================

  component.create = function (world: World, eid: number, data?: Partial<ComponentData<T>>): void {
    // ✅ Добавляем компонент к сущности через BitECS
    addComponent(world, eid, component);

    // ✅ ОПТИМИЗИРОВАНО: используем кешированные данные
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data?.[key] ?? defaults[key];

      // Валидация только в dev mode (tree-shakable)
      if (import.meta.env.DEV) {
        validateField(value, schema[key], key);
      }

      // ✅ ПРЯМАЯ запись в TypedArray
      component[key][eid] = value;
    }
  };

  // ============================================================================
  // HELPER: REMOVE
  // ============================================================================

  component.remove = function (world: World, eid: number): void {
    // ✅ Удаляем компонент через BitECS
    removeComponent(world, eid, component);

    // Очищаем данные (устанавливаем defaults)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      component[key][eid] = defaults[key];
    }
  };

  // ============================================================================
  // HELPER: INSPECT (только для отладки!)
  // ============================================================================

  component.inspect = function (world: World, eid: number): Record<string, number> {
    const result: Record<string, number> = {};

    // ✅ Используем кешированные ключи
    for (const key of keys) {
      result[key] = component[key][eid];
    }

    return result;
  };

  // Метаданные
  component.name = name;
  component.schema = schema;

  return component as EnhancedComponent<T>;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// 1. Определение компонента
export const Citizen = defineComponent('Citizen', {
  money: { type: 'f32', default: 100, min: 0 },
  happiness: { type: 'ui8', default: 70, min: 0, max: 100 },
  salary: { type: 'f32', default: 50, min: 0 },
  workplace: { type: 'ui32', default: 0 },
  home: { type: 'ui32', default: 0 },
  lastWorkDay: { type: 'ui32', default: 0 },
});

// 2. В фабриках - используем .create()
export class PersonFactory {
  createCitizen(world: World, eid: number): void {
    // ✅ Helper с валидацией и defaults
    Citizen.create(world, eid, {
      money: 100,
      happiness: 70,
      salary: 50
    });
  }
}

// 3. В системах - ПРЯМОЙ доступ к TypedArrays!
export const WorkSystem = (world: World) => {
  const query = defineQuery([Citizen, Person]);

  return (delta: number) => {
    const entities = query(world);

    // ✅ ПРЯМОЙ доступ - максимальная производительность!
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      if (Citizen.workplace[eid] > 0) {
        const dailySalary = Citizen.salary[eid] / 7;

        // ✅ Прямая запись в TypedArray - 0 overhead!
        Citizen.money[eid] += dailySalary;
        Citizen.lastWorkDay[eid] = currentDay;
      }
    }
  };
};

// 4. Для отладки - используем .inspect()
if (import.meta.env.DEV) {
  const data = Citizen.inspect(world, eid);
  console.log('Citizen data:', data);
}
*/
