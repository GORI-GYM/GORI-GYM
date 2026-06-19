import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import BattlePage from "@/sections/BattlePage"
import {
  completeGorillaBattle,
  createGorillaBattle,
  getFriends,
  getGorillaBattleHistory,
  getIncomingGorillaBattles,
  getUserTrainingEntries,
  respondToGorillaBattle,
  type GorillaBattleRecord,
  type PublicUserProfile,
  type UserProfile,
} from "@/utils/firestoreSync"
import { calculateGorillaBattleStats, getBattleResult } from "@/utils/gorillaBattle"

interface GorillaBattleSectionProps {
  profile: UserProfile
}

export default function GorillaBattleSection({ profile }: GorillaBattleSectionProps) {
  const { user, loading } = useAuth()
  const [friends, setFriends] = useState<PublicUserProfile[]>([])
  const [incomingBattles, setIncomingBattles] = useState<GorillaBattleRecord[]>([])
  const [history, setHistory] = useState<GorillaBattleRecord[]>([])
  const [activeBattle, setActiveBattle] = useState<GorillaBattleRecord | null>(null)
  const [message, setMessage] = useState("")
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [busyBattleId, setBusyBattleId] = useState<string | null>(null)

  const currentStreak = profile.currentStreak ?? 0

  const battleRecord = useMemo(() => {
    return history.reduce(
      (acc, battle) => {
        if (battle.status !== "completed") {
          return acc
        }

        const isChallenger = battle.challenger === user?.uid
        const didWin = battle.result === "draw" ? false : (battle.result === "challenger") === isChallenger

        if (battle.result === "draw") {
          acc.draws += 1
        } else if (didWin) {
          acc.wins += 1
        } else {
          acc.losses += 1
        }

        return acc
      },
      { wins: 0, losses: 0, draws: 0 },
    )
  }, [history, user?.uid])

  const loadData = async () => {
    if (!user) {
      return
    }

    const [friendProfiles, pendingBattles, battleHistory] = await Promise.all([
      getFriends(user.uid),
      getIncomingGorillaBattles(user.uid),
      getGorillaBattleHistory(user.uid),
    ])

    setFriends(friendProfiles)
    setIncomingBattles(pendingBattles)
    setHistory(battleHistory)
  }

  useEffect(() => {
    void loadData()
  }, [user])

  const handleChallenge = async (friend: PublicUserProfile) => {
    if (!user) {
      return
    }

    setBusyUid(friend.uid)
    setMessage("")

    try {
      const [myEntries, opponentEntries] = await Promise.all([
        getUserTrainingEntries(user.uid),
        getUserTrainingEntries(friend.uid),
      ])

      const challengerStats = calculateGorillaBattleStats(myEntries, currentStreak)
      const opponentStats = calculateGorillaBattleStats(opponentEntries, 0)

      await createGorillaBattle(user.uid, friend.uid, challengerStats, opponentStats)
      setMessage(`${friend.displayName} に対決を申し込みました。`)
      await loadData()
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "対決の申し込みに失敗しました。")
    } finally {
      setBusyUid(null)
    }
  }

  const handleRespond = async (battleId: string, action: "accepted" | "rejected") => {
    setBusyBattleId(battleId)
    setMessage("")

    try {
      const targetBattle = incomingBattles.find((battle) => battle.id === battleId) ?? null
      await respondToGorillaBattle(battleId, action)

      if (action === "accepted" && targetBattle) {
        setActiveBattle({ ...targetBattle, status: "accepted" })
      } else if (action === "rejected") {
        setMessage("対決を拒否しました。")
      }

      await loadData()
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "対決リクエストの処理に失敗しました。")
    } finally {
      setBusyBattleId(null)
    }
  }

  const handleCompleteBattle = async (result: "challenger" | "opponent" | "draw") => {
    if (!activeBattle || !user) {
      return
    }

    await completeGorillaBattle(activeBattle.id, result)

    const xpReward = result === "draw"
      ? 50
      : (result === "challenger" && activeBattle.challenger === user.uid) || (result === "opponent" && activeBattle.opponent === user.uid)
        ? 150
        : 50

    setMessage(`対決完了！ ${xpReward}XP を獲得しました。`)
    setActiveBattle(null)
    await loadData()
  }

  if (loading) {
    return <div className="bg-[#0a0a0a] px-4 py-8 text-center text-[#888] text-sm">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-8">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-center">
          <h1 className="text-white font-bold text-lg">ゴリラ対決</h1>
          <p className="mt-3 text-[#ccc]">ログインするとフレンドとの非同期PvP対決に参加できます。</p>
        </div>
      </div>
    )
  }

  if (activeBattle) {
    return (
      <BattlePage
        battle={activeBattle}
        currentUid={user.uid}
        onComplete={handleCompleteBattle}
        onClose={() => setActiveBattle(null)}
      />
    )
  }

  return (
    <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white space-y-6">
      <motion.section
        className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-[#888] text-sm">GORILLA BATTLE</div>
        <h1 className="mt-2 text-white font-bold text-lg">ゴリラ対決</h1>
        <p className="mt-2 text-[#ccc]">今月のトレーニング実績がゴリラの戦闘力に変換されます。</p>
        {message ? <p className="mt-3 text-[#ccc]">{message}</p> : null}
      </motion.section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="勝ち" value={battleRecord.wins} />
        <StatCard label="負け" value={battleRecord.losses} />
        <StatCard label="引き分け" value={battleRecord.draws} />
      </section>

      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">対決リクエスト</h2>
          <span className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">{incomingBattles.length}件</span>
        </div>
        <div className="mt-4 space-y-3">
          {incomingBattles.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">現在受信中の対決はありません。</div>
          ) : (
            incomingBattles.map((battle) => (
              <article key={battle.id} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-bold text-lg">{battle.challengerProfile?.displayName}</div>
                    <div className="mt-1 text-[#888] text-sm">総合力 {battle.challengerStats.total} で挑戦中</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyBattleId === battle.id}
                      onClick={() => void handleRespond(battle.id, "accepted")}
                      className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      受諾
                    </button>
                    <button
                      type="button"
                      disabled={busyBattleId === battle.id}
                      onClick={() => void handleRespond(battle.id, "rejected")}
                      className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <h2 className="text-white font-bold text-lg">フレンドに申し込む</h2>
        <div className="mt-4 space-y-3">
          {friends.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">フレンドがいません。先にフレンドを追加してください。</div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.uid}
                type="button"
                onClick={() => void handleChallenge(friend)}
                disabled={busyUid === friend.uid}
                className="flex w-full items-center justify-between bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-left transition disabled:opacity-60"
              >
                <div>
                  <div className="text-white font-bold text-lg">{friend.displayName}</div>
                  <div className="mt-1 text-[#888] text-sm">Lv.{friend.level} / 総XP {friend.xp.toLocaleString()}</div>
                </div>
                <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">対決を申し込む</div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <h2 className="text-white font-bold text-lg">対戦履歴</h2>
        <div className="mt-4 space-y-3">
          {history.filter((battle) => battle.status === "completed").length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">まだ対戦履歴がありません。</div>
          ) : (
            history
              .filter((battle) => battle.status === "completed")
              .map((battle) => {
                const isChallenger = battle.challenger === user.uid
                const opponentName = isChallenger ? battle.opponentProfile?.displayName : battle.challengerProfile?.displayName
                const result = getBattleResult(battle.challengerStats, battle.opponentStats)
                const outcome = result === "draw" ? "引き分け" : (result === "challenger") === isChallenger ? "勝ち" : "負け"

                return (
                  <article key={battle.id} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-bold text-lg">{opponentName} との対決</div>
                        <div className="mt-1 text-[#888] text-sm">総合力 {battle.challengerStats.total} vs {battle.opponentStats.total}</div>
                      </div>
                      <div className={`rounded-lg px-4 py-2 text-sm ${outcome === "勝ち" ? "bg-[#F5A623] text-black font-bold" : outcome === "負け" ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]" : "bg-[#F5A623] text-black font-bold"}`}>
                        {outcome}
                      </div>
                    </div>
                  </article>
                )
              })
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-center">
      <div className="text-[#888] text-sm">{label}</div>
      <div className="mt-2 text-white font-bold text-lg">{value}</div>
    </div>
  )
}