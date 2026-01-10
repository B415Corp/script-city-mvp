import { beforeEach, afterEach } from 'vitest';

// TODO: Re-enable component cleanup when ECS components are implemented
// import {
//   Person,
//   Citizen,
//   Needs,
//   Position,
//   ID,
//   Render,
//   Schedule,
//   Workplace,
// } from '../core/ecs/components';

// // Импортируем для очистки компонентов из managers
// const COMPONENT_REGISTRY = {
//   Person,
//   Citizen,
//   Needs,
//   Position,
//   ID,
//   Render,
//   Schedule,
//   Workplace,
// } as const;

// // Список всех компонентов для очистки
// const COMPONENTS_TO_RESET = [
//   Person,
//   Citizen,
//   Needs,
//   Position,
//   ID,
//   Render,
//   Schedule,
//   Workplace,
// ] as const;

/**
 * Очищает все массивы компонентов между тестами
 * Это предотвращает загрязнение состояния между тестами
 * TODO: Re-enable when ECS components are implemented
 */
function resetComponentArrays(): void {
  // for (const component of COMPONENTS_TO_RESET) {
  //   // Очистить все массивы в компоненте
  //   for (const key in component) {
  //     if (Array.isArray(component[key as keyof typeof component])) {
  //       (component[key as keyof typeof component] as any[]).length = 0;
  //     }
  //   }
  // }
}

// TODO: Re-enable component cleanup when ECS components are implemented
beforeEach(() => {
  // resetComponentArrays();
});

afterEach(() => {
  // resetComponentArrays();
});
