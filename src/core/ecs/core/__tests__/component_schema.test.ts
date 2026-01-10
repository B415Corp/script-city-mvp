import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSimpleComponent,
  createComponentSchema,
  FieldBuilder,
  int8,
  uint8,
  uint16,
  uint32,
  float32,
  float64,
  entityId,
  index,
  percentage,
  count,
  money,
  inferBitECSType,
} from '../component_schema';
import { defineComponent } from '../component_builder';
import { addComponent, removeComponent } from 'bitecs';
import type { World } from 'bitecs';

// Моки функций BitECS
vi.mock('bitecs', () => ({
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
}));

// Мок defineComponent
vi.mock('../component_builder', () => ({
  defineComponent: vi.fn(),
}));

describe('Схема компонентов', () => {
  let mockWorld: World;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorld = {} as World;
  });

  describe('FieldBuilder', () => {
    it('должен создавать поле с правильным типом и значением по умолчанию', () => {
      const field = new FieldBuilder('ui8', 42);

      expect(field.getConfig()).toEqual({
        type: 'ui8',
        default: 42,
      });
    });

    it('должен устанавливать минимальное значение', () => {
      const field = int8(10).min(5);

      expect(field.getConfig()).toEqual({
        type: 'i8',
        default: 10,
        min: 5,
      });
    });

    it('должен устанавливать максимальное значение', () => {
      const field = uint16(100).max(500);

      expect(field.getConfig()).toEqual({
        type: 'ui16',
        default: 100,
        max: 500,
      });
    });

    it('должен устанавливать диапазон (минимум и максимум)', () => {
      const field = float32(50.0).range(0, 100);

      expect(field.getConfig()).toEqual({
        type: 'f32',
        default: 50.0,
        min: 0,
        max: 100,
      });
    });

    it('должен поддерживать цепочку модификаторов', () => {
      const field = uint8(50).min(10).max(200);

      expect(field.getConfig()).toEqual({
        type: 'ui8',
        default: 50,
        min: 10,
        max: 200,
      });
    });
  });

  describe('Билдеры типов полей', () => {
    it('должен создавать поле int8', () => {
      const field = int8(-5);

      expect(field.getConfig()).toEqual({
        type: 'i8',
        default: -5,
      });
    });

    it('должен создавать поле uint8', () => {
      const field = uint8(255);

      expect(field.getConfig()).toEqual({
        type: 'ui8',
        default: 255,
      });
    });

    it('должен создавать поле uint16', () => {
      const field = uint16(65000);

      expect(field.getConfig()).toEqual({
        type: 'ui16',
        default: 65000,
      });
    });

    it('должен создавать поле uint32', () => {
      const field = uint32(100000);

      expect(field.getConfig()).toEqual({
        type: 'ui32',
        default: 100000,
      });
    });

    it('должен создавать поле float32', () => {
      const field = float32(3.14);

      expect(field.getConfig()).toEqual({
        type: 'f32',
        default: 3.14,
      });
    });

    it('должен создавать поле float64', () => {
      const field = float64(2.71828);

      expect(field.getConfig()).toEqual({
        type: 'f64',
        default: 2.71828,
      });
    });
  });

  describe('Специализированные билдеры полей', () => {
    it('должен создавать поле entityId (uint32)', () => {
      const field = entityId(123);

      expect(field.getConfig()).toEqual({
        type: 'ui32',
        default: 123,
      });
    });

    it('должен создавать поле index (uint8)', () => {
      const field = index(5);

      expect(field.getConfig()).toEqual({
        type: 'ui8',
        default: 5,
      });
    });

    it('должен создавать поле percentage (uint8, 0-100)', () => {
      const field = percentage(75);

      expect(field.getConfig()).toEqual({
        type: 'ui8',
        default: 75,
        min: 0,
        max: 100,
      });
    });

    it('должен создавать поле count (uint16, min: 0)', () => {
      const field = count(1000);

      expect(field.getConfig()).toEqual({
        type: 'ui16',
        default: 1000,
        min: 0,
      });
    });

    it('должен создавать поле money (float32, min: 0)', () => {
      const field = money(99.99);

      expect(field.getConfig()).toEqual({
        type: 'f32',
        default: 99.99,
        min: 0,
      });
    });
  });

  describe('inferBitECSType', () => {
    it('должен определять signed integers для отрицательных значений', () => {
      expect(inferBitECSType(-1)).toBe('i8');
      expect(inferBitECSType(-128)).toBe('i8');
      expect(inferBitECSType(-129)).toBe('i16');
      expect(inferBitECSType(-32768)).toBe('i16');
      expect(inferBitECSType(-32769)).toBe('i32');
    });

    it('должен определять unsigned integers для положительных значений', () => {
      expect(inferBitECSType(0)).toBe('ui8');
      expect(inferBitECSType(100)).toBe('ui8');
      expect(inferBitECSType(255)).toBe('ui8');
      expect(inferBitECSType(256)).toBe('ui16');
      expect(inferBitECSType(65535)).toBe('ui16');
      expect(inferBitECSType(65536)).toBe('ui32');
      expect(inferBitECSType(4294967295)).toBe('ui32');
      expect(inferBitECSType(4294967296)).toBe('ui32'); // Все еще ui32 для очень больших чисел
    });

    it('должен определять float типы для десятичных значений', () => {
      expect(inferBitECSType(3.14)).toBe('f32');
      expect(inferBitECSType(0.5)).toBe('f32');
      // Примечание: 0.0 становится 0 в JavaScript, поэтому возвращает ui8
      expect(inferBitECSType(0.0)).toBe('ui8');
    });

    it('должен определять float типы перед signed integers', () => {
      expect(inferBitECSType(-2.5)).toBe('f32'); // Отрицательный float должен быть f32, а не i8
    });
  });

  describe('createSimpleComponent', () => {
    beforeEach(() => {
      (defineComponent as any).mockReturnValue({
        name: 'MockComponent',
        schema: {},
        create: vi.fn(),
        remove: vi.fn(),
      });
    });

    it('должен создавать компонент с автоматическим определением типов', () => {
      const defaults = {
        health: 100, // ui8
        mana: 50.5, // f32
        position: 0.0, // ui8 (0.0 становится 0 в JavaScript)
        negative: -10, // i8
        large: 100000, // ui32
      };

      const component = createSimpleComponent('TestComponent', defaults);

      expect(defineComponent).toHaveBeenCalledWith('TestComponent', {
        health: { type: 'ui8', default: 100 },
        mana: { type: 'f32', default: 50.5 },
        position: { type: 'ui8', default: 0.0 },
        negative: { type: 'i8', default: -10 },
        large: { type: 'ui32', default: 100000 },
      });

      expect(component).toBeDefined();
    });

    it('должен создавать компонент с пользовательским методом create', () => {
      const mockComponent = {
        name: 'TestComponent',
        schema: { value: { type: 'ui8', default: 0 } },
        create: vi.fn(),
        remove: vi.fn(),
      };

      (defineComponent as any).mockReturnValue(mockComponent);

      const component = createSimpleComponent('TestComponent', { value: 42 });

      // Добавляем TypedArray после создания компонента
      (component as any).value = new Uint8Array(10000);

      const entityId = 1;
      component.create(mockWorld, entityId, { value: 100 });

      expect(addComponent).toHaveBeenCalledWith(mockWorld, entityId, component);
      expect(component.value[entityId]).toBe(100);
    });

    it('должен создавать компонент с пользовательским методом remove', () => {
      const mockComponent = {
        name: 'TestComponent',
        schema: { value: { type: 'ui8', default: 42 } },
        create: vi.fn(),
        remove: vi.fn(),
      };

      (defineComponent as any).mockReturnValue(mockComponent);

      const component = createSimpleComponent('TestComponent', { value: 42 });

      // Добавляем TypedArray после создания компонента
      (component as any).value = new Uint8Array(10000);

      const entityId = 1;
      component.remove(mockWorld, entityId);

      expect(removeComponent).toHaveBeenCalledWith(mockWorld, entityId, component);
      expect(component.value[entityId]).toBe(42); // Сброс к значению по умолчанию
    });

    it('должен валидировать значения в dev режиме', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockComponent = {
        name: 'TestComponent',
        schema: { value: { type: 'ui8', default: 0 } },
        create: vi.fn(),
        remove: vi.fn(),
      };

      (defineComponent as any).mockReturnValue(mockComponent);

      const component = createSimpleComponent('TestComponent', { value: 0 });

      // Добавляем TypedArray после создания компонента
      (component as any).value = new Uint8Array(10000);

      component.create(mockWorld, 1, { value: NaN });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Component TestComponent] Invalid value for "value"'),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('createComponentSchema', () => {
    it('должен создавать компонент из билдеров полей', () => {
      const fields = {
        health: uint8(100).max(200),
        money: money(50.0),
        level: index(1).range(1, 99),
      };

      const component = createComponentSchema('AdvancedComponent', fields);

      expect(defineComponent).toHaveBeenCalledWith('AdvancedComponent', {
        health: { type: 'ui8', default: 100, max: 200 },
        money: { type: 'f32', default: 50.0, min: 0 },
        level: { type: 'ui8', default: 1, min: 1, max: 99 },
      });

      expect(component).toBeDefined();
    });

    it('должен обрабатывать пустой объект полей', () => {
      const component = createComponentSchema('EmptyComponent', {});

      expect(defineComponent).toHaveBeenCalledWith('EmptyComponent', {});
      expect(component).toBeDefined();
    });
  });
});
