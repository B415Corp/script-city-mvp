import { describe, it, expect } from 'vitest';

// Просто проверяем, что импорты работают
import './__tests__/performance/components';
import './__tests__/performance/entities';
import './__tests__/performance/systems';
import './__tests__/performance/clusters';

describe('Performance Test Minimal', () => {
  it('должен импортировать компоненты производительности', () => {
    expect(true).toBe(true);
  });
});
