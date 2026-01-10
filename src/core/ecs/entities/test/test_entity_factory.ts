import { createEntityFactory } from '../../core/smart_constructors';

/**
 * Тестовая фабрика сущностей для проверки работы автоматической регистрации
 * Создан с использованием createEntityFactory() в Phase 4
 */

// Фабрика для создания тестовой сущности с базовыми компонентами
export const createTestEntity = createEntityFactory(
  'test_entity',
  () => {
    // В реальном приложении здесь будет:
    // const entityId = addEntity(world);
    // addComponent(world, entityId, TestComponent);
    // addComponent(world, entityId, AnotherTestComponent);
    // Инициализация компонентов...
    console.log('TestEntity created via factory');
    return Math.floor(Math.random() * 1000000); // Имитация entityId
  },
  'Создает тестовую сущность с компонентами TestComponent и AnotherTestComponent',
);

// Фабрика для создания игрока
export const createPlayerEntity = createEntityFactory(
  'player_entity',
  () => {
    // Имитация создания игрока
    console.log('Player entity created with health, position, and inventory');
    return Math.floor(Math.random() * 1000000);
  },
  'Создает сущность игрока с полным набором компонентов',
);

// Фабрика для создания NPC
export const createNpcEntity = createEntityFactory(
  'npc_entity',
  () => {
    // Имитация создания NPC
    console.log('NPC entity created with AI, dialogue, and quest components');
    return Math.floor(Math.random() * 1000000);
  },
  'Создает сущность NPC с компонентами поведения и взаимодействия',
);
