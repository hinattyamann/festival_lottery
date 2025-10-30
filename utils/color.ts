/**
 * 色操作に関するユーティリティ関数
 */

/**
 * Converts a hexadecimal color code to its RGB components.
 *
 * @param hex - A string representing a hexadecimal color code (e.g., `#RRGGBB`).
 *              Must be a valid 6-character hexadecimal color prefixed with `#`.
 * @returns An array of three numbers representing the red, green, and blue components
 *          of the color, each in the range of 0 to 255.
 * @throws Will throw an error if the input is not a valid hexadecimal color code.
 */
function getRGB(hex: string): number[] {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) {
    throw new Error("Invalid hex color");
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Lightens a given hexadecimal color by mixing it with white.
 *
 * @param hex - A string representing a hexadecimal color code (e.g., `#RRGGBB`).
 *              Must be a valid 6-character hexadecimal color prefixed with `#`.
 * @param ratio - A number between 0 and 1 representing the ratio of white to mix
 *                with the original color. Defaults to `0.6`.
 * @returns A string representing the lightened hexadecimal color code.
 * @throws Will throw an error if the input is not a valid hexadecimal color code.
 */
function lightColor(hex: string, ratio = 0.6): string {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const t = clamp01(ratio);

  const mix = (c: number) => Math.round(c + (255 - c) * t);

  const rgb = getRGB(hex);
  const lightenHex = rgb
    .map((c) => mix(c).toString(16).padStart(2, "0").toUpperCase())
    .join("");

  return `#${lightenHex}`;
}

export { lightColor };
