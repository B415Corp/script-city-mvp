import { beforeEach, afterEach } from 'vitest';
import {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Prices,
  Workplace,
} from '../core/ecs/components';

// Импортируем для очистки компонентов из managers
const COMPONENT_REGISTRY = {
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Prices,
  Workplace,
} as const;

// Список всех компонентов для очистки
const COMPONENTS_TO_RESET = [
  Person,
  Citizen,
  Needs,
  Position,
  ID,
  Render,
  Schedule,
  Prices,
  Workplace,
] as const;

/**
 * Очищает все массивы компонентов между тестами
 * Это предотвращает загрязнение состояния между тестами
 */
function resetComponentArrays(): void {
  for (const component of COMPONENTS_TO_RESET) {
    // Очистить все массивы в компоненте
    for (const key in component) {
      if (Array.isArray(component[key as keyof typeof component])) {
        (component[key as keyof typeof component] as any[]).length = 0;
      }
    }
  }
}

beforeEach(() => {
  resetComponentArrays();
});

afterEach(() => {
  resetComponentArrays();
});
