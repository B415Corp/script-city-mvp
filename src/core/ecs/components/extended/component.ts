import { registerComponent, createWorld, addEntity, addComponent, EntityId, World } from 'bitecs';

type props<T extends Record<string, unknown>> = T;

const Position = { x: new Float32Array(1e5), y: new Float32Array(1e5) };
const Velocity = { dx: new Float32Array(1e5), dy: new Float32Array(1e5) };

export class Component<T extends Record<string, unknown>> {
  private data!: Float32Array;
  private world!: World;
  private entity!: EntityId;

  constructor(world: World, entity: EntityId, args: props<T>) {
    this.data = this.parseTypes(args);
    this.world = world;
    this.entity = entity;
  }

  public define(): void {
    addComponent(this.world, this.entity, this.data);
  }

  /**
   * Преобразует значение в Float32Array для хранения в ECS компоненте
   * @param arg - Значение для преобразования
   * @returns Float32Array с преобразованным значением
   * @throws Error если тип не поддерживается
   */
  private parseTypes(arg: unknown): Float32Array {
    const type = typeof arg;

    switch (type) {
      case 'number': {
        // Проверяем на NaN и Infinity для лучшей DX
        if (!isFinite(arg as number)) {
          throw new Error(`Недопустимое числовое значение: ${arg}. Ожидается конечное число.`);
        }
        return new Float32Array([arg as number]);
      }

      case 'boolean':
        return new Float32Array([(arg as boolean) ? 1 : 0]);

      case 'string': {
        // Для строк пытаемся преобразовать в число, иначе ошибка
        const numValue = Number(arg as string);
        if (isNaN(numValue)) {
          throw new Error(
            `Не удается преобразовать строку "${arg}" в число. Ожидается числовая строка.`,
          );
        }
        if (!isFinite(numValue)) {
          throw new Error(`Строка "${arg}" содержит недопустимое числовое значение.`);
        }
        return new Float32Array([numValue]);
      }

      default: {
        // Поддержка массивов чисел
        if (Array.isArray(arg)) {
          const numbers = (arg as unknown[]).map((item, index) => {
            if (typeof item !== 'number' || !isFinite(item as number)) {
              throw new Error(
                `Элемент массива с индексом ${index} не является допустимым числом: ${item}`,
              );
            }
            return item as number;
          });
          return new Float32Array(numbers);
        }

        throw new Error(
          `Неподдерживаемый тип данных: ${type}. ` +
            `Поддерживаемые типы: number, boolean, string (числовая), number[]`,
        );
      }
    }
  }
}
