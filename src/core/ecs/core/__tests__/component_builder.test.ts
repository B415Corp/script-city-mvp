import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defineComponent,
  FieldType,
  ComponentSchema,
  EnhancedComponent,
} from '../component_builder';
import { addComponent, removeComponent, registerComponent } from 'bitecs';
import type { World } from 'bitecs';

// Моки функций BitECS
vi.mock('bitecs', () => ({
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
  registerComponent: vi.fn(),
}));

describe('Билдер компонентов', () => {
  let mockWorld: World;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorld = {} as World;
  });

  describe('defineComponent', () => {
    it('должен создавать компонент с правильными TypedArrays для каждого типа поля', () => {
      const schema: ComponentSchema = {
        health: { type: 'ui8', default: 100 },
        mana: { type: 'f32', default: 50.5 },
        position: { type: 'f64', default: 0.0 },
        negativeValue: { type: 'i16', default: -10 },
      };

      const component = defineComponent('TestComponent', schema);

      expect(component).toBeDefined();
      expect(component.name).toBe('TestComponent');
      expect(component.schema).toBe(schema);

      // Проверяем, что TypedArrays созданы правильно
      expect(component.health).toBeInstanceOf(Uint8Array);
      expect(component.mana).toBeInstanceOf(Float32Array);
      expect(component.position).toBeInstanceOf(Float64Array);
      expect(component.negativeValue).toBeInstanceOf(Int16Array);
    });

    it('должен создавать компонент со значениями по умолчанию, когда они не указаны', () => {
      const schema: ComponentSchema = {
        count: { type: 'ui32' }, // Значение по умолчанию не указано
        flag: { type: 'ui8' }, // Значение по умолчанию не указано
      };

      const component = defineComponent('DefaultComponent', schema);

      expect(component.count).toBeInstanceOf(Uint32Array);
      expect(component.flag).toBeInstanceOf(Uint8Array);
    });

    it('должен выбрасывать ошибку для неизвестного типа поля', () => {
      const schema = {
        invalidField: { type: 'unknown' as any, default: 0 },
      };

      expect(() => defineComponent('InvalidComponent', schema)).toThrow(
        'Unknown field type: unknown',
      );
    });

    it('должен создавать компонент с большим начальным размером', () => {
      const schema: ComponentSchema = {
        value: { type: 'f32', default: 1.0 },
      };

      const component = defineComponent('LargeComponent', schema);

      // Размер по умолчанию должен быть не менее 10000
      expect(component.value.length).toBeGreaterThanOrEqual(10000);
    });
  });

  describe('метод component.create', () => {
    let component: EnhancedComponent<ComponentSchema>;

    beforeEach(() => {
      const schema: ComponentSchema = {
        health: { type: 'ui8', default: 100 },
        mana: { type: 'f32', default: 50.0 },
        name: { type: 'ui16', default: 0 },
      };
      component = defineComponent('TestComponent', schema);

      // Мокаем TypedArrays
      (component as any).health = new Uint8Array(10000);
      (component as any).mana = new Float32Array(10000);
      (component as any).name = new Uint16Array(10000);
    });

    it('должен добавлять компонент к сущности и устанавливать значения по умолчанию', () => {
      const entityId = 42;

      component.create(mockWorld, entityId);

      expect(addComponent).toHaveBeenCalledWith(mockWorld, entityId, component);
      expect(component.health[entityId]).toBe(100);
      expect(component.mana[entityId]).toBe(50.0);
      expect(component.name[entityId]).toBe(0);
    });

    it('должен переопределять значения по умолчанию предоставленными данными', () => {
      const entityId = 42;
      const customData = { health: 80, mana: 75.5 };

      component.create(mockWorld, entityId, customData);

      expect(addComponent).toHaveBeenCalledWith(mockWorld, entityId, component);
      expect(component.health[entityId]).toBe(80);
      expect(component.mana[entityId]).toBe(75.5);
      expect(component.name[entityId]).toBe(0); // Должен сохранить значение по умолчанию
    });

    it('должен регистрировать компонент при первом вызове create', () => {
      const entityId = 42;

      component.create(mockWorld, entityId);

      expect(registerComponent).toHaveBeenCalledWith(mockWorld, component);
    });

    it('не должен регистрировать компонент при последующих вызовах create', () => {
      component.create(mockWorld, 1);
      component.create(mockWorld, 2);

      expect(registerComponent).toHaveBeenCalledTimes(1);
    });

    it('должен валидировать значения полей в dev режиме', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const entityId = 42;

      // Тестируем некорректное значение (NaN)
      component.create(mockWorld, entityId, { health: NaN });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid value for "health": expected number, got'),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('метод component.remove', () => {
    let component: EnhancedComponent<ComponentSchema>;

    beforeEach(() => {
      const schema: ComponentSchema = {
        health: { type: 'ui8', default: 100 },
        mana: { type: 'f32', default: 50.0 },
      };
      component = defineComponent('TestComponent', schema);

      // Мокаем TypedArrays
      (component as any).health = new Uint8Array(10000);
      (component as any).mana = new Float32Array(10000);
    });

    it('должен удалять компонент у сущности и сбрасывать к значениям по умолчанию', () => {
      const entityId = 42;

      // Сначала установим некоторые значения
      component.health[entityId] = 80;
      component.mana[entityId] = 75.5;

      component.remove(mockWorld, entityId);

      expect(removeComponent).toHaveBeenCalledWith(mockWorld, entityId, component);
      expect(component.health[entityId]).toBe(100); // Сброс к значению по умолчанию
      expect(component.mana[entityId]).toBe(50.0); // Сброс к значению по умолчанию
    });
  });

  describe('метод component.inspect', () => {
    let component: EnhancedComponent<ComponentSchema>;

    beforeEach(() => {
      const schema: ComponentSchema = {
        health: { type: 'ui8', default: 100 },
        mana: { type: 'f32', default: 50.0 },
        position: { type: 'f64', default: 0.0 },
      };
      component = defineComponent('TestComponent', schema);

      // Мокаем TypedArrays
      (component as any).health = new Uint8Array(10000);
      (component as any).mana = new Float32Array(10000);
      (component as any).position = new Float64Array(10000);
    });

    it('должен возвращать текущие значения для сущности', () => {
      const entityId = 42;

      // Устанавливаем некоторые значения
      component.health[entityId] = 80;
      component.mana[entityId] = 75.5;
      component.position[entityId] = 10.5;

      const data = component.inspect(mockWorld, entityId);

      expect(data).toEqual({
        health: 80,
        mana: 75.5,
        position: 10.5,
      });
    });

    it('должен возвращать текущие значения из TypedArray', () => {
      const entityId = 99; // Сущность, которая не была изменена

      // Устанавливаем некоторые значения в TypedArrays
      (component as any).health[entityId] = 75;
      (component as any).mana[entityId] = 25.5;
      (component as any).position[entityId] = 10.5;

      const data = component.inspect(mockWorld, entityId);

      expect(data).toEqual({
        health: 75,
        mana: 25.5,
        position: 10.5,
      });
    });
  });

  describe('метод component.register', () => {
    let component: EnhancedComponent<ComponentSchema>;

    beforeEach(() => {
      const schema: ComponentSchema = {
        value: { type: 'ui32', default: 0 },
      };
      component = defineComponent('TestComponent', schema);
    });

    it('должен регистрировать компонент в мире', () => {
      component.register(mockWorld);

      expect(registerComponent).toHaveBeenCalledWith(mockWorld, component);
    });

    it('не должен регистрировать компонент несколько раз', () => {
      component.register(mockWorld);
      component.register(mockWorld);

      expect(registerComponent).toHaveBeenCalledTimes(1);
    });

    it('должен логировать регистрацию в dev режиме', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      component.register(mockWorld);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ComponentBuilder] Registered component: TestComponent',
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Валидация полей', () => {
    it('должен валидировать ограничения min/max в dev режиме', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const schema: ComponentSchema = {
        level: { type: 'ui8', default: 1, min: 1, max: 100 },
      };
      const component = defineComponent('LevelComponent', schema);

      // Тестируем значение ниже минимума
      component.create(mockWorld, 1, { level: 0 });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Value 0 for "level" is below min 1'),
      );

      // Тестируем значение выше максимума
      component.create(mockWorld, 2, { level: 150 });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Value 150 for "level" is above max 100'),
      );

      consoleWarnSpy.mockRestore();
    });

    it('должен пропускать валидацию в production режиме', () => {
      // Временно изменяем import.meta.env для этого теста
      const originalDev = import.meta.env.DEV;
      const originalProd = import.meta.env.PROD;

      // Симулируем production окружение
      (import.meta.env as any).DEV = false;
      (import.meta.env as any).PROD = true;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const schema: ComponentSchema = {
        value: { type: 'ui8', default: 0, min: 0, max: 10 },
      };
      const component = defineComponent('ProdComponent', schema);

      // Мокаем TypedArrays
      (component as any).value = new Uint8Array(10000);

      // Это обычно вызвало бы предупреждение, но должно быть пропущено в продакшене
      component.create(mockWorld, 1, { value: 100 });

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Восстанавливаем оригинальные значения
      (import.meta.env as any).DEV = originalDev;
      (import.meta.env as any).PROD = originalProd;

      consoleWarnSpy.mockRestore();
    });
  });
});
