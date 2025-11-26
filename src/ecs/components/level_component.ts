/**
 * Компонент уровня сущности.
 * Хранит текущий уровень и может использоваться для зданий, героев и т.д.
 *
 * **Теги**: `arch:ecs`, `component:level`
 */
export interface LevelComponent {
  level: number;
}

export const LevelType = 'Level' as const;
