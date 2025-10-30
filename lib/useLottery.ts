// lib/useLottery.ts
"use client";

import { useMemo, useState, useCallback } from "react";
import { Lottery, type Inventory, type Weights, computeProbs } from "./lottery";
import { readCounts, incCount, applyCountsToStock, resetCounts } from "./cookieStock";

export type UseLotteryOptions = {
  initialStock?: Inventory;
  N?: number;
  beta?: number;
  Mcap?: number;
  gainTargets?: string[];
  loseNames?: string[];
  weights?: Weights;
};

export function useLottery(opts?: UseLotteryOptions) {
  // ---- Defaults (初期値) ----
  const N_init = opts?.N ?? 3;
  const beta_init = opts?.beta ?? 0.15;
  const Mcap_init = opts?.Mcap ?? 2.0;
  const gainTargets_init = opts?.gainTargets ?? ["大当たり", "中当たり", "小当たり"];
  const loseNames_init = opts?.loseNames ?? ["はずれ"];

  const defaultWeights: Weights = {
    "大当たり": 1.0,
    "中当たり": 1.0,
    "小当たり": 1.0,
    "はずれ": 1.0,
  };

  // ---- localStorage keys ----
  const LS_BASE_STOCK = "lottery.baseStock.v1";
  const LS_PARAMS     = "lottery.params.v1";   // { N, beta, Mcap }
  const LS_WEIGHTS    = "lottery.weights.v1";  // Weights

  // ---- 可変パラメータ（管理画面から変更可能・永続化対応） ----
  const [N, setN] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try { const r = localStorage.getItem(LS_PARAMS); if (r) return (JSON.parse(r).N ?? N_init); } catch {}
    }
    return N_init;
  });
  const [beta, setBeta] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try { const r = localStorage.getItem(LS_PARAMS); if (r) return (JSON.parse(r).beta ?? beta_init); } catch {}
    }
    return beta_init;
  });
  const [Mcap, setMcap] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try { const r = localStorage.getItem(LS_PARAMS); if (r) return (JSON.parse(r).Mcap ?? Mcap_init); } catch {}
    }
    return Mcap_init;
  });
  const [gainTargets, setGainTargets] = useState<string[]>(gainTargets_init);
  const [loseNames, setLoseNames] = useState<string[]>(loseNames_init);
  const [weights, setWeights] = useState<Weights>(() => {
    if (typeof window !== "undefined") {
      try { const r = localStorage.getItem(LS_WEIGHTS); if (r) return JSON.parse(r) as Weights; } catch {}
    }
    return opts?.weights ?? defaultWeights;
  });

  // ---- Inventory state (UI-managed) ----
  const initialStock: Inventory = opts?.initialStock ?? {
    "大当たり": 3,
    "中当たり": 30,
    "小当たり": 99,
    "はずれ": 418,
  };
  
  // ---- 基準在庫（管理者の加算を含むベース）をlocalStorageに永続化 ----
  const [baseStock, setBaseStock] = useState<Inventory>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LS_BASE_STOCK);
        if (raw) return JSON.parse(raw) as Inventory;
      } catch {}
    }
    return { ...initialStock };
  });

  // 表示用在庫 = 基準在庫 - Cookie累計
  const [stock, setStock] = useState<Inventory>(() => {
    const counts = readCounts();
    return applyCountsToStock(baseStock, counts);
  });

  // 基準在庫を保存
  const saveBaseStock = useCallback((next: Inventory) => {
    try { localStorage.setItem(LS_BASE_STOCK, JSON.stringify(next)); } catch {}
  }, []);
  const saveParams = useCallback((next: { N:number; beta:number; Mcap:number }) => {
    try { localStorage.setItem(LS_PARAMS, JSON.stringify(next)); } catch {}
  }, []);
  const saveWeights = useCallback((w: Weights) => {
    try { localStorage.setItem(LS_WEIGHTS, JSON.stringify(w)); } catch {}
  }, []);

  // 表示用在庫を再計算（基準在庫とCookieから）
  const recomputeStock = useCallback(() => {
    const counts = readCounts();
    setStock(applyCountsToStock(baseStock, counts));
  }, [baseStock]);

  const totalStock = useMemo(() => Object.values(stock).reduce((s, v) => s + Math.max(0, v ?? 0), 0), [stock]);

  // ---- Draw API (wrap Lottery) ----
  const draw = useCallback(
    (visits: number) => {
      const lot = new Lottery({
        inventory: stock,
        weights,
        N,
        beta,
        Mcap,
        gainTargets,
        loseNames,
      });
      const { prize, remaining } = lot.draw(visits);
      // 既存仕様：Cookieに減算を積む（在庫表示は再計算で反映）
      if (prize in stock && (stock[prize] ?? 0) > (remaining[prize] ?? 0)) {
        incCount(prize, 1);
      }
      recomputeStock();
      return prize;
    },
    [stock, weights, N, beta, Mcap, gainTargets, loseNames, recomputeStock]
  );

  // ---- Reset / Sync helpers ----
  /** Cookieを初期化し、在庫を「初期在庫」に戻す */
  const resetStock = useCallback(() => {
    resetCounts();
    // 基準在庫も初期値に戻し、保存→再計算
    const next = { ...initialStock };
    setBaseStock(next);
    saveBaseStock(next);
    const counts = readCounts(); // 空
    setStock(applyCountsToStock(next, counts));
  }, [initialStock, saveBaseStock]);

  /**
   * Cookieの値を再読み込みして在庫へ反映（例：他タブで変更された場合の同期）
   * 画面リロードなしで、初期在庫 − Cookie累計 を適用したいときに使用
   */
  const syncFromCookie = useCallback(() => {
    recomputeStock();
  }, [recomputeStock]);

  // ---- Probability rows for display ----
  const getProbRows = useCallback(
    (visits: number) =>
      computeProbs({
        inventory: stock,
        weights,
        visits,
        N,
        beta,
        Mcap,
        gainTargets,
        loseNames,
      }),
    [stock, weights, N, beta, Mcap, gainTargets, loseNames]
  );

  // ---- Eligibility ----
  const canDraw = useCallback((visits: number) => visits >= N && totalStock > 0, [N, totalStock]);

  // ---- Admin helpers（追加在庫・パラメータ更新） ----
  /** 在庫を“加算”する（負数で減算も可能だが、最終的に0未満にはしない） */
  const addStock = useCallback((delta: Partial<Inventory>) => {
    // 基準在庫に加算 → 保存 → 表示在庫を再計算
    setBaseStock(prevBase => {
      const nextBase: Inventory = { ...prevBase };
      for (const k of Object.keys(delta)) {
        const add = Math.floor(delta[k as keyof Inventory] ?? 0);
        const cur = Math.max(0, prevBase[k] ?? 0);
        nextBase[k] = Math.max(0, cur + add);
      }
      saveBaseStock(nextBase);
      // ここで即再計算（最新基準在庫が依存になるためset後に別途recomputeでもOK）
      const counts = readCounts();
      setStock(applyCountsToStock(nextBase, counts));
      return nextBase;
    });
  }, [saveBaseStock]);

  /** N / beta / Mcap をまとめて更新 */
  const updateParams = useCallback((p: { N?: number; beta?: number; Mcap?: number }) => {
    const next = {
      N:   typeof p.N    === "number" ? p.N    : N,
      beta:typeof p.beta === "number" ? p.beta : beta,
      Mcap:typeof p.Mcap === "number" ? p.Mcap : Mcap,
    };
    setN(next.N); setBeta(next.beta); setMcap(next.Mcap);
    saveParams(next);
  }, [N, beta, Mcap, saveParams]);

  /** 重みをまとめて更新 */
  const updateWeights = useCallback((w: Weights) => {
    const next = { ...w };
    setWeights(next);
    saveWeights(next);
  }, [saveWeights]);

  /** 当たり側/はずれ側のラベル集合を更新（カンマ区切りUIから反映想定） */
  const updateTargets = useCallback((gains: string[], loses: string[]) => {
    setGainTargets(gains);
    setLoseNames(loses);
  }, []);

  return {
    // Config
    N, beta, Mcap,
    gainTargets, loseNames,
    weights,
    // 管理用 setter
    setN, setBeta, setMcap,
    setGainTargets, setLoseNames,
    setWeights,
    updateParams, updateWeights, updateTargets,
    // Inventory
    stock,
    baseStock,
    setStock,
    totalStock,
    addStock,
    // API
    draw,
    getProbRows,
    canDraw,
    resetStock,
    syncFromCookie,
  };
}

export type UseLotteryReturn = ReturnType<typeof useLottery>;
