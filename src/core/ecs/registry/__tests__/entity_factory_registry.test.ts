import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityFactoryRegistry, EntityFactoryFunction } from '../entity_factory_registry';

describe('EntityFactoryRegistry', () => {
  let registry: EntityFactoryRegistry;

  beforeEach(() => {
    // Получаем экземпляр реестра и очищаем его перед каждым тестом
    registry = EntityFactoryRegistry.getInstance();
    registry.clear();
  });

  describe('Singleton pattern', () => {
    it('должен возвращать один и тот же экземпляр', () => {
      const instance1 = EntityFactoryRegistry.getInstance();
      const instance2 = EntityFactoryRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(registry);
    });
  });

  describe('register', () => {
    it('должен успешно регистрировать фабрику сущностей', () => {
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(42);

      registry.register('PlayerFactory', factoryFn, 'Creates player entities');

      expect(registry.has('PlayerFactory')).toBe(true);
      const registered = registry.get('PlayerFactory');
      expect(registered).toBeDefined();
      expect(registered!.name).toBe('PlayerFactory');
      expect(registered!.factory).toBe(factoryFn);
      expect(registered!.description).toBe('Creates player entities');
    });

    it('должен регистрировать фабрику без описания', () => {
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(123);

      registry.register('EnemyFactory', factoryFn);

      const registered = registry.get('EnemyFactory');
      expect(registered).toBeDefined();
      expect(registered!.name).toBe('EnemyFactory');
      expect(registered!.factory).toBe(factoryFn);
      expect(registered!.description).toBeUndefined();
    });

    it('должен выбрасывать ошибку при повторной регистрации фабрики', () => {
      const factory1: EntityFactoryFunction = vi.fn().mockReturnValue(1);
      const factory2: EntityFactoryFunction = vi.fn().mockReturnValue(2);

      registry.register('TestFactory', factory1);

      expect(() => registry.register('TestFactory', factory2)).toThrow(
        'Entity factory "TestFactory" is already registered',
      );
    });

    it('должен позволять регистрировать фабрики с разными именами', () => {
      const factory1: EntityFactoryFunction = vi.fn().mockReturnValue(1);
      const factory2: EntityFactoryFunction = vi.fn().mockReturnValue(2);

      registry.register('Factory1', factory1, 'Description 1');
      registry.register('Factory2', factory2, 'Description 2');

      expect(registry.has('Factory1')).toBe(true);
      expect(registry.has('Factory2')).toBe(true);
      expect(registry.size()).toBe(2);
    });
  });

  describe('get', () => {
    it('должен возвращать зарегистрированную фабрику', () => {
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(42);
      registry.register('TestFactory', factoryFn, 'Test description');

      const retrieved = registry.get('TestFactory');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('TestFactory');
      expect(retrieved!.factory).toBe(factoryFn);
      expect(retrieved!.description).toBe('Test description');
    });

    it('должен возвращать undefined для незарегистрированной фабрики', () => {
      const retrieved = registry.get('NonExistentFactory');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('create', () => {
    it('должен создавать сущность через зарегистрированную фабрику', () => {
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(42);
      registry.register('PlayerFactory', factoryFn);

      const entityId = registry.create('PlayerFactory');

      expect(entityId).toBe(42);
      expect(factoryFn).toHaveBeenCalledTimes(1);
    });

    it('должен выбрасывать ошибку при попытке создать сущность через незарегистрированную фабрику', () => {
      expect(() => registry.create('NonExistentFactory')).toThrow(
        'Entity factory "NonExistentFactory" not found',
      );
    });

    it('должен правильно передавать результат фабричной функции', () => {
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(999);
      registry.register('TestFactory', factoryFn);

      const result1 = registry.create('TestFactory');
      const result2 = registry.create('TestFactory');

      expect(result1).toBe(999);
      expect(result2).toBe(999);
      expect(factoryFn).toHaveBeenCalledTimes(2);
    });

    it('должен позволять фабрикам возвращать разные значения', () => {
      let counter = 0;
      const factoryFn: EntityFactoryFunction = vi.fn().mockImplementation(() => ++counter);

      registry.register('CounterFactory', factoryFn);

      const result1 = registry.create('CounterFactory');
      const result2 = registry.create('CounterFactory');
      const result3 = registry.create('CounterFactory');

      expect(result1).toBe(1);
      expect(result2).toBe(2);
      expect(result3).toBe(3);
      expect(factoryFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAll', () => {
    it('должен возвращать все зарегистрированные фабрики', () => {
      const factory1: EntityFactoryFunction = vi.fn();
      const factory2: EntityFactoryFunction = vi.fn();

      registry.register('Factory1', factory1, 'Desc 1');
      registry.register('Factory2', factory2, 'Desc 2');

      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(2);
      expect(all.get('Factory1')!.factory).toBe(factory1);
      expect(all.get('Factory1')!.description).toBe('Desc 1');
      expect(all.get('Factory2')!.factory).toBe(factory2);
      expect(all.get('Factory2')!.description).toBe('Desc 2');
    });

    it('должен возвращать пустую Map если нет зарегистрированных фабрик', () => {
      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(0);
    });

    it('должен возвращать копию Map, а не оригинал', () => {
      const factory: EntityFactoryFunction = vi.fn();
      registry.register('TestFactory', factory);

      const all = registry.getAll();

      // Изменение возвращенной Map не должно влиять на оригинал
      all.set('NewFactory', { name: 'NewFactory', factory: vi.fn() });
      expect(registry.has('NewFactory')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('has', () => {
    it('должен возвращать true для зарегистрированной фабрики', () => {
      const factory: EntityFactoryFunction = vi.fn();
      registry.register('TestFactory', factory);

      expect(registry.has('TestFactory')).toBe(true);
    });

    it('должен возвращать false для незарегистрированной фабрики', () => {
      expect(registry.has('NonExistentFactory')).toBe(false);
    });
  });

  describe('clear', () => {
    it('должен очищать все зарегистрированные фабрики', () => {
      const factory1: EntityFactoryFunction = vi.fn();
      const factory2: EntityFactoryFunction = vi.fn();

      registry.register('Factory1', factory1);
      registry.register('Factory2', factory2);

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Factory1')).toBe(false);
      expect(registry.has('Factory2')).toBe(false);
    });
  });

  describe('size', () => {
    it('должен возвращать правильное количество зарегистрированных фабрик', () => {
      expect(registry.size()).toBe(0);

      const factory1: EntityFactoryFunction = vi.fn();
      registry.register('Factory1', factory1);
      expect(registry.size()).toBe(1);

      const factory2: EntityFactoryFunction = vi.fn();
      registry.register('Factory2', factory2);
      expect(registry.size()).toBe(2);
    });
  });

  describe('Интеграционные тесты', () => {
    it('должен поддерживать полный цикл: регистрация -> создание -> очистка', () => {
      // Регистрация фабрики
      const factoryFn: EntityFactoryFunction = vi.fn().mockReturnValue(100);
      registry.register('PlayerFactory', factoryFn, 'Creates players');

      // Проверка состояния
      expect(registry.size()).toBe(1);
      expect(registry.has('PlayerFactory')).toBe(true);

      // Создание сущностей
      const entity1 = registry.create('PlayerFactory');
      const entity2 = registry.create('PlayerFactory');

      expect(entity1).toBe(100);
      expect(entity2).toBe(100);
      expect(factoryFn).toHaveBeenCalledTimes(2);

      // Получение информации
      const registered = registry.get('PlayerFactory');
      expect(registered!.name).toBe('PlayerFactory');
      expect(registered!.description).toBe('Creates players');

      // Получение всех фабрик
      const all = registry.getAll();
      expect(all.size).toBe(1);
      expect(all.has('PlayerFactory')).toBe(true);

      // Очистка
      registry.clear();
      expect(registry.size()).toBe(0);
      expect(registry.has('PlayerFactory')).toBe(false);
      expect(() => registry.create('PlayerFactory')).toThrow();
    });

    it('должен поддерживать множественные фабрики с разными характеристиками', () => {
      let playerId = 1000;
      let enemyId = 2000;
      let itemId = 3000;

      const playerFactory: EntityFactoryFunction = vi.fn().mockImplementation(() => playerId++);
      const enemyFactory: EntityFactoryFunction = vi.fn().mockImplementation(() => enemyId++);
      const itemFactory: EntityFactoryFunction = vi.fn().mockImplementation(() => itemId++);

      registry.register('player', playerFactory, 'Player entities');
      registry.register('enemy', enemyFactory, 'Enemy entities');
      registry.register('item', itemFactory, 'Item entities');

      // Создание сущностей разных типов
      const player1 = registry.create('player');
      const player2 = registry.create('player');
      const enemy1 = registry.create('enemy');
      const item1 = registry.create('item');
      const item2 = registry.create('item');

      expect(player1).toBe(1000);
      expect(player2).toBe(1001);
      expect(enemy1).toBe(2000);
      expect(item1).toBe(3000);
      expect(item2).toBe(3001);

      expect(playerFactory).toHaveBeenCalledTimes(2);
      expect(enemyFactory).toHaveBeenCalledTimes(1);
      expect(itemFactory).toHaveBeenCalledTimes(2);
    });
  });
});
