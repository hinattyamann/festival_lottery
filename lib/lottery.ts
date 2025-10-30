// lib/lottery.ts
// Lottery core logic and probability utilities
"use client";

export type Inventory = Record<string, number>;
export type Weights = Record<string, number>;

// Probability row returned by computeProbs
export type ProbRow = { prize: string; stock: number; prob: number };

// Internal helpers
const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));
const nonNeg = (n: number | undefined) => Math.max(0, n ?? 0);
const totalStockOf = (inv: Inventory) => Object.values(inv).reduce((s, v) => s + nonNeg(v), 0);
const boostMultiplier = (visits: number, N: number, beta: number, Mcap: number) =>
  clamp(1, Mcap, 1 + beta * Math.max(0, visits - N));

type ComputeProbsParams = {
  inventory: Inventory;
  weights: Weights;
  visits: number;
  N: number;
  beta: number;
  Mcap: number;
  gainTargets: string[];
  loseNames: string[];
};

/**
 * Compute probability rows (%) from inventory and visit count.
 * - When inventory is empty, all probabilities are 0
 * - Only gainTargets are boosted by m(n)=clamp(1, Mcap, 1 + beta * max(0, n-N))
 * - If all boosted weights are 0, return 0% for all prizes (UI-friendly)
 */
export function computeProbs(p: ComputeProbsParams): ProbRow[] {
  const { inventory, weights, visits, N, beta, Mcap, gainTargets } = p;

  const totalStock = totalStockOf(inventory);
  if (totalStock <= 0) {
    return Object.keys(inventory).map(name => ({ prize: name, stock: nonNeg(inventory[name]), prob: 0 }));
  }

  const m = boostMultiplier(visits, N, beta, Mcap);

  const rows = Object.keys(inventory).map((name) => {
    const stock = nonNeg(inventory[name]);
    const w = nonNeg(weights[name]);
    const base = stock > 0 ? w * stock : 0;
    const boosted = gainTargets.includes(name) ? base * m : base; // no boost for lose names
    return { prize: name, stock, boosted };
  });

  const sum = rows.reduce((s, r) => s + r.boosted, 0);
  if (sum <= 0) {
    return rows.map(r => ({ prize: r.prize, stock: r.stock, prob: 0 }));
  }

  return rows.map(r => ({ prize: r.prize, stock: r.stock, prob: (r.boosted / sum) * 100 }));
}

// ====== Lottery class ======

type LotteryConfig = {
  inventory: Inventory;
  weights: Weights;
  N: number;
  beta: number;
  Mcap: number;
  gainTargets: string[];
  loseNames: string[];
};

export class Lottery {
  constructor(private cfg: LotteryConfig) {}

  /**
   * Execute draw and return { prize, remaining }.
   * - Only gainTargets are boosted; boost grows after N visits
   * - If all weights are 0, pick first prize with stock; otherwise return "はずれ"
   */
  draw(visits: number): { prize: string; remaining: Inventory } {
    const inv = { ...this.cfg.inventory };
    const wts = { ...this.cfg.weights };

    if (totalStockOf(inv) <= 0) {
      return { prize: "はずれ", remaining: inv };
    }

    const m = boostMultiplier(visits, this.cfg.N, this.cfg.beta, this.cfg.Mcap);

    const entries = Object.keys(inv).map((name) => {
      const stock = nonNeg(inv[name]);
      const base = stock > 0 ? nonNeg(wts[name]) * stock : 0;
      const weight = this.cfg.gainTargets.includes(name) ? base * m : base;
      return { prize: name, weight, stock };
    });

    const total = entries.reduce((s, r) => s + r.weight, 0);

    let chosen: string | undefined;
    if (total > 0) {
      const t = Math.random() * total;
      let acc = 0;
      for (const r of entries) {
        acc += r.weight;
        if (t < acc) { chosen = r.prize; break; }
      }
      if (!chosen) chosen = entries.at(-1)?.prize;
    } else {
      chosen = entries.find(e => e.stock > 0)?.prize ?? "はずれ";
    }

    if (chosen && inv[chosen] > 0) {
      inv[chosen] -= 1;
    }

    return { prize: chosen ?? "はずれ", remaining: inv };
  }
}
