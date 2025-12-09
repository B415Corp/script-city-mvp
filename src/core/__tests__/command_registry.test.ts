import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry } from '../command_processor/command_registry';
import { ICommandHandler } from '../command_processor/command_handler';

const makeHandler = (type: string): ICommandHandler => ({
  commandType: type,
  validate: vi.fn(),
  apply: vi.fn(),
});

// Тестируем регистрацию, перезапись и очистку хэндлеров в реестре.
describe('CommandRegistry', () => {
  it('registers and returns handlers', () => {
    // Шаг 1: создаём реестр и хэндлер.
    const registry = new CommandRegistry();
    const handler = makeHandler('Test');

    // Шаг 2: регистрируем хэндлер.
    registry.registerHandler(handler);

    // Шаг 3: убеждаемся, что он доступен и тип зарегистрирован.
    expect(registry.getHandler('Test')).toBe(handler);
    expect(registry.getRegisteredTypes()).toEqual(['Test']);
  });

  it('overrides handler for same type and supports clear', () => {
    // Шаг 1: реестр и два хэндлера с одинаковым типом.
    const registry = new CommandRegistry();
    const first = makeHandler('Same');
    const second = makeHandler('Same');

    // Шаг 2: регистрируем первый и сразу же перезаписываем вторым.
    registry.registerHandler(first);
    registry.registerHandler(second);

    // Шаг 3: проверяем, что остался второй.
    expect(registry.getHandler('Same')).toBe(second);

    // Шаг 4: чистим реестр и убеждаемся, что он пуст.
    registry.clear();
    expect(registry.getHandler('Same')).toBeUndefined();
    expect(registry.getRegisteredTypes()).toEqual([]);
  });
});
