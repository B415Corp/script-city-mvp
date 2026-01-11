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

// Mock BitECS functions and types
vi.mock('bitecs', () => ({
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
  registerComponent: vi.fn(),
  createWorld: vi.fn(() => ({})), // Return empty object as mock world
  addEntity: vi.fn(() => 1), // Return mock entity ID
  World: {},
  EntityId: {},
}));

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
