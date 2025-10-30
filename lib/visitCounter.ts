// lib/visitCounter.ts
// 履歴配列から「入場数」を計算。
// 仕様: 履歴は昇順返却だが、安全のため visitedAt 昇順に並べ直してから計算。
// ルール: history 件数をカウント。ただし "attraction":"lottery" が出たら
// その位置でリセットし「それ以降」の件数のみ数える。

export type VisitEntry = {
  attraction: string;
  personality?: string;
  staff?: string;
  visitedAt: string; // ISO 8601
};

export function computeVisitsFromHistory(history: VisitEntry[]): number {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const sorted = [...history].sort(
    (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()
  );

  let lastLotteryIdx = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i]?.attraction === "prize") {
      lastLotteryIdx = i;
      break;
    }
  }

  return lastLotteryIdx < 0
    ? sorted.length
    : Math.max(0, sorted.length - (lastLotteryIdx + 1));
}
