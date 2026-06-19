import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import {
  createGuild,
  getGuildDetails,
  getGuildInviteCandidates,
  getIncomingGuildInvites,
  respondToGuildInvite,
  sendGuildInvite,
  sendGuildMessage,
  subscribeToGuildMessages,
  type GuildDetails,
  type GuildInvite,
  type GuildMessage,
  type PublicUserProfile,
  type UserProfile,
} from "@/utils/firestoreSync"
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
    : "送信中..."
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

  const currentDisplayName = useMemo(() => profile.displayName || "GORU GYM USER", [profile.displayName])

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
    } else {
      setCandidates([])
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
      setStatusMessage(error instanceof Error ? error.message : "ギルド招待に失敗しました。")
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
      setStatusMessage(error instanceof Error ? error.message : "招待の処理に失敗しました。")
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
          <p className="mt-3 text-sm leading-6 text-white/72">ログインするとギルド作成、招待、チャット、月間合計の確認ができます。</p>
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
        <p className="mt-2 text-sm leading-6 text-white/70">最大5人の仲間と月間総重量を競いながら、リアルタイムチャットで励まし合えます。</p>
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
                  <button type="button" disabled={isBusy} onClick={() => void handleInviteResponse(invite.id, "accepted")} className="rounded-2xl bg-[#F5A623] px-4 py-2 text-sm font-black text-[#0a0a0a] disabled:opacity-60">参加</button>
                  <button type="button" disabled={isBusy} onClick={() => void handleInviteResponse(invite.id, "rejected")} className="rounded-2xl border border-[#F5A623]/30 px-4 py-2 text-sm font-bold text-[#F5A623] disabled:opacity-60">辞退</button>
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623]">月間総重量</div>
              <div className="mt-2 text-2xl font-black">{guild.monthlyTotalVolume.toLocaleString()} kg</div>
            </div>
            <div className="rounded-[24px] border border-[#F5A623]/20 bg-white/[0.04] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F5A623]">月間トレ回数</div>
              <div className="mt-2 text-2xl font-black">{guild.monthlyTrainingDays} 回</div>
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
                      <div className="mt-1 text-xs text-white/55">今月の総重量</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {guild.leaderId === user.uid ? (
            <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
              <h2 className="text-lg font-black">フレンドを招待</h2>
              <div className="mt-4 space-y-3">
                {candidates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">招待できるフレンドがいません。すでに所属済みか、フレンド追加が必要です。</div>
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
                <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">まだメッセージはありません。最初の一言を送ってみましょう。</div>
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