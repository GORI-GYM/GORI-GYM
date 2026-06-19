import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { ensureUserFriendCode, saveUserProfile, searchUsers, sendFriendRequest, type PublicUserProfile, type UserProfile } from "@/utils/firestoreSync"
import { IconUsers } from "@/icons"

interface ProfilePageProps {
  profile: UserProfile
  onProfileChange: (profile: UserProfile) => void
}

export default function ProfilePage({ profile, onProfileChange }: ProfilePageProps) {
  const { user, loading } = useAuth()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [friendCode, setFriendCode] = useState(profile.friendCode ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState("")
  const [pendingRequestUid, setPendingRequestUid] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile.displayName)
    setFriendCode(profile.friendCode ?? "")
  }, [profile.displayName, profile.friendCode])

  useEffect(() => {
    if (!user) {
      return
    }

    if (profile.friendCode) {
      setFriendCode(profile.friendCode)
      return
    }

    void ensureUserFriendCode(user.uid)
      .then((code) => {
        setFriendCode(code)
        onProfileChange({ ...profile, friendCode: code })
      })
      .catch((error: unknown) => {
        setSaveMessage(error instanceof Error ? error.message : "フレンドコードの取得に失敗しました。")
      })
  }, [onProfileChange, profile, user])

  const monthlyTrainingDays = useMemo(() => profile.trainingDays, [profile.trainingDays])

  const handleSave = async () => {
    if (!user) {
      return
    }

    const nextDisplayName = displayName.trim()

    if (!nextDisplayName) {
      setSaveMessage("表示名を入力してください。")
      return
    }

    setIsSaving(true)
    setSaveMessage("")

    try {
      const nextProfile = {
        ...profile,
        displayName: nextDisplayName,
        friendCode: friendCode || profile.friendCode,
      }
      await saveUserProfile(user.uid, nextProfile)
      onProfileChange(nextProfile)
      setSaveMessage("プロフィールを更新しました。")
    } catch (error: unknown) {
      setSaveMessage(error instanceof Error ? error.message : "プロフィールの更新に失敗しました。")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!friendCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(friendCode)
      setSaveMessage("フレンドコードをコピーしました。")
    } catch {
      setSaveMessage("コピーに失敗しました。")
    }
  }

  const handleSearch = async () => {
    if (!user) {
      return
    }

    const normalizedTerm = searchTerm.trim()

    if (!normalizedTerm) {
      setSearchResults([])
      setSearchMessage("表示名またはフレンドコードを入力してください。")
      return
    }

    setIsSearching(true)
    setSearchMessage("")

    try {
      const results = await searchUsers(normalizedTerm, user.uid)
      setSearchResults(results)
      setSearchMessage(results.length === 0 ? "該当するユーザーが見つかりませんでした。" : "")
    } catch (error: unknown) {
      setSearchMessage(error instanceof Error ? error.message : "検索に失敗しました。")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendFriendRequest = async (targetUid: string) => {
    if (!user) {
      return
    }

    setPendingRequestUid(targetUid)
    setSearchMessage("")

    try {
      await sendFriendRequest(user.uid, targetUid)
      setSearchMessage("フレンドリクエストを送信しました。")
    } catch (error: unknown) {
      setSearchMessage(error instanceof Error ? error.message : "フレンドリクエストの送信に失敗しました。")
    } finally {
      setPendingRequestUid(null)
    }
  }

  if (loading) {
    return <div className="px-4 py-8 text-center text-sm text-slate-500">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-8">
        <div className="rounded-[28px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.12),rgba(255,255,255,0.04))] p-6 text-center shadow-[0_18px_40px_rgba(245,166,35,0.12)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5A623]/15 text-[#F5A623]">
            <IconUsers className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">プロフィール & フレンド</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">
            ログインするとプロフィール編集、フレンドコード発行、ユーザー検索が使えます。
          </p>
          <div className="mt-5 rounded-2xl border border-[#F5A623]/20 bg-white/5 px-4 py-3 text-sm text-[#FFE7B0]">
            右上のログインからGORU GYMアカウントに参加してください。
          </div>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">PROFILE</div>
            <h1 className="mt-2 text-2xl font-black">GORU SOCIAL</h1>
          </div>
          <div className="rounded-2xl border border-[#F5A623]/30 bg-black/30 px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#FFE7B0]">GORILLA LEVEL</div>
            <div className="mt-1 text-2xl font-black text-[#F5A623]">Lv.{profile.level}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard label="月間トレ日数" value={`${monthlyTrainingDays}日`} />
          <StatCard label="総XP" value={`${profile.xp.toLocaleString()} XP`} />
        </div>

        <div className="mt-5 rounded-[24px] border border-[#F5A623]/20 bg-black/30 p-4">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFE7B0]">表示名</label>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={24}
            className="mt-2 w-full rounded-2xl border border-[#F5A623]/25 bg-white px-4 py-3 text-sm font-semibold text-[#0a0a0a] outline-none ring-0 placeholder:text-slate-400"
            placeholder="GORU GYM USER"
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="mt-3 w-full rounded-2xl bg-[#F5A623] px-4 py-3 text-sm font-black text-[#0a0a0a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "保存中..." : "プロフィールを保存"}
          </button>
          {saveMessage ? <p className="mt-3 text-sm text-[#FFE7B0]">{saveMessage}</p> : null}
        </div>

        <div className="mt-5 rounded-[24px] border border-[#F5A623]/20 bg-white/[0.06] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFE7B0]">FRIEND CODE</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-[#F5A623]/25 bg-black/40 px-4 py-3 text-lg font-black tracking-[0.28em] text-[#F5A623]">
              {friendCode || "------"}
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-2xl border border-[#F5A623]/30 bg-[#F5A623]/10 px-4 py-3 text-sm font-bold text-[#F5A623] transition hover:bg-[#F5A623]/20"
            >
              コピー
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="mt-5 rounded-[30px] border border-[#F5A623]/20 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">USER SEARCH</div>
        <h2 className="mt-2 text-xl font-black">仲間を探す</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">フレンドコード完全一致、または表示名の前方一致で検索できます。</p>

        <div className="mt-4 flex gap-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="flex-1 rounded-2xl border border-[#F5A623]/25 bg-white px-4 py-3 text-sm font-semibold text-[#0a0a0a] outline-none placeholder:text-slate-400"
            placeholder="例: GORU01 / ゴリラ太郎"
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isSearching}
            className="rounded-2xl bg-[#F5A623] px-5 py-3 text-sm font-black text-[#0a0a0a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearching ? "検索中" : "検索"}
          </button>
        </div>

        {searchMessage ? <p className="mt-3 text-sm text-[#FFE7B0]">{searchMessage}</p> : null}

        <div className="mt-4 space-y-3">
          {searchResults.map((result) => (
            <article
              key={result.uid}
              className="rounded-[24px] border border-[#F5A623]/20 bg-[linear-gradient(180deg,rgba(245,166,35,0.12),rgba(255,255,255,0.03))] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-white">{result.displayName}</div>
                  <div className="mt-1 text-sm text-[#FFE7B0]">フレンドコード: {result.friendCode}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-2xl border border-[#F5A623]/25 bg-black/30 px-3 py-2 text-right">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#FFE7B0]">LEVEL</div>
                    <div className="text-lg font-black text-[#F5A623]">Lv.{result.level}</div>
                  </div>
                  <button
                    type="button"
                    disabled={pendingRequestUid === result.uid}
                    onClick={() => void handleSendFriendRequest(result.uid)}
                    className="rounded-2xl bg-[#F5A623] px-4 py-2 text-xs font-black text-[#0a0a0a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingRequestUid === result.uid ? "送信中..." : "リクエスト送信"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#F5A623]/20 bg-black/30 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFE7B0]">{label}</div>
      <div className="mt-2 text-xl font-black text-[#F5A623]">{value}</div>
    </div>
  )
}