import { describe, it, expect } from 'vitest';
import { ComponentRegistry } from '../../registry/component_registry';
import { EntityFactoryRegistry } from '../../registry/entity_factory_registry';

describe('Simple Performance Test', () => {
  it('должен зарегистрировать компоненты производительности', () => {
    const registry = ComponentRegistry.getInstance();

    expect(registry.has('PerformanceCitizen')).toBe(true);
    expect(registry.has('PerformanceBuilding')).toBe(true);
    expect(registry.has('PerformanceVehicle')).toBe(true);
    expect(registry.has('SimplePerformance')).toBe(true);
  });

  it('должен зарегистрировать фабрики производительности', () => {
    const registry = EntityFactoryRegistry.getInstance();

    expect(registry.has('performance_citizen')).toBe(true);
    expect(registry.has('performance_building')).toBe(true);
    expect(registry.has('performance_vehicle')).toBe(true);
    expect(registry.has('simple_performance_entity')).toBe(true);
  });
});
