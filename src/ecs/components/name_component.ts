/**
 * Компонент имени сущности.
 * Используется для идентификации сущностей в логах и UI.
 *
 * **Теги**: `arch:ecs`, `component:name`
 */
export interface NameComponent {
  name: string;
}

export const NameType = 'Name' as const;
