import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import {
  completeGuildWar,
  createGuild,
  createGuildWarRequest,
  getGuildDetails,
  getGuildInviteCandidates,
  getGuildWarHistory,
  getIncomingGuildInvites,
  respondToGuildInvite,
  searchGuildsForWar,
  sendGuildInvite,
  sendGuildMessage,
  subscribeToGuildMessages,
  subscribeToGuildWar,
  type GuildDetails,
  type GuildInvite,
  type GuildMessage,
  type GuildWarRecord,
  type PublicUserProfile,
  type UserProfile,
} from "@/utils/firestoreSync"
import { getGuildWarProgressRatio, isGuildWarWeekFinished } from "@/utils/guildWar"
import { IconShield, IconUsers } from "@/icons"

interface GuildPageProps {
  profile: UserProfile
}

function formatTimestamp(value: unknown) {
  const date = value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate()
    : null

  return date instanceof Date
    ? new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
    : "読み込み中..."
}

function formatWarPeriod(weekStart?: string, weekEnd?: string) {
  if (!weekStart || !weekEnd) {
    return "今週の対抗戦"
  }

  return `${weekStart.replace(/-/g, "/")} 〜 ${weekEnd.replace(/-/g, "/")}`
}

export default function GuildPage({ profile }: GuildPageProps) {
  const { user, loading } = useAuth()
  const [guild, setGuild] = useState<GuildDetails | null>(null)
  const [invites, setInvites] = useState<GuildInvite[]>([])
  const [candidates, setCandidates] = useState<PublicUserProfile[]>([])
  const [messages, setMessages] = useState<GuildMessage[]>([])
  const [guildName, setGuildName] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [guildWar, setGuildWar] = useState<GuildWarRecord | null>(null)
  const [guildWarHistory, setGuildWarHistory] = useState<GuildWarRecord[]>([])
  const [guildSearchTerm, setGuildSearchTerm] = useState("")
  const [guildSearchResults, setGuildSearchResults] = useState<Array<{ id: string; name: string; members: string[]; memberProfiles: PublicUserProfile[] }>>([])

  const currentDisplayName = useMemo(() => profile.displayName || "GORU GYM USER", [profile.displayName])
  const isLeader = Boolean(user && guild?.leaderId === user.uid)
  const progressRatio = useMemo(
    () => getGuildWarProgressRatio(guildWar?.guild1TotalXP ?? 0, guildWar?.guild2TotalXP ?? 0),
    [guildWar?.guild1TotalXP, guildWar?.guild2TotalXP],
  )

  const loadGuildData = async () => {
    if (!user) {
      return
    }

    const [guildDetails, incomingInvites] = await Promise.all([
      getGuildDetails(user.uid),
      getIncomingGuildInvites(user.uid),
    ])

    setGuild(guildDetails)
    setInvites(incomingInvites)

    if (guildDetails?.leaderId === user.uid) {
      const inviteCandidates = await getGuildInviteCandidates(user.uid)
      setCandidates(inviteCandidates)
      const history = await getGuildWarHistory(guildDetails.id)
      setGuildWarHistory(history)
    } else if (guildDetails?.id) {
      const history = await getGuildWarHistory(guildDetails.id)
      setGuildWarHistory(history)
      setCandidates([])
    } else {
      setCandidates([])
      setGuildWarHistory([])
    }
  }

  useEffect(() => {
    void loadGuildData()
  }, [user])

  useEffect(() => {
    if (!guild?.id) {
      setMessages([])
      return
    }

    const unsubscribe = subscribeToGuildMessages(
      guild.id,
      (nextMessages) => setMessages(nextMessages),
      () => setStatusMessage("ギルドチャットの取得に失敗しました。"),
    )

    return unsubscribe
  }, [guild?.id])

  useEffect(() => {
    if (!guild?.id) {
      setGuildWar(null)
      return
    }

    const unsubscribe = subscribeToGuildWar(
      guild.id,
      (nextWar) => setGuildWar(nextWar),
      () => setStatusMessage("ギルド対抗戦の取得に失敗しました。"),
    )

    return unsubscribe
  }, [guild?.id])

  const handleCreateGuild = async () => {
    if (!user) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      await createGuild(user.uid, guildName)
      setGuildName("")
      await loadGuildData()
      setStatusMessage("ギルドを作成しました。")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "ギルド作成に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleInvite = async (friendUid: string) => {
    if (!user || !guild) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      await sendGuildInvite(user.uid, friendUid, guild.id)
      await loadGuildData()
      setStatusMessage("ギルド招待を送信しました。")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "ギルド招待の送信に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleInviteResponse = async (inviteId: string, action: "accepted" | "rejected") => {
    setIsBusy(true)
    setStatusMessage("")
    try {
      await respondToGuildInvite(inviteId, action)
      await loadGuildData()
      setStatusMessage(action === "accepted" ? "ギルドに参加しました。" : "招待を辞退しました。")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "招待への対応に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !guild) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      await sendGuildMessage(guild.id, user.uid, currentDisplayName, chatInput)
      setChatInput("")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "メッセージ送信に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleSearchGuilds = async () => {
    if (!user) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      const results = await searchGuildsForWar(user.uid, guildSearchTerm)
      setGuildSearchResults(results)
      if (results.length === 0) {
        setStatusMessage("条件に合う対戦相手が見つかりませんでした。")
      }
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "ギルド検索に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleCreateGuildWar = async (opponentGuildId: string) => {
    if (!user || !guild) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      await createGuildWarRequest(user.uid, opponentGuildId)
      await loadGuildData()
      setGuildSearchResults([])
      setGuildSearchTerm("")
      setStatusMessage("ギルド対抗戦を開始しました。")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "ギルド対抗戦の開始に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  const handleCompleteGuildWar = async () => {
    if (!guildWar) {
      return
    }

    setIsBusy(true)
    setStatusMessage("")
    try {
      await completeGuildWar(guildWar.id)
      await loadGuildData()
      setStatusMessage("今週のギルド対抗戦を締めました。")
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "ギルド対抗戦の締め処理に失敗しました。")
    } finally {
      setIsBusy(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-8 text-center text-sm text-white/60">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-8">
        <div className="rounded-[28px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.12),rgba(255,255,255,0.04))] p-6 text-center shadow-[0_18px_40px_rgba(245,166,35,0.12)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5A623]/15 text-[#F5A623]">
            <IconShield className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">GUILD</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">ログインするとギルド作成、招待、チャット、対抗戦に参加できます。</p>
        </div>
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
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">GUILD HALL</div>
        <h1 className="mt-2 text-2xl font-black">ギルド</h1>
        <p className="mt-2 text-sm leading-6 text-white/70">最大5人の仲間と鍛え、リアルタイムで進捗を競う週間ギルド対抗戦に挑め。</p>
        {statusMessage ? <p className="mt-3 text-sm text-[#FFE7B0]">{statusMessage}</p> : null}
      </motion.section>

      {invites.length > 0 ? (
        <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">届いている招待</h2>
            <span className="rounded-full bg-[#F5A623]/15 px-3 py-1 text-xs font-bold text-[#F5A623]">{invites.length}件</span>
          </div>
          <div className="mt-4 space-y-3">
            {invites.map((invite) => (
              <article key={invite.id} className="rounded-[24px] border border-[#F5A623]/20 bg-black/25 p-4">
                <div className="text-lg font-black">{invite.guildName}</div>
                <div className="mt-1 text-sm text-[#FFE7B0]">{invite.fromProfile?.displayName ?? "UNKNOWN"} からの招待</div>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={isBusy} onClick={() => void handleInviteResponse(invite.id, "accepted")} className="rounded-2xl bg-[#F5A623] px-4 py-2 text-sm font-black text-[#0a0a0a] disabled:opacity-60">参加する</button>
                  <button type="button" disabled={isBusy} onClick={() => void handleInviteResponse(invite.id, "rejected")} className="rounded-2xl border border-[#F5A623]/30 px-4 py-2 text-sm font-bold text-[#F5A623] disabled:opacity-60">辞退する</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!guild ? (
        <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
          <h2 className="text-lg font-black">ギルドを作成</h2>
          <p className="mt-2 text-sm text-white/65">1人1ギルドまで。作成者が自動でリーダーになります。</p>
          <div className="mt-4 flex gap-3">
            <input
              value={guildName}
              onChange={(event) => setGuildName(event.target.value)}
              placeholder="例: ゴリラ筋肉団"
              className="flex-1 rounded-2xl border border-[#F5A623]/25 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button type="button" disabled={isBusy} onClick={() => void handleCreateGuild()} className="rounded-2xl bg-[#F5A623] px-5 py-3 text-sm font-black text-[#0a0a0a] disabled:opacity-60">
              作成
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#F5A623]/20 bg-white/[0.04] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623]">MONTHLY VOLUME</div>
              <div className="mt-2 text-2xl font-black">{guild.monthlyTotalVolume.toLocaleString()} kg</div>
            </div>
            <div className="rounded-[24px] border border-[#F5A623]/20 bg-white/[0.04] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623]">TRAINING DAYS</div>
              <div className="mt-2 text-2xl font-black">{guild.monthlyTrainingDays} 日</div>
            </div>
          </section>

          <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">{guild.name}</h2>
                <div className="mt-1 text-sm text-[#FFE7B0]">メンバー {guild.members.length}/5 ・ リーダー {guild.memberProfiles.find((member) => member.uid === guild.leaderId)?.displayName ?? "UNKNOWN"}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5A623]/15 text-[#F5A623]">
                <IconUsers className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {guild.memberProfiles.map((member) => (
                <article key={member.uid} className="rounded-[22px] border border-[#F5A623]/15 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black">{member.displayName}</span>
                        {member.uid === guild.leaderId ? <span className="rounded-full bg-[#F5A623] px-2 py-0.5 text-[10px] font-black text-[#0a0a0a]">LEADER</span> : null}
                      </div>
                      <div className="mt-1 text-sm text-[#FFE7B0]">ゴリラLv.{member.level}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black">{member.monthlyVolume.toLocaleString()} kg</div>
                      <div className="mt-1 text-xs text-white/55">今月の総ボリューム</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-[28px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.16),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_40px_rgba(245,166,35,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">GUILD WAR</div>
                <h2 className="mt-2 text-xl font-black">ギルド対抗戦</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">毎週月曜〜日曜の合計XPで勝負。勝利ギルド全員に+300XP、敗北側にも+100XP。</p>
              </div>
              <div className="rounded-full border border-[#F5A623]/30 bg-black/30 px-3 py-1 text-xs font-bold text-[#FFE7B0]">
                {guildWar ? (guildWar.status === "completed" ? "結果確定" : "進行中") : "待機中"}
              </div>
            </div>

            {guildWar ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-[#F5A623]/20 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-[#FFE7B0]">
                    <span>{formatWarPeriod(guildWar.weekStart, guildWar.weekEnd)}</span>
                    <span>{guildWar.winnerId ? "優勢あり" : "接戦中"}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <div className="text-sm text-white/60">{guildWar.guild1Name}</div>
                      <div className="mt-1 text-2xl font-black">{guildWar.guild1TotalXP.toLocaleString()} XP</div>
                    </div>
                    <div className="text-lg font-black text-[#F5A623]">VS</div>
                    <div className="text-right">
                      <div className="text-sm text-white/60">{guildWar.guild2Name}</div>
                      <div className="mt-1 text-2xl font-black">{guildWar.guild2TotalXP.toLocaleString()} XP</div>
                    </div>
                  </div>
                  <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10">
                    <div className="flex h-full">
                      <div className="bg-[linear-gradient(90deg,#F5A623,#FFD978)]" style={{ width: `${progressRatio.left}%` }} />
                      <div className="bg-white/15" style={{ width: `${progressRatio.right}%` }} />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-white/55">
                    <span>{Math.round(progressRatio.left)}%</span>
                    <span>{Math.round(progressRatio.right)}%</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-[#F5A623]/15 bg-black/25 p-4">
                    <div className="text-sm font-black text-[#F5A623]">{guildWar.guild1Name}</div>
                    <div className="mt-3 space-y-2">
                      {guildWar.guild1Members?.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <span className="text-sm font-semibold">{member.displayName}</span>
                          <span className="text-sm font-black text-[#FFE7B0]">{member.weeklyXP.toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#F5A623]/15 bg-black/25 p-4">
                    <div className="text-sm font-black text-[#F5A623]">{guildWar.guild2Name}</div>
                    <div className="mt-3 space-y-2">
                      {guildWar.guild2Members?.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <span className="text-sm font-semibold">{member.displayName}</span>
                          <span className="text-sm font-black text-[#FFE7B0]">{member.weeklyXP.toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isLeader && guildWar.status !== "completed" && isGuildWarWeekFinished() ? (
                  <button type="button" disabled={isBusy} onClick={() => void handleCompleteGuildWar()} className="w-full rounded-2xl bg-[#F5A623] px-5 py-3 text-sm font-black text-[#0a0a0a] disabled:opacity-60">
                    週末結果を確定する
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-[#F5A623]/20 bg-black/20 p-4 text-sm text-white/65">
                現在進行中の対抗戦はありません。
              </div>
            )}

            {isLeader && !guildWar ? (
              <div className="mt-5 rounded-[24px] border border-[#F5A623]/20 bg-black/25 p-4">
                <div className="text-sm font-black text-white">対抗戦を申し込む</div>
                <div className="mt-3 flex gap-3">
                  <input
                    value={guildSearchTerm}
                    onChange={(event) => setGuildSearchTerm(event.target.value)}
                    placeholder="ギルド名で検索"
                    className="flex-1 rounded-2xl border border-[#F5A623]/25 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                  />
                  <button type="button" disabled={isBusy} onClick={() => void handleSearchGuilds()} className="rounded-2xl bg-[#F5A623] px-5 py-3 text-sm font-black text-[#0a0a0a] disabled:opacity-60">
                    検索
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {guildSearchResults.map((result) => (
                    <div key={result.id} className="rounded-[22px] border border-[#F5A623]/15 bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-black">{result.name}</div>
                          <div className="mt-1 text-xs text-[#FFE7B0]">メンバー {result.members.length}/5</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {result.memberProfiles.map((member) => (
                              <span key={member.uid} className="rounded-full border border-[#F5A623]/20 bg-black/30 px-2 py-1 text-[11px] text-white/75">
                                {member.displayName} Lv.{member.level}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button type="button" disabled={isBusy} onClick={() => void handleCreateGuildWar(result.id)} className="rounded-2xl border border-[#F5A623] px-4 py-2 text-sm font-black text-[#F5A623] transition hover:bg-[#F5A623] hover:text-[#0a0a0a] disabled:opacity-60">
                          申し込む
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <div className="text-sm font-black text-white">戦績履歴</div>
              <div className="mt-3 space-y-3">
                {guildWarHistory.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">まだ対抗戦の履歴はありません。</div>
                ) : (
                  guildWarHistory.map((war) => {
                    const isWin = war.winnerId === guild.id
                    const isDraw = !war.winnerId
                    return (
                      <article key={war.id} className="rounded-[22px] border border-[#F5A623]/15 bg-black/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-black">{war.guild1Name} VS {war.guild2Name}</div>
                            <div className="mt-1 text-xs text-white/55">{formatWarPeriod(war.weekStart, war.weekEnd)}</div>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-xs font-black ${isDraw ? "bg-white/10 text-white/70" : isWin ? "bg-[#F5A623] text-[#0a0a0a]" : "bg-white/10 text-[#FFE7B0]"}`}>
                            {isDraw ? "DRAW" : isWin ? "WIN" : "LOSE"}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span>{war.guild1TotalXP.toLocaleString()} XP</span>
                          <span className="text-[#F5A623]">VS</span>
                          <span>{war.guild2TotalXP.toLocaleString()} XP</span>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </div>
          </section>

          {isLeader ? (
            <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
              <h2 className="text-lg font-black">フレンドを招待</h2>
              <div className="mt-4 space-y-3">
                {candidates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">招待できるフレンドがいません。先にフレンド追加を進めましょう。</div>
                ) : (
                  candidates.map((candidate) => (
                    <div key={candidate.uid} className="flex items-center justify-between rounded-[22px] border border-[#F5A623]/15 bg-black/25 p-4">
                      <div>
                        <div className="text-base font-black">{candidate.displayName}</div>
                        <div className="mt-1 text-xs text-[#FFE7B0]">Lv.{candidate.level} / {candidate.friendCode}</div>
                      </div>
                      <button type="button" disabled={isBusy || guild.members.length >= 5} onClick={() => void handleInvite(candidate.uid)} className="rounded-2xl bg-[#F5A623] px-4 py-2 text-sm font-black text-[#0a0a0a] disabled:opacity-60">
                        招待
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">ギルドチャット</h2>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">まだメッセージはありません。最初の一言で士気を上げよう。</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === user.uid
                  return (
                    <article key={message.id} className={`rounded-[22px] border p-4 ${isMine ? "border-[#F5A623]/35 bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(255,255,255,0.04))]" : "border-[#F5A623]/15 bg-black/25"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black">{message.senderName}</div>
                        <div className="text-[11px] text-white/45">{formatTimestamp(message.timestamp)}</div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/80">{message.text}</p>
                    </article>
                  )
                })
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="メッセージを入力"
                className="flex-1 rounded-2xl border border-[#F5A623]/25 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button type="button" disabled={isBusy} onClick={() => void handleSendMessage()} className="rounded-2xl bg-[#F5A623] px-5 py-3 text-sm font-black text-[#0a0a0a] disabled:opacity-60">
                送信
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}