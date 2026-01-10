import { World } from 'bitecs';

/**
 * Component Manager - изолированный интерфейс для работы с компонентами
 * ВРЕМЕННО ОТКЛЮЧЕН во время рефакторинга компонентов на TypedArrays
 * TODO: Адаптировать для новых компонентов
 */
export class ComponentManager {
  constructor(private world: World) {
    // Заглушка для совместимости
    console.warn('ComponentManager is temporarily disabled during component refactoring');
  }
}
