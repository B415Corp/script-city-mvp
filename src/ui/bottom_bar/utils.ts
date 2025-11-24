/**
 * Вспомогательные функции форматирования для UI компонентов.
 *
 * Теги: arch:ui, util:formatting
 */

/**
 * Форматирование денежной суммы.
 * @param amount - сумма в числовом формате
 * @returns Отформатированная строка (например, "$50K", "$1.5M")
 */
export function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

/**
 * Форматирование численности населения.
 * @param population - численность населения
 * @returns Отформатированная строка (например, "1.5K", "2.3M")
 */
export function formatPopulation(population: number): string {
  if (population >= 1000000) {
    return `${(population / 1000000).toFixed(1)}M`;
  }
  if (population >= 1000) {
    return `${(population / 1000).toFixed(1)}K`;
  }
  return `${population}`;
}
