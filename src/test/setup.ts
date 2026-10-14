import { vi, beforeEach } from 'vitest';

// Mock Phaser globally
(globalThis as any).Phaser = {
  AUTO: 0,
  Scene: class MockScene {
    add = vi.fn();
    scene = {
      add: vi.fn(),
      remove: vi.fn(),
    };
  },
  Game: vi.fn().mockImplementation((config) => ({
    scale: {
      resize: vi.fn(),
    },
    events: {
      once: vi.fn(),
    },
    scene: {
      getScene: vi.fn(),
    },
    destroy: vi.fn(),
  })),
  Types: {
    Core: {
      GameConfig: {},
    },
  },
};

vi.mock('phaser', () => ({
  Scene: (globalThis as any).Phaser.Scene,
}));

// BitECS: используем реальную реализацию. Полностью мокать библиотеку нельзя —
// ECS-тесты и перф-бенчмарки должны работать на настоящем мире и запросах.
// Отдельные тесты, которым нужен изолированный мир, мокают bitecs сами (см. ecs_manager.test.ts).
vi.mock('bitecs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bitecs')>();
  return { ...actual };
});

// Mock window for Phaser
Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

// Mock environment for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: true,
    PROD: false,
  },
  writable: false,
});

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
