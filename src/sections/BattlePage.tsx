import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getCharacterGrowthImage } from "@/assets/characters"
import { buildBattleRounds, getBattleResult, type GorillaBattleRound } from "@/utils/gorillaBattle"
import type { GorillaBattleRecord } from "@/utils/firestoreSync"

interface BattlePageProps {
  battle: GorillaBattleRecord
  currentUid: string
  onComplete: (result: "challenger" | "opponent" | "draw") => Promise<void>
  onClose: () => void
}

export default function BattlePage({ battle, currentUid, onComplete, onClose }: BattlePageProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const rounds = useMemo(
    () => buildBattleRounds(battle.challengerStats, battle.opponentStats),
    [battle.challengerStats, battle.opponentStats],
  )
  const result = useMemo(() => getBattleResult(battle.challengerStats, battle.opponentStats), [battle.challengerStats, battle.opponentStats])
  const winnerUid = result === "challenger" ? battle.challenger : result === "opponent" ? battle.opponent : null
  const isCurrentUserWinner = winnerUid === currentUid

  useEffect(() => {
    if (revealedCount >= rounds.length) {
      return
    }

    const timer = window.setTimeout(() => setRevealedCount((current) => current + 1), 900)
    return () => window.clearTimeout(timer)
  }, [revealedCount, rounds.length])

  useEffect(() => {
    if (revealedCount < rounds.length || battle.status === "completed") {
      return
    }

    const timer = window.setTimeout(() => {
      setIsCompleting(true)
      void onComplete(result).finally(() => setIsCompleting(false))
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [battle.status, onComplete, result, revealedCount, rounds.length])

  const challengerName = battle.challengerProfile?.displayName ?? "CHALLENGER"
  const opponentName = battle.opponentProfile?.displayName ?? "OPPONENT"

  return (
    <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white">
      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[#888] text-sm">GORILLA BATTLE</div>
            <h1 className="mt-2 text-white font-bold text-lg">ゴリラ対決</h1>
            <p className="mt-2 text-[#ccc]">ステータス比較で勝敗が決まる自動バトルです。</p>
          </div>
          <button type="button" onClick={onClose} className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2">
            閉じる
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <GorillaCard name={challengerName} level={battle.challengerProfile?.level ?? 1} isWinner={winnerUid === battle.challenger} />
          <GorillaCard name={opponentName} level={battle.opponentProfile?.level ?? 1} isWinner={winnerUid === battle.opponent} />
        </div>

        <div className="mt-6 space-y-3">
          {rounds.slice(0, revealedCount).map((round, index) => (
            <BattleRoundCard key={`${round.key}-${index}`} round={round} />
          ))}
        </div>

        {revealedCount >= rounds.length ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-[26px] border border-[#F5A623]/30 bg-black/30 p-5 text-center"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">FINAL RESULT</div>
            <div className="mt-3 text-3xl font-black text-[#F5A623]">
              {result === "draw" ? "引き分け！" : isCurrentUserWinner ? "勝利！" : "敗北…"}
            </div>
            <p className="mt-3 text-sm text-white/75">
              {result === "draw"
                ? "互角の激闘！次の鍛錬で決着をつけよう。"
                : isCurrentUserWinner
                  ? "勝者のゴリラが黄金のオーラで咆哮！ +150XP を獲得。"
                  : "敗者のゴリラ『次は負けない…』 +50XP の参加報酬を獲得。"}
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm font-bold">
              <span>総合力 {battle.challengerStats.total}</span>
              <span className="text-[#F5A623]">VS</span>
              <span>総合力 {battle.opponentStats.total}</span>
            </div>
            {isCompleting ? <div className="mt-3 text-xs text-[#FFE7B0]">結果を保存中...</div> : null}
          </motion.div>
        ) : null}
      </section>
    </div>
  )
}

function GorillaCard({ name, level, isWinner }: { name: string; level: number; isWinner: boolean }) {
  return (
    <motion.div
      animate={isWinner ? { y: [0, -6, 0], scale: [1, 1.03, 1] } : { x: [0, 2, 0] }}
      transition={{ repeat: Infinity, duration: 1.8 }}
      className={`rounded-[26px] border p-4 text-center ${isWinner ? "border-[#F5A623] bg-[#F5A623]/12 shadow-[0_0_36px_rgba(245,166,35,0.28)]" : "border-white/10 bg-white/[0.04]"}`}
    >
      <img
        src={getCharacterGrowthImage("gorilla", Math.min(20, Math.max(1, level)))}
        alt={`${name}のゴリラ`}
        className="mx-auto h-28 w-28 rounded-3xl border border-[#F5A623]/25 bg-black/30 object-cover"
      />
      <div className="mt-3 text-lg font-black">{name}</div>
      <div className="mt-1 text-sm text-[#FFE7B0]">Lv.{level}</div>
      <div className="mt-2 text-xs font-bold text-white/70">{isWinner ? "勝利ポーズ！" : "次は負けない…"}</div>
    </motion.div>
  )
}

function BattleRoundCard({ round }: { round: GorillaBattleRound }) {
  const verdict = round.winner === "draw" ? "引き分け！" : round.winner === "challenger" ? "左の勝ち！" : "右の勝ち！"

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border border-[#F5A623]/20 bg-white/[0.04] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[#FFE7B0]">{round.label}</div>
          <div className="mt-1 text-xl font-black">{round.challengerValue} vs {round.opponentValue}</div>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-black ${round.winner === "draw" ? "bg-white/10 text-white" : "bg-[#F5A623] text-[#0a0a0a]"}`}>
          {verdict}
        </div>
      </div>
    </motion.article>
  )
}