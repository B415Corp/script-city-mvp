/**
 * Утилиты для создания bitECS компонентов из TypeScript типов
 */

/**
 * Поддерживаемые типы данных для компонентов bitECS
 */
export type ComponentDataType =
  | 'number' // обычное число (Float64Array)
  | 'int8' // 8-bit integer (Int8Array)
  | 'int16' // 16-bit integer (Int16Array)
  | 'int32' // 32-bit integer (Int32Array)
  | 'uint8' // unsigned 8-bit integer (Uint8Array)
  | 'uint16' // unsigned 16-bit integer (Uint16Array)
  | 'uint32' // unsigned 32-bit integer (Uint32Array)
  | 'float32' // 32-bit float (Float32Array)
  | 'float64' // 64-bit float (Float64Array)
  | 'string' // строка
  | 'boolean' // булево значение
  | 'entityId' // ID сущности (для ссылок)
  | 'array' // массив (нужен дополнительный параметр elementType)
  | 'object'; // вложенный объект (нужен дополнительный параметр schema)

/**
 * Схема поля компонента
 */
export interface ComponentFieldSchema {
  type: ComponentDataType;
  /** Для массивов - тип элементов */
  elementType?: ComponentDataType;
  /** Для вложенных объектов - схема полей */
  schema?: Record<string, ComponentFieldSchema>;
  /** Начальный размер массива (для TypedArrays) */
  initialSize?: number;
  /** Значение по умолчанию */
  defaultValue?: unknown;
}

/**
 * Схема компонента
 */
export type ComponentSchema = Record<string, ComponentFieldSchema>;

/**
 * Создает функцию для генерации bitECS компонента из схемы
 * @param schema - схема компонента с понятными типами
 * @param options - дополнительные опции
 * @returns функция, которая создает компонент
 */
export function createComponentFactory(
  schema: ComponentSchema,
  options: {
    /** Использовать TypedArrays для чисел (рекомендуется для производительности) */
    useTypedArrays?: boolean;
    /** Начальный размер массивов (по умолчанию 10000) */
    initialSize?: number;
    /** Использовать Structure of Arrays (SoA) - рекомендуется */
    useSoA?: boolean;
  } = {},
) {
  const { useTypedArrays = true, initialSize = 10000, useSoA = true } = options;

  return function createComponent(): ComponentInstance {
    const component: Record<string, unknown[] | ArrayBufferView> = {};

    // Создаем поля компонента на основе схемы
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      component[fieldName] = createFieldFromSchema(fieldSchema, initialSize, useTypedArrays);
    }

    return component;
  };
}

/**
 * Создает поле компонента из схемы
 */
function createFieldFromSchema(
  schema: ComponentFieldSchema,
  initialSize: number,
  useTypedArrays: boolean,
): unknown[] | ArrayBufferView {
  const { type, initialSize: fieldInitialSize, defaultValue } = schema;
  const size = fieldInitialSize || initialSize;

  switch (type) {
    case 'number': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Float64Array(size).fill(def) : Array(size).fill(def);
    }

    case 'int8': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Int8Array(size).fill(def) : Array(size).fill(def);
    }

    case 'int16': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Int16Array(size).fill(def) : Array(size).fill(def);
    }

    case 'int32': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Int32Array(size).fill(def) : Array(size).fill(def);
    }

    case 'uint8': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Uint8Array(size).fill(def) : Array(size).fill(def);
    }

    case 'uint16': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Uint16Array(size).fill(def) : Array(size).fill(def);
    }

    case 'uint32': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Uint32Array(size).fill(def) : Array(size).fill(def);
    }

    case 'float32': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Float32Array(size).fill(def) : Array(size).fill(def);
    }

    case 'float64': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Float64Array(size).fill(def) : Array(size).fill(def);
    }

    case 'string':
      return Array(size).fill((defaultValue as string | undefined) ?? '');

    case 'boolean':
      return Array(size).fill((defaultValue as boolean | undefined) ?? false);

    case 'entityId': {
      const def = (defaultValue as number | undefined) ?? 0;
      return useTypedArrays ? new Uint32Array(size).fill(def) : Array(size).fill(def);
    }

    case 'array':
      if (!schema.elementType) {
        throw new Error(`Для поля типа 'array' необходимо указать elementType`);
      }
      // Для массивов создаем массив массивов
      return Array(size)
        .fill(null)
        .map(() => []);

    case 'object':
      if (!schema.schema) {
        throw new Error(`Для поля типа 'object' необходимо указать schema`);
      }
      // Для вложенных объектов создаем массив объектов
      return Array(size)
        .fill(null)
        .map(() => createNestedObject(schema.schema!));

    default:
      throw new Error(`Неподдерживаемый тип поля: ${type}`);
  }
}

/**
 * Создает вложенный объект из схемы
 */
function createNestedObject(schema: ComponentSchema): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    obj[fieldName] = getDefaultValueForType(fieldSchema);
  }
  return obj;
}

/**
 * Возвращает значение по умолчанию для типа
 */
function getDefaultValueForType(schema: ComponentFieldSchema): unknown {
  if (schema.defaultValue !== undefined) {
    return schema.defaultValue;
  }

  switch (schema.type) {
    case 'number':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'float32':
    case 'float64':
    case 'entityId':
      return 0;

    case 'string':
      return '';

    case 'boolean':
      return false;

    case 'array':
      return [];

    case 'object':
      return schema.schema ? createNestedObject(schema.schema) : {};

    default:
      return null;
  }
}

/**
 * Типы TypeScript для созданных компонентов
 */

// Упрощенные типы для компонентов
export type ComponentInstance = Record<string, unknown[] | ArrayBufferView>;

// Примеры использования:

/**
 * Пример 1: Простой компонент позиции
 */
export const createPositionComponent = createComponentFactory({
  x: { type: 'float32', defaultValue: 0 },
  y: { type: 'float32', defaultValue: 0 },
  z: { type: 'float32', defaultValue: 0 },
});

/**
 * Пример 2: Компонент с различными типами данных
 */
export const createPlayerComponent = createComponentFactory({
  health: { type: 'uint8', defaultValue: 100 },
  mana: { type: 'uint16', defaultValue: 50 },
  name: { type: 'string', defaultValue: 'Player' },
  isAlive: { type: 'boolean', defaultValue: true },
  inventory: { type: 'array', elementType: 'uint16' },
  stats: {
    type: 'object',
    schema: {
      strength: { type: 'uint8', defaultValue: 10 },
      agility: { type: 'uint8', defaultValue: 10 },
      intelligence: { type: 'uint8', defaultValue: 10 },
    },
  },
});

/**
 * Пример 3: Компонент с entity ссылками
 */
export const createBuildingComponent = createComponentFactory({
  ownerId: { type: 'entityId' },
  type: { type: 'uint8', defaultValue: 0 },
  position: {
    type: 'object',
    schema: {
      x: { type: 'float32' },
      y: { type: 'float32' },
    },
  },
});

/**
 * Использование:
 *
 * const Position = createPositionComponent();
 * const Player = createPlayerComponent();
 * const Building = createBuildingComponent();
 *
 * // Теперь компоненты можно использовать в bitECS:
 * // Position.x[eid] = 10.5;
 * // Player.health[eid] = 80;
 * // Building.ownerId[eid] = someEntityId;
 */
