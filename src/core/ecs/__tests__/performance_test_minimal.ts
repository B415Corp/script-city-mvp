import { describe, it, expect } from 'vitest';

// Просто проверяем, что импорты работают
import './performance/components';
import './performance/entities';
import './performance/systems';
import './performance/clusters';

describe('Performance Test Minimal', () => {
  it('должен импортировать компоненты производительности', () => {
    expect(true).toBe(true);
  });
});
