/**
 * 配列操作に関するユーティリティ関数
 */

type SwapMap = [number, number][];

/**
 * Creates a new array by shuffling the elements of the input array
 * according to the specified swap map.
 *
 * @template T The type of elements in the array.
 * @param arr The input array to be shuffled. This array is not modified.
 * @param swapMap An array of index pairs that specify the swap operations
 * to perform on the input array.
 * @returns A new array with elements shuffled according to the swap map.
 */
function shuffleByMap<T>(arr: readonly T[], swapMap: SwapMap): T[] {
  const out = Array.from(arr);
  for (const [i, j] of swapMap) {
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export { type SwapMap, shuffleByMap };
