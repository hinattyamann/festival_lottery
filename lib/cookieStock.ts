// lib/cookieStock.ts
"use client";

import Cookies from "js-cookie";
import type { Inventory } from "./lottery";

export type DrawCounts = Record<string, number>;

const KEY = "drawCounts";

/** Cookie から累積抽選回数を読み込む（不正値は 0 扱い） */
export function readCounts(): DrawCounts {
  try {
    const raw = Cookies.get(KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return {};
    const out: DrawCounts = {};
    for (const [k, v] of Object.entries(obj)) {
      const n = Number(v);
      out[k] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    }
    return out;
  } catch {
    return {};
  }
}

/** 累積抽選回数を書き戻す（1年保持） */
export function writeCounts(counts: DrawCounts) {
  Cookies.set(KEY, JSON.stringify(counts), { expires: 365, sameSite: "Lax" });
}

/** 特定の賞のカウントを +delta して保存（戻り値は最新の Map） */
export function incCount(prize: string, delta = 1): DrawCounts {
  const counts = readCounts();
  const cur = counts[prize] ?? 0;
  const add = Math.max(0, Math.floor(delta));
  counts[prize] = cur + add;
  writeCounts(counts);
  return counts;
}

/** （デモ・リセット用）Cookie を削除 */
export function resetCounts() {
  Cookies.remove(KEY);
}

/** 初期在庫に Cookie の累積抽選回数を差し引いて、負数にならないように丸める */
export function applyCountsToStock(initial: Inventory, counts: DrawCounts): Inventory {
  const out: Inventory = { ...initial };
  for (const [prize, initStock] of Object.entries(initial)) {
    const used = Math.max(0, Math.floor(counts[prize] ?? 0));
    const remain = Math.max(0, (initStock ?? 0) - used);
    out[prize] = remain;
  }
  return out;
}
