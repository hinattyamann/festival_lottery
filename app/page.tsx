//useLotteryというカスタムフックを作る(Lotteryクラスをラップ)
//設定変数を分かりやすく記述
//モックでサーバーにユーザIDを送り、来場数を受け取るという流れがなくとも成り立つようにする

"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useLottery } from "@/lib/useLottery";
import type { UserId } from "@/types/common";
import { getUser, getUserHistory } from "@/services/user_service";
import { postEntryAttractionVisit } from "@/services/entry_services";
import { computeVisitsFromHistory } from "@/lib/visitCounter";


export default function UserIDInputPage() {
  // 画面状態
  type View = "WAITING" | "DRAWING" | "RESULT" | "ADMIN";
  const [view, setView] = useState<View>("WAITING");

  // SSRとCSRのズレ防止
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // ユーザー状態 (QRコードの代替案)
  const [userID, setUserID] = useState<UserId | "">("");
  const [visits, setVisits] = useState<number>(0);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [lastPrize, setLastPrize] = useState<string>("");
  const [animPrize, setAnimPrize] = useState<string>("");
  const [lastScan, setLastScan] = useState<string>("");
  const [camError, setCamError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualVisits, setManualVisits] = useState<number | "">("");
  const {
    // 抽選API/表示
    N, beta, Mcap, gainTargets, loseNames, weights,
    paramsDefaults, weightsDefaults,
    totalStock, stock,
    draw: drawOnce, getProbRows, canDraw, resetStock,
    // 管理API
    addStock, updateParams, updateWeights, updateTargets,
  } = useLottery();

  // 管理UIの入力一時状態（独立VIEWで使用）
  const [addForm, setAddForm] = useState<Record<string, number>>({});
  const [paramForm, setParamForm] = useState<{N:number; beta:number; Mcap:number}>({ N, beta, Mcap });
  const [weightForm, setWeightForm] = useState<Record<string, number>>({ ...weights });

  // 現在の反映済み値をフォームに同期（未保存の編集は破棄）
  const syncFormsFromCurrent = useCallback(() => {
    setParamForm({ N, beta, Mcap });
    setWeightForm({ ...weights });
  }, [N, beta, Mcap, weights]);

  // 抽選演出時間(ms)
  const DRAW_DURATION = 2800;

  
  // 表示・抽選に使う来場回数（手入力中はそれを採用）
  const visitsUsed = useMemo(
    () => (manualMode ? Number(manualVisits || 0) : visits),
    [manualMode, manualVisits, visits]
  );
  const canDrawNow = useMemo(
    () =>
      view !== "DRAWING" &&
      !loadingVisits &&
      // 手入力時は userID なしでもOK / QR時は userID 必須
      (manualMode || !!userID) &&
      canDraw(visitsUsed),
    [view, loadingVisits, manualMode, userID, canDraw, visitsUsed]
  );
  // 確率表も抽選も「visitsUsed」をそのまま利用（=手入力でもブースト適用）
  const probRows = useMemo(() => getProbRows(visitsUsed), [getProbRows, visitsUsed]);

  // 抽選器は都度在庫を受け取り、抽選後の在庫で state を更新
  const handleDraw = async () => {
    if (!canDrawNow) return;
    setView("DRAWING");
    const prize = drawOnce(visitsUsed);
    setAnimPrize(prize);
    // 抽選を来訪履歴に記録（次回は lottery 以降でカウント）
    try {
      if (userID && !manualMode) {
        await postEntryAttractionVisit(userID as UserId, "prize", "prize_system");
      }
    } catch (e) {
      console.warn("postEntryAttractionVisit failed:", e);
    }
    // 演出終了後に結果表示
    window.setTimeout(() => {
      setLastPrize(prize);
      setView("RESULT");
    }, DRAW_DURATION);
  };

  const resetForNext = () => {
    setView("WAITING");
    setUserID("");
    setLastScan("");
    setCamError(null);
    setVisits(0);
    setFetchErr(null);
    setLoadingVisits(false);
    setManualMode(false);
    setManualVisits("");
  }

  // QR scan handlers
  const handleScan = useCallback((codes: any) => {
    if (!codes || codes.length === 0) return;
    const raw: string = codes[0]?.rawValue ?? "";
    if (!raw || raw === lastScan) return;
    setLastScan(raw);
    try {
      const parsed = JSON.parse(raw);
      console.log("[QR JSON]", parsed);
      if (typeof parsed.userID === "string") setUserID(parsed.userID as UserId);
      if (typeof parsed.userId === "string") setUserID(parsed.userId as UserId);
      if (typeof parsed.id === "string") setUserID(parsed.id as UserId);
    } catch {
      const uid = raw.trim();
      if (uid) setUserID(uid as UserId);
    }
  }, [lastScan]);

  const handleScannerError = useCallback((err: unknown) => {
    setCamError((err as Error)?.message ?? "カメラの起動に失敗しました")
  }, []);

  // userID を取得したら履歴→入場数を計算
  useEffect(() => {
    const run = async () => {
      if (manualMode) return;
      if (!userID) return;
      setLoadingVisits(true);
      setFetchErr(null);
      try {
        // const res = {
        //   userId: "aodj-2nr8",
        //   history: [
        //     {
        //       attraction: "mbti",
        //       personality: "1",
        //       staff: "スタッフA",
        //       visitedAt: "2023-01-01T00:00:00Z",
        //     },
        //     {
        //       attraction: "battle",
        //       personality: "1",
        //       staff: "スタッフB",
        //       visitedAt: "2023-01-02T00:00:00Z",
        //     },
        //     {
        //       attraction: "prize",
        //       personality: "13",
        //       staff: "スタッフC",
        //       visitedAt: "2023-01-03T00:00:00Z",
        //     },
        //     {
        //       attraction: "picture",
        //       personality: "7",
        //       staff: "スタッフD",
        //       visitedAt: "2023-01-04T00:00:00Z",
        //     },
        //     {
        //       attraction: "game",
        //       personality: "13",
        //       staff: "スタッフE",
        //       visitedAt: "2023-01-05T00:00:00Z",
        //     },
        //     {
        //       attraction: "games",
        //       personality: "13",
        //       staff: "スタッフF",
        //       visitedAt: "2023-01-06T00:00:00Z",
        //     },
        //   ],
        // };
        // const n = computeVisitsFromHistory(res.history);

        const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
        let res: any;
        if (USE_MOCKS) {
          res = {
              userId: "aodj-2nr8",
              history: [
                {
                  attraction: "mbti",
                  personality: "1",
                  staff: "スタッフA",
                  visitedAt: "2023-01-01T00:00:00Z",
                },
                {
                  attraction: "battle",
                  personality: "1",
                  staff: "スタッフB",
                  visitedAt: "2023-01-02T00:00:00Z",
                },
                {
                  attraction: "prize",
                  personality: "13",
                  staff: "スタッフC",
                  visitedAt: "2023-01-03T00:00:00Z",
                },
                {
                  attraction: "picture",
                  personality: "7",
                  staff: "スタッフD",
                  visitedAt: "2023-01-04T00:00:00Z",
                },
                {
                  attraction: "game",
                  personality: "13",
                  staff: "スタッフE",
                  visitedAt: "2023-01-05T00:00:00Z",
                },
                {
                  attraction: "games",
                  personality: "13",
                  staff: "スタッフF",
                  visitedAt: "2023-01-06T00:00:00Z",
                },
              ],
            };
        } else {
          //本番API
          res = await getUserHistory(userID);
        }
        const n = computeVisitsFromHistory(res.history ?? []);
        setVisits(n);
      } catch (e: any) {
        setFetchErr(e?.message ?? "来場履歴の取得に失敗しました");
        setVisits(0);
      } finally {
        setLoadingVisits(false);
      }
    };
    run();
  }, [userID, manualMode]);

  // 結果表示時の紙吹雪（当たりランクに応じて強弱）
  useEffect(() => {
    if (view !== "RESULT" || !lastPrize) return;
    const power =
      lastPrize === "大当たり" ? 0.9 :
      lastPrize === "中当たり" ? 0.65 :
      lastPrize === "小当たり" ? 0.4 : 0;
    if (power > 0) {
      confetti({
        particleCount: Math.floor(220 * power),
        spread: 70,
        startVelocity: 45,
        gravity: 0.8,
        scalar: 0.9 + power * 0.2,
        origin: { y: 0.2 },
      });
    }
  }, [view, lastPrize]);

  // ランク別テーマ色（カプセル上フタ・光）
  const getTheme = (prize: string) => {
    if (prize === "大当たり") {
      return { top:"#D4AF37", topBorder:"#B08D2E", glow:"#ffdd55", ray:"#ffe066" }; // 金
    } else if (prize === "中当たり") {
      return { top:"#ef4444", topBorder:"#b91c1c", glow:"#ff6b6b", ray:"#ff9f9f" }; // 赤
    } else if (prize === "小当たり") {
      return { top:"#3b82f6", topBorder:"#1d4ed8", glow:"#7aa7ff", ray:"#b9d0ff" }; // 青
    } else {
      return { top:"#9ca3af", topBorder:"#6b7280", glow:"#e5e7eb", ray:"#e5e7eb" }; // 灰
    }
  };

  // ---- ガチャ演出（framer-motion） ----
  const GachaAnimation = ({ prize }: { prize: string }) => {
    const theme = getTheme(prize);
    // アニメ時間と分離タイミング（比率ではなくmsで制御）
  const DURATION_MS = 1600;
  const SPLIT_MS = Math.round(DURATION_MS * 0.55); // 0.55 の瞬間
  const [showDummyTop, setShowDummyTop] = useState(true);
  const [showFlyingLid, setShowFlyingLid] = useState(true);
  useEffect(() => {
    // 0.55 の瞬間に“元のフタ（ダミー上半球）”を消す
    const t1 = setTimeout(() => setShowDummyTop(false), SPLIT_MS);
    // 飛ぶフタは最後に消す（必要なら適宜）
    const t2 = setTimeout(() => setShowFlyingLid(false), DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
    return (
    <div className="relative w-full h-64 rounded-xl border-2 border-amber-300 bg-linear-to-b from-amber-50 to-amber-100 overflow-hidden flex items-center justify-center shadow-inner">
      {/* 本体：筐体 */}
      <motion.div
        className="absolute top-6 w-44 h-56 rounded-xl border-4 border-amber-500 bg-amber-100 shadow-lg"
        initial={{ y: -4, scale: 1 }}
        animate={{ y: [-10, 10, -10], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute left-2 right-2 top-2 h-28 rounded-md border border-amber-300"
             style={{
               background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.7), rgba(253,230,138,.5) 60%, rgba(245,158,11,.25) 100%)"
             }} />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-28 h-3 rounded-full bg-gray-800" />
      </motion.div>

      {/* カプセル：落下→着地で弾む→フタが勢いよく開く→光が差す */}
      <div className="absolute">
        <AnimatePresence>
          <motion.div
            key="capsule"
            initial={{ y: -220, rotate: -12, scale: 0.94 }}
            animate={{ y: [ -220, 96, 80, 88 ], rotate: [ -12, 0, 0, -3 ], scale: [0.94, 1, 1.06, 1] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-16 h-16"
          >
            {/* 1) 閉じた状態のダミーシェル（開始〜0.55sまで表示） */}
            <motion.div
              className="absolute inset-0 z-[3] pointer-events-none"
              initial={{ opacity: 1, scale: 1 }}
              animate={{ scale: [1, 1.02] }}  // ← ここではもう不透明度をいじらない
              transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.55] }}
            >
              {/* 上半球（フタ色）— 0.55 で DOM から外す */}
              {showDummyTop && (
                <div
                  className="absolute left-0 right-0 top-0 h-1/2 rounded-t-full shadow-inner"
                  style={{ background: theme.top, borderColor: theme.topBorder, borderWidth: 2, borderStyle: "solid" }}
                />
              )}
              {/* 下半球（本体） */}
              <div
                className="absolute left-0 right-0 bottom-0 h-1/2 rounded-b-full border-2 border-slate-400 bg-gray-100 shadow-inner"
              />
              {/* 口のリム */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -mt-px w-12 h-1 rounded-full bg-gray-300/70" />
            </motion.div>

            {/* 2) 下ボディ：分離の直後（0.56s〜）でフェードインして残る */}
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full border-2 border-slate-400 bg-gray-100 shadow-inner z-[1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 0.2, times: [0, 0.55, 0.56] }}
            >
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-12 h-1 rounded-full bg-gray-300/70" />
            </motion.div>

              {/* 3) 上フタ：0.55sで分離→左上45°へ“ぽーん”と飛ぶ（飛行中は見せる） */}
              {showFlyingLid && (
              <motion.div
              className="absolute left-0 right-0 top-0 h-1/2 rounded-t-full shadow-inner pointer-events-none"
              style={{
                background: theme.top,
                borderColor: theme.topBorder,
                borderWidth: 2,
                zIndex: 4,
                willChange: "transform, opacity"
              }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: [0, 0, -84, -120],
                  y: [0, -4, -84, -130],
                  rotate: [0, -8, -30, -45],
                  scale: [1, 1, 0.98, 0.96],
                  // 0.55 で飛び始めるが、飛行中は見せ続ける。最後だけ少し落とす
                  opacity: [1, 1, 1, 0.2]
                }}
                transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.55, 0.85, 1] }}
              />
              )}

            {/* 4) 光バースト：フタが飛び始めた直後に一気に噴き出す */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-1 w-12 h-12 rounded-full blur-md pointer-events-none"
              style={{ background: `radial-gradient(circle, ${theme.glow}, transparent 60%)`, filter: "brightness(1.35)", zIndex: 5  }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0, 1, 1], scale: [0.6, 0.6, 1.5, 1.2] }}
              transition={{ duration: 1.0, ease: "easeOut", times: [0, 0.55, 0.72, 1] }}
            />
            {/* 放射レイ */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-32 pointer-events-none"
              style={{
                background: `conic-gradient(from 180deg, ${theme.ray}dd, transparent 20%, ${theme.ray}88, transparent 45%, ${theme.ray}dd, transparent 70%)`,
                maskImage: "radial-gradient(closest-side, black, transparent)",
                WebkitMaskImage: "radial-gradient(closest-side, black, transparent)",
                filter: "blur(2px)",
                zIndex: 5
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0, 1, 0.95], scale: [0.8, 0.8, 1.25, 1.1] }}
              transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.56, 0.78, 1] }}
            />
            {/* 衝撃波リング */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-2 rounded-full pointer-events-none"
              style={{ width: 10, height: 10, border: `2px solid ${theme.ray}`, zIndex: 5  }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0, 0.9, 0], scale: [0.4, 0.7, 1.8, 2.2] }}
              transition={{ duration: 0.9, ease: "easeOut", times: [0, 0.58, 0.8, 1] }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    );
  };

  return (
 <main className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center
   p-6 pt-40 md:pt-20 bg-gradient-to-br from-rose-50 via-amber-50 to-indigo-50">
  {/* 紙フラッグ + バルーンガーランド（ADMIN のときは非表示） */}
  {view === "WAITING" && (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 z-20">
      <PaperGarland />
    </div>
  )}

   {/* 紙吹雪（丸紙＆三角フラッグ） */}
   <div aria-hidden className="pointer-events-none absolute inset-0">
     {Array.from({ length: 28 }).map((_, i) => (
       <span
         key={i}
         className={ (i % 3 === 0) ? "paper-tri" : "paper-dot" }
         style={{
           left: `${(i * 37) % 100}%`,
           animationDelay: `${(i % 7) * 0.6}s`,
           animationDuration: `${8 + (i % 5)}s`,
           top: `${(i * 13) % 100}%`,
         }}
       />
     ))}
   </div>
      {/* ====== ADMIN VIEW：QR画面を完全アンマウント（実質遷移） ====== */}
      {view === "ADMIN" ? (
        <div className="relative bg-white p-6 rounded-xl shadow-md w-full max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">管理者画面</h2>
            <button
              type="button"
              className="px-3 py-1 rounded border"
              onClick={() => { syncFormsFromCurrent(); setView("WAITING"); }}
            >
              抽選待機に戻る
            </button>
          </div>

          {/* 在庫の“加算” */}
          <div className="p-3 space-y-4 text-sm rounded-lg border bg-gray-50/60">
            <div className="space-y-2">
              <div className="font-medium">在庫を追加（現在値に加算）</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(stock).map((name) => (
                  <label key={name} className="flex items-center gap-2">
                    <span className="w-16">{name}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-full rounded border px-2 py-1"
                      placeholder="+0"
                      value={addForm[name] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? NaN : Number(e.target.value);
                        setAddForm((f) => ({ ...f, [name]: isNaN(v) ? undefined as any : v }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-emerald-600 text-white"
                  onClick={() => {
                    const delta: Record<string, number> = {};
                    for (const k of Object.keys(addForm)) {
                      const v = Number(addForm[k]);
                      if (!Number.isFinite(v) || v === 0) continue;
                      delta[k] = v;
                    }
                    if (Object.keys(delta).length > 0) addStock(delta);
                    setAddForm({});
                  }}
                >在庫を加算</button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border"
                  onClick={() => setAddForm({})}
                >入力クリア</button>
              </div>
            </div>

            {/* パラメータ N / β / Mcap */}
            <div className="space-y-2">
              <div className="font-medium">確率上昇パラメータ</div>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col">
                  <span className="text-xs">N（権利付与回数）</span>
                  <input type="number" className="rounded border px-2 py-1"
                    value={paramForm.N}
                    onChange={(e)=>setParamForm(p=>({...p, N:Number(e.target.value)}))}/>
                </label>
                <label className="flex flex-col">
                  <span className="text-xs">β（上昇率）</span>
                  <input type="number" step="0.01" className="rounded border px-2 py-1"
                    value={paramForm.beta}
                    onChange={(e)=>setParamForm(p=>({...p, beta:Number(e.target.value)}))}/>
                </label>
                <label className="flex flex-col">
                  <span className="text-xs">Mcap（上限）</span>
                  <input type="number" step="0.1" className="rounded border px-2 py-1"
                    value={paramForm.Mcap}
                    onChange={(e)=>setParamForm(p=>({...p, Mcap:Number(e.target.value)}))}/>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                  onClick={()=>updateParams(paramForm)}
                >パラメータを反映</button>
                <button type="button" className="px-3 py-1 rounded border"
                  onClick={()=>setParamForm({ N, beta, Mcap })}
                >現在値で戻す</button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border"
                  onClick={() => setParamForm({ ...paramsDefaults })}
                >初期値に戻す</button>
              </div>
            </div>

            {/* 重み編集 */}
            <div className="space-y-2">
              <div className="font-medium">重み（在庫×重みが基礎確率）</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(stock).map((name) => (
                  <label key={name} className="flex items-center gap-2">
                    <span className="w-16">{name}</span>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full rounded border px-2 py-1"
                      value={weightForm[name] ?? 0}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setWeightForm((w) => ({ ...w, [name]: Number.isFinite(v) ? v : 0 }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                  onClick={()=>updateWeights(weightForm as any)}
                >重みを反映</button>
                <button type="button" className="px-3 py-1 rounded border"
                  onClick={()=>setWeightForm({ ...weights })}
                >現在値で戻す</button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border"
                  onClick={() => setWeightForm({ ...weightsDefaults })}
                >初期値に戻す</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ====== 非ADMIN VIEW：従来UI（WAITING/DRAWING/RESULT） ====== */
        <div className="relative z-10 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-3xl transition-all duration-300">
        {/* 右上：歯車（WAITING＝QRページのときだけ表示） */}
        {view === "WAITING" && (
          <button
            type="button"
            aria-label="管理メニュー"
            onClick={() => { syncFormsFromCurrent(); setView("ADMIN"); }}
            className="absolute right-3 top-3 inline-flex items-center justify-center w-9 h-9 rounded-full border bg-gray-50 hover:bg-gray-100"
            title="在庫追加・パラメータ編集"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-gray-700">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.59-.92 3.416.905 2.495 2.496a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.065 2.573c.92 1.59-.905 3.416-2.496 2.495a1.724 1.724 0 0 0-2.572 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.59.92-3.416-.905-2.495-2.496a1.724 1.724 0 0 0-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.92-1.59.905-3.416 2.496-2.495.98.567 2.225.163 2.573-1.066Z" />
              <circle cx="12" cy="12" r="3.25" strokeWidth="1.8"/>
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold mb-4 text-center">抽選イベント</h1>

        {view === "WAITING" && (
          <div className="mb-4 text-sm text-gray-700 space-y-1">
            <div><span className="font-semibold">User ID:</span> {userID || "—"}</div>
            <div>
              <span className="font-semibold">来場回数:</span>{" "}
              {manualMode ? (manualVisits === "" ? 0 : Number(manualVisits)) : (loadingVisits ? "取得中…" : visits)}
            </div>
            {fetchErr && <p className="text-xs text-red-600">{fetchErr}</p>}
            {/* {!userID && (
              <p className="text-xs text-gray-500">
                QRを読み取ると userId を取得し、履歴から入場数を自動集計します（抽選参加 <code>lottery</code> 後はリセット）。
              </p>
            )} */}
          </div>
        )}

        {view === "WAITING" && (
          <>
            <div className="mb-2 text-sm font-semibold">現在の確率と在庫</div>
            {/* 確率表 + カメラプレビュー（モバイル縦/PC横） */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 items-start">
              <table className="w-full md:flex-1 border text-base rounded-md overflow-hidden text-center">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-center">賞</th>
                    <th className="p-3 text-center">在庫</th>
                    <th className="p-3 text-center">確率</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 水和完了後にだけ在庫・確率を描画（ズレ防止） */}
                  {hydrated ? (
                    probRows.map((r) => (
                      <tr
                        key={r.prize}
                        className={`${
                          r.stock <= 0 ? "opacity-50" : ""
                        } odd:bg-white even:bg-gray-50`}
                      >
                        <td className="p-3 font-medium">{r.prize}</td>
                        <td className="p-3" suppressHydrationWarning>
                          {r.stock > 0 ? (
                            <span
                              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-sm
                                         border-emerald-200 bg-emerald-50 text-emerald-800"
                            >
                              {r.stock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-sm
                                            border-gray-200 bg-gray-50 text-gray-500">
                              在庫切れ
                            </span>
                          )}
                        </td>
                        <td className="p-3" suppressHydrationWarning>
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm tabular-nums">{r.prob.toFixed(1)}%</div>
                            <div className="relative w-28 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-amber-400"
                                style={{ width: `${Math.max(0, Math.min(100, r.prob))}%` }}
                                aria-hidden
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2 text-center text-gray-400" colSpan={3}>
                        読み込み中...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="w-full md:flex-1">
                <div className="text-sm font-medium mb-1">QRスキャン / 手入力</div>
                {!manualMode ? (
                  <>
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-300/80 scale-x-[-1]">
                      <Scanner
                        onScan={handleScan}
                        onError={handleScannerError}
                        constraints={{ facingMode: { ideal: "environment" } }}
                        components={{ finder: true }}
                        classNames={{ container: "w-full h-full", video: "w-full h-full object-cover" }}
                      />
                    </div>
                    {camError ? (
                      <p className="mt-2 text-xs text-red-600">{camError}</p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500 break-all">
                        最終検出: {lastScan ? <code>{lastScan}</code> : "—"}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border p-3 bg-gray-50/60">
                    <div className="text-sm mb-2 font-medium">手入力（QRなし来場）</div>
                    <label className="flex flex-col">
                      <span className="text-xs text-gray-600">来場回数</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="rounded border px-2 py-1"
                        value={manualVisits}
                        onChange={(e)=>setManualVisits(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </label>
                    <p className="mt-2 text-[11px] text-gray-500">
                      ※ 手入力中はサーバから履歴を取得しません。入力した来場回数に応じてブーストが適用されます。
                    </p>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={manualMode}
                      onChange={(e)=>setManualMode(e.target.checked)}
                    />
                    手入力モードにする
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDraw}
              disabled={!canDrawNow}
              className={`w-full font-medium py-2 rounded-md ${
                !canDrawNow
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {totalStock <= 0
                ? "在庫がありません"
                : manualMode
                ? (visitsUsed < N ? `抽選はできません（あと ${N - visitsUsed} 回）` : "抽選する")
                : !userID
                ? "QRを読み取ってください"
                : loadingVisits
                ? "来場回数を取得中…"
                : visitsUsed < N
                ? `抽選はできません（あと ${N - visitsUsed} 回）`
                : "抽選する"}
            </button>

            {/* 管理用：在庫・抽選履歴（Cookie）をリセット */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm("抽選履歴（Cookie）を削除し、在庫を初期値に戻します。よろしいですか？")) {
                    resetStock();
                  }
                }}
                className="w-full font-medium py-2 rounded-md border
                           border-amber-200/70 bg-amber-50 hover:bg-amber-100 active:bg-amber-200
                           text-amber-900 shadow-sm transition"
                title="Cookieの drawCounts を削除して在庫を初期化します"
              >
                在庫・抽選履歴をリセット
              </button>
            </div>
            {(manualMode ? (visitsUsed < N) : (userID && !loadingVisits && visitsUsed < N)) && (
              <p className="mt-2 text-xs text-red-600 text-center">
                ※ 抽選は体験回数が{N}回以上で可能です。
              </p>
            )}
            {totalStock <= 0 && (
              <p className="mt-2 text-xs text-red-600 text-center">
                ※ すべてのすべての景品が在庫切れです。抽選はできません。はできません。
              </p>
            )}
          </>
        )}

        {view === "DRAWING" && (
          <div className="space-y-3">
            <GachaAnimation prize={animPrize} />
            <p className="text-center text-sm text-gray-600">抽選中…</p>
          </div>
        )}

        {view === "RESULT" && (
          <div className="space-y-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="p-4 rounded-md border text-center"
              style={{
                // ランク別のカード色（大=金, 中=赤, 小=青, ハズレ=灰）
                background:
                  lastPrize === "大当たり" ? "#fffbeb" :     // 金の淡色
                  lastPrize === "中当たり" ? "#fef2f2" :     // 赤の淡色
                  lastPrize === "小当たり" ? "#eff6ff" :     // 青の淡色
                  "#f9fafb",                                  // 灰
                borderColor:
                  lastPrize === "大当たり" ? "#f59e0b55" :
                  lastPrize === "中当たり" ? "#ef444455" :
                  lastPrize === "小当たり" ? "#3b82f655" :
                  "#e5e7eb",
                color:
                  lastPrize === "大当たり" ? "#92400e" :
                  lastPrize === "中当たり" ? "#7f1d1d" :
                  lastPrize === "小当たり" ? "#1e3a8a" :
                  "#111827",
              }}
            >
              抽選結果：<strong className="text-lg">{lastPrize}</strong>
            </motion.div>
            <div className="text-center">
              <button
                type="button"
                onClick={resetForNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md"
              >
                次の来場者へ
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </main>
  );
}

 function PaperGarland() {
   return (
     <svg width="100%" height="100%" viewBox="0 0 100 40"
          className="drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
       {/* 風船（左右1つずつ） */}
       <g transform="translate(12,6)">
         <g className="balloon-float">
           <ellipse cx="0" cy="16" rx="3.5" ry="4.8" fill="#FBCFE8"/>
           <path d="M0,21 L0,29" stroke="#9CA3AF" strokeWidth="0.3"/>
         </g>
       </g>
       <g transform="translate(88,7)">
         <g className="balloon-float-slow">
           <ellipse cx="0" cy="16" rx="3.5" ry="4.8" fill="#A5B4FC"/>
           <path d="M0,21 L0,29" stroke="#9CA3AF" strokeWidth="0.3"/>
         </g>
       </g>
     </svg>
   );
 }





















