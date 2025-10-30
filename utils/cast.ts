/* 型変換ユーティリティ */
import type { Nullable } from "@/types/utils";

/**
 * オブジェクトのundefinedなプロパティをnullに変換する
 * @param obj 対象オブジェクト
 * @returns 変換後のオブジェクト
 */
function toNullable<T>(obj: Partial<T>): Nullable<T> {
  const result = {} as Nullable<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    result[key] = obj[key] === undefined ? null : obj[key]!;
  });
  return result;
}

export { toNullable };
