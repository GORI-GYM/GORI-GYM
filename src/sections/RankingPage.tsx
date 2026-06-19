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
    return <div className="bg-[#0a0a0a] px-4 py-8 text-center text-[#888] text-sm">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white space-y-6">
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-center">
          <div className="mx-auto bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex h-16 w-16 items-center justify-center text-[#F5A623]">
            <IconTrophy className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-white font-bold text-lg">ランキング</h1>
          <p className="mt-3 text-[#ccc]">
            ログインすると、全体ランキングやフレンド内ランキングを確認できます。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2">
            <IconUsers className="h-4 w-4 text-[#F5A623]" />
            フレンドランキングも利用できます
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white space-y-6">
      <motion.section
        className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[#888] text-sm">RANKING ARENA</div>
            <h1 className="mt-2 text-white font-bold text-lg">月間ランキング</h1>
            <p className="mt-2 text-[#ccc]">
              今月の総ボリュームとトレーニング日数を比較し、全体・フレンド内で順位を確認できます。
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-right">
            <div className="text-[#888] text-sm">SOCIAL通知</div>
            <div className="mt-1 text-white font-bold text-lg">{socialBadgeCount}</div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        {[
          { key: "volume", label: "総ボリューム", description: "持ち上げた総重量で比較" },
          { key: "frequency", label: "日数", description: "今月のトレーニング日数" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMetric(option.key as RankingMetric)}
            className={`rounded-xl border px-4 py-4 text-left transition ${
              metric === option.key
                ? "bg-[#1a1a1a] border-[#F5A623]"
                : "bg-[#1a1a1a] border-[#2a2a2a]"
            }`}
          >
            <div className="text-white font-bold text-lg">{option.label}</div>
            <div className="mt-1 text-[#888] text-sm">{option.description}</div>
          </button>
        ))}
      </section>

      <section className="flex gap-3">
        {[
          { key: "overall", label: "全体ランキング" },
          { key: "friends", label: "フレンド内" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setScope(option.key as RankingScope)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              scope === option.key
                ? "bg-[#F5A623] text-black font-bold"
                : "border border-[#F5A623] text-[#F5A623]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </section>

      {myEntry ? (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <div className="text-[#888] text-sm">YOUR POSITION</div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold text-lg">#{myEntry.rank}</div>
              <div className="mt-1 text-[#ccc]">{scope === "friends" ? "フレンド内" : "全体"}での現在順位</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{formatMetric(myEntry, metric)}</div>
              <div className="mt-1 text-[#888] text-sm">Lv.{myEntry.level} / {myEntry.friendCode}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{scope === "friends" ? "フレンド内ランキング" : "全体ランキング"}</h2>
          <span className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">
            {metric === "volume" ? "総ボリューム" : "日数"}
          </span>
        </div>

        {isFetching ? <div className="mt-4 text-[#888] text-sm">ランキングを取得中...</div> : null}
        {errorMessage ? <div className="mt-4 text-[#ccc]">{errorMessage}</div> : null}

        {!isFetching && rankingEntries.length === 0 ? (
          <div className="mt-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">
            まだ今月のトレーニング記録がありません。
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rankingEntries.map((entry) => {
              const isMe = entry.uid === user.uid
              return (
                <article
                  key={`${scope}-${metric}-${entry.uid}`}
                  className={`rounded-xl border p-4 transition ${
                    isMe
                      ? "border-[#F5A623] bg-[#1a1a1a]"
                      : "border-[#2a2a2a] bg-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex h-11 w-11 items-center justify-center text-[#F5A623]">
                        {getTopIcon(entry.rank) ?? <span className="text-sm font-black">#{entry.rank}</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">{entry.displayName}</span>
                          {isMe ? (
                            <span className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">YOU</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-[#888] text-sm">Lv.{entry.level} / {entry.friendCode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">{formatMetric(entry, metric)}</div>
                      <div className="mt-1 text-[#888] text-sm">{entry.trainingDays}日 / {entry.totalVolume.toLocaleString()}kg</div>
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