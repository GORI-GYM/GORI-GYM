import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { getMonthlyRanking, type RankingEntry } from "@/utils/firestoreSync"
import { IconCrown, IconMedal, IconTrophy, IconUsers } from "@/icons"

type RankingMetric = "volume" | "frequency"
type RankingScope = "overall" | "friends"

interface RankingPageProps {
  socialBadgeCount?: number
}

function formatMetric(entry: RankingEntry, metric: RankingMetric) {
  return metric === "volume"
    ? `${entry.totalVolume.toLocaleString()} kg`
    : `${entry.trainingDays}日`
}

function getTopIcon(rank: number) {
  if (rank === 1) {
    return <IconCrown className="h-5 w-5 text-[#F5A623]" />
  }

  if (rank <= 3) {
    return <IconMedal className={`h-5 w-5 ${rank === 2 ? "text-slate-300" : "text-amber-700"}`} />
  }

  return null
}

export default function RankingPage({ socialBadgeCount = 0 }: RankingPageProps) {
  const { user, loading } = useAuth()
  const [metric, setMetric] = useState<RankingMetric>("volume")
  const [scope, setScope] = useState<RankingScope>("overall")
  const [overallVolume, setOverallVolume] = useState<RankingEntry[]>([])
  const [overallFrequency, setOverallFrequency] = useState<RankingEntry[]>([])
  const [friendVolume, setFriendVolume] = useState<RankingEntry[]>([])
  const [friendFrequency, setFriendFrequency] = useState<RankingEntry[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!user) {
      setOverallVolume([])
      setOverallFrequency([])
      setFriendVolume([])
      setFriendFrequency([])
      return
    }

    let isMounted = true

    const loadRanking = async () => {
      setIsFetching(true)
      setErrorMessage("")
      try {
        const [overall, friends] = await Promise.all([
          getMonthlyRanking(),
          getMonthlyRanking(user.uid),
        ])

        if (!isMounted) {
          return
        }

        setOverallVolume(overall.overallVolume)
        setOverallFrequency(overall.overallFrequency)
        setFriendVolume(friends.overallVolume)
        setFriendFrequency(friends.overallFrequency)
      } catch (error: unknown) {
        if (!isMounted) {
          return
        }
        setErrorMessage(error instanceof Error ? error.message : "ランキングの取得に失敗しました。")
      } finally {
        if (isMounted) {
          setIsFetching(false)
        }
      }
    }

    void loadRanking()

    return () => {
      isMounted = false
    }
  }, [user])

  const rankingEntries = useMemo(() => {
    if (scope === "friends") {
      return metric === "volume" ? friendVolume : friendFrequency
    }

    return metric === "volume" ? overallVolume : overallFrequency
  }, [friendFrequency, friendVolume, metric, overallFrequency, overallVolume, scope])

  const myEntry = useMemo(
    () => rankingEntries.find((entry) => entry.uid === user?.uid) ?? null,
    [rankingEntries, user?.uid],
  )

  if (loading) {
    return <div className="px-4 py-8 text-center text-sm text-white/60">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white">
        <section className="rounded-[30px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(255,255,255,0.04))] p-6 text-center shadow-[0_20px_48px_rgba(245,166,35,0.14)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5A623]/15 text-[#F5A623]">
            <IconTrophy className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black">ランキング</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">
            ログインすると、今月の総重量ランキングやトレーニング日数ランキングを確認できます。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#F5A623]/25 bg-black/30 px-4 py-2 text-xs font-bold text-[#FFE7B0]">
            <IconUsers className="h-4 w-4 text-[#F5A623]" />
            フレンドランキングも利用できます
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white">
      <motion.section
        className="rounded-[30px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(255,255,255,0.04))] p-5 shadow-[0_20px_48px_rgba(245,166,35,0.14)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">RANKING ARENA</div>
            <h1 className="mt-2 text-2xl font-black">月間ランキング</h1>
            <p className="mt-2 text-sm leading-6 text-white/70">
              今月の総重量とトレーニング日数を集計し、全体・フレンド内で順位表示します。
            </p>
          </div>
          <div className="rounded-[24px] border border-[#F5A623]/20 bg-black/25 px-4 py-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F5A623]">SOCIAL通知</div>
            <div className="mt-1 text-2xl font-black">{socialBadgeCount}</div>
          </div>
        </div>
      </motion.section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {[
          { key: "volume", label: "総重量", description: "重量×回数×セット" },
          { key: "frequency", label: "日数", description: "今月のトレ日数" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMetric(option.key as RankingMetric)}
            className={`rounded-[24px] border px-4 py-4 text-left transition ${
              metric === option.key
                ? "border-[#F5A623]/60 bg-[linear-gradient(180deg,rgba(245,166,35,0.22),rgba(255,255,255,0.04))] shadow-[0_16px_36px_rgba(245,166,35,0.12)]"
                : "border-[#F5A623]/15 bg-white/[0.04]"
            }`}
          >
            <div className="text-lg font-black">{option.label}</div>
            <div className="mt-1 text-xs text-white/60">{option.description}</div>
          </button>
        ))}
      </section>

      <section className="mt-3 flex gap-3">
        {[
          { key: "overall", label: "全体ランキング" },
          { key: "friends", label: "フレンド内" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setScope(option.key as RankingScope)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              scope === option.key
                ? "bg-[#F5A623] text-[#0a0a0a]"
                : "border border-[#F5A623]/25 bg-transparent text-[#F5A623]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </section>

      {myEntry ? (
        <section className="mt-5 rounded-[28px] border border-[#F5A623]/25 bg-[linear-gradient(180deg,rgba(245,166,35,0.14),rgba(255,255,255,0.04))] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">YOUR POSITION</div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-black">#{myEntry.rank}</div>
              <div className="mt-1 text-sm text-white/70">{scope === "friends" ? "フレンド内" : "全体"}での現在順位</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{formatMetric(myEntry, metric)}</div>
              <div className="mt-1 text-xs text-[#FFE7B0]">Lv.{myEntry.level} / {myEntry.friendCode}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{scope === "friends" ? "フレンド内ランキング" : "全体ランキング"}</h2>
          <span className="rounded-full bg-[#F5A623]/15 px-3 py-1 text-xs font-bold text-[#F5A623]">
            {metric === "volume" ? "総重量" : "日数"}
          </span>
        </div>

        {isFetching ? <div className="mt-4 text-sm text-white/60">ランキングを集計中...</div> : null}
        {errorMessage ? <div className="mt-4 text-sm text-[#FFE7B0]">{errorMessage}</div> : null}

        {!isFetching && rankingEntries.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">
            今月のトレーニング記録がまだありません。
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rankingEntries.map((entry) => {
              const isMe = entry.uid === user.uid
              return (
                <article
                  key={`${scope}-${metric}-${entry.uid}`}
                  className={`rounded-[24px] border p-4 transition ${
                    isMe
                      ? "border-[#F5A623]/55 bg-[linear-gradient(180deg,rgba(245,166,35,0.22),rgba(255,255,255,0.05))] shadow-[0_16px_36px_rgba(245,166,35,0.12)]"
                      : "border-[#F5A623]/15 bg-black/25"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]">
                        {getTopIcon(entry.rank) ?? <span className="text-sm font-black">#{entry.rank}</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white">{entry.displayName}</span>
                          {isMe ? (
                            <span className="rounded-full bg-[#F5A623] px-2 py-0.5 text-[10px] font-black text-[#0a0a0a]">YOU</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-[#FFE7B0]">Lv.{entry.level} / {entry.friendCode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">{formatMetric(entry, metric)}</div>
                      <div className="mt-1 text-xs text-white/55">{entry.trainingDays}日 / {entry.totalVolume.toLocaleString()}kg</div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}