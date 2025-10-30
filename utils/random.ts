/**
 * Utility functions for random number generation and selection.
 */

/**
 * Generate a random integer between min and max (inclusive).
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random integer between min and max.
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random float between min and max.
 */
function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Select a specified number of random items from an array.
 * @param items The array of items to choose from.
 * @param count The number of items to select.
 * @returns An array of randomly selected items.
 */
function randomChoice<T>(items: T[], count: number): T[] {
  // items の検証
  if (!Array.isArray(items) || items.length === 0) return [];

  // count の検証と正規化
  if (!Number.isFinite(count)) return [];
  const n = Math.floor(count);
  if (n <= 0) return [];
  const take = Math.min(items.length, n);

  // Fisher-Yates shuffle アルゴリズムでランダムに選択
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, take);
}

export { randInt, randFloat, randomChoice };
