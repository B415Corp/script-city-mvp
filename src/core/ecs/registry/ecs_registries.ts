import { ComponentRegistry } from './component_registry';
import { SystemRegistry } from './system_registry';
import { ClusterRegistry } from './cluster_registry';
import { EntityFactoryRegistry } from './entity_factory_registry';

/** Контейнер ECS-реестров. Позволяет изолировать состояние между менеджерами/тестами. */
export interface ECSRegistries {
  components: ComponentRegistry;
  systems: SystemRegistry;
  clusters: ClusterRegistry;
  entityFactories: EntityFactoryRegistry;
}

/** Создать свежий изолированный набор реестров (без синглтонов). */
export function createECSRegistries(): ECSRegistries {
  return {
    components: new ComponentRegistry(),
    systems: new SystemRegistry(),
    clusters: new ClusterRegistry(),
    entityFactories: new EntityFactoryRegistry(),
  };
}

/** Fallback-адаптер на глобальные синглтоны (обратная совместимость). */
export function getGlobalECSRegistries(): ECSRegistries {
  return {
    components: ComponentRegistry.getInstance(),
    systems: SystemRegistry.getInstance(),
    clusters: ClusterRegistry.getInstance(),
    entityFactories: EntityFactoryRegistry.getInstance(),
  };
}
