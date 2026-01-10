import { addComponent, removeComponent, registerComponent } from 'bitecs';
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
  // Создаем компонент как объект с TypedArrays (BitECS 0.4.0 стиль)
  const component = {} as Record<string, unknown>;

  // Кешируем ключи и дефолты для оптимизации
  const keys = Object.keys(schema);
  const defaults: Record<string, number> = {};

  // Создаем TypedArray для каждого поля
  for (const key of keys) {
    const config = schema[key];
    component[key] = createTypedArray(config.type);
    defaults[key] = getDefaultValue(config);
  }

  for (const key of keys) {
    defaults[key] = getDefaultValue(schema[key]);
  }

  // Переопределяем create метод
  (component as Record<string, unknown>).create = function (
    world: World,
    eid: number,
    data?: Partial<ComponentData<T>>,
  ): void {
    // Регистрируем компонент в мире, если еще не зарегистрирован
    if (!(component as Record<string, unknown>).__registered) {
      registerComponent(world, component);
      (component as Record<string, unknown>).__registered = true;
    }

    addComponent(world, eid, component);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data?.[key] ?? defaults[key];

      if (import.meta.env.DEV) {
        validateField(value, schema[key], key);
      }
      (component[key] as unknown[])[eid] = value;
    }
  };

  // Переопределяем remove метод
  (component as Record<string, unknown>).remove = function (world: World, eid: number): void {
    removeComponent(world, eid, component);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      ((component as Record<string, unknown>)[key] as unknown[])[eid] = defaults[key];
    }
  };

  // Переопределяем inspect метод
  (component as Record<string, unknown>).inspect = function (
    world: World,
    eid: number,
  ): ComponentData<T> {
    const result = {} as ComponentData<T>;

    for (const key of keys) {
      result[key] = ((component as Record<string, unknown>)[key] as unknown[])[eid] as number;
    }

    return result;
  };

  // Добавляем register метод
  (component as Record<string, unknown>).register = function (world: World): void {
    if (!(component as Record<string, unknown>).__registered) {
      registerComponent(world, component);
      (component as Record<string, unknown>).__registered = true;

      if (import.meta.env.DEV) {
        console.log(`[ComponentBuilder] Registered component: ${name}`);
      }
    }
  };

  // Метаданные
  (component as Record<string, unknown>).name = name;
  (component as Record<string, unknown>).schema = schema;

  return component as EnhancedComponent<T>;
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// С новым createSimpleComponent API:
//
// 1. Определение компонента (ультра-просто!)
export const Citizen = createSimpleComponent('Citizen', {
  money: 100.0,      // → автоматически float32
  happiness: 70,     // → автоматически uint8 (0-255)
  salary: 50.0,      // → автоматически float32
  workplace: 0,      // → автоматически uint32
  home: 0,           // → автоматически uint32
  lastWorkDay: 0,    // → автоматически uint32
});

// 2. В фабриках - используем .create()
export class PersonFactory {
  createCitizen(world: World, eid: number): void {
    Citizen.create(world, eid, {
      money: 100.0,
      happiness: 70,
      salary: 50.0
    });
  }
}

// 3. В системах - ПРЯМОЙ доступ к TypedArrays!
export const WorkSystem = (world: World) => {
  const entities = query(world, [Citizen, Person]);

  return (delta: number) => {
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
