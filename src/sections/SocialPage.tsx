import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import {
  getFriendProfile,
  getFriends,
  getIncomingFriendRequests,
  getTrainingLikes,
  respondToFriendRequest,
  toggleTrainingLike,
  type FriendProfile,
  type FriendRequest,
  type PublicUserProfile,
  type UserProfile,
} from "@/utils/firestoreSync"
import { getCharacterGrowthImage } from "@/assets/characters"
import { IconUsers } from "@/icons"

interface SocialPageProps {
  profile: UserProfile
}

export default function SocialPage({ profile }: SocialPageProps) {
  const { user, loading } = useAuth()
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<PublicUserProfile[]>([])
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null)
  const [likesByEntry, setLikesByEntry] = useState<Record<number, string[]>>({})
  const [message, setMessage] = useState("")
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null)
  const [busyLikeId, setBusyLikeId] = useState<number | null>(null)

  const currentDisplayName = useMemo(() => profile.displayName || "GORU GYM USER", [profile.displayName])

  const loadLikes = async (friendProfile: FriendProfile) => {
    const likesEntries = await Promise.all(
      friendProfile.trainingEntries.map(async (entry) => [entry.id, await getTrainingLikes(friendProfile.uid, entry.id)] as const),
    )

    setLikesByEntry(
      Object.fromEntries(likesEntries.map(([entryId, likes]) => [entryId, likes.map((like) => like.uid)])),
    )
  }

  const loadSocialData = async () => {
    if (!user) {
      return
    }

    const [incomingRequests, friendProfiles] = await Promise.all([
      getIncomingFriendRequests(user.uid),
      getFriends(user.uid),
    ])

    setRequests(incomingRequests)
    setFriends(friendProfiles)

    if (selectedFriend) {
      const refreshed = await getFriendProfile(selectedFriend.uid)
      setSelectedFriend(refreshed)
      await loadLikes(refreshed)
    }
  }

  useEffect(() => {
    void loadSocialData()
  }, [user])

  const handleRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    setBusyRequestId(requestId)
    setMessage("")
    try {
      await respondToFriendRequest(requestId, action)
      await loadSocialData()
      setMessage(action === "accepted" ? "フレンドリクエストを承認しました。" : "フレンドリクエストを拒否しました。")
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "リクエストの処理に失敗しました。")
    } finally {
      setBusyRequestId(null)
    }
  }

  const handleSelectFriend = async (friendUid: string) => {
    setMessage("")
    try {
      const friendProfile = await getFriendProfile(friendUid)
      setSelectedFriend(friendProfile)
      await loadLikes(friendProfile)
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "フレンド情報の取得に失敗しました。")
    }
  }

  const handleToggleLike = async (entryId: number) => {
    if (!user || !selectedFriend) {
      return
    }

    setBusyLikeId(entryId)
    setMessage("")
    try {
      const liked = await toggleTrainingLike(selectedFriend.uid, entryId, { uid: user.uid, displayName: currentDisplayName })
      setLikesByEntry((current) => {
        const currentLikes = current[entryId] ?? []
        return {
          ...current,
          [entryId]: liked ? [...currentLikes, user.uid] : currentLikes.filter((uid) => uid !== user.uid),
        }
      })
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "いいねの更新に失敗しました。")
    } finally {
      setBusyLikeId(null)
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
          <h1 className="mt-4 text-2xl font-black text-white">SOCIAL</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">ログインするとフレンド管理とゴリラ閲覧が使えます。</p>
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
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">SOCIAL HQ</div>
        <h1 className="mt-2 text-2xl font-black">フレンド & ゴリラ</h1>
        <p className="mt-2 text-sm leading-6 text-white/70">受信リクエストの承認、フレンド一覧、相手の成長状況をここで確認できます。</p>
        {message ? <p className="mt-3 text-sm text-[#FFE7B0]">{message}</p> : null}
      </motion.section>

      <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">受信リクエスト</h2>
          <span className="rounded-full bg-[#F5A623]/15 px-3 py-1 text-xs font-bold text-[#F5A623]">{requests.length}件</span>
        </div>
        <div className="mt-4 space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">未処理のリクエストはありません。</div>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="rounded-[24px] border border-[#F5A623]/20 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black">{request.fromProfile?.displayName}</div>
                    <div className="mt-1 text-sm text-[#FFE7B0]">Lv.{request.fromProfile?.level} / {request.fromProfile?.friendCode}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleRequestAction(request.id, "accepted")}
                      className="rounded-2xl bg-[#F5A623] px-4 py-2 text-sm font-black text-[#0a0a0a] disabled:opacity-60"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleRequestAction(request.id, "rejected")}
                      className="rounded-2xl border border-[#F5A623]/30 bg-transparent px-4 py-2 text-sm font-bold text-[#F5A623] disabled:opacity-60"
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

      <section className="mt-5 rounded-[28px] border border-[#F5A623]/20 bg-white/[0.04] p-5">
        <h2 className="text-lg font-black">フレンド一覧</h2>
        <div className="mt-4 space-y-3">
          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">まだフレンドがいません。プロフィール画面から仲間を探しましょう。</div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.uid}
                type="button"
                onClick={() => void handleSelectFriend(friend.uid)}
                className="flex w-full items-center justify-between rounded-[24px] border border-[#F5A623]/20 bg-[linear-gradient(180deg,rgba(245,166,35,0.12),rgba(255,255,255,0.03))] p-4 text-left transition hover:border-[#F5A623]/40"
              >
                <div>
                  <div className="text-lg font-black text-white">{friend.displayName}</div>
                  <div className="mt-1 text-sm text-[#FFE7B0]">ゴリラレベル Lv.{friend.level}</div>
                </div>
                <div className="text-sm font-bold text-[#F5A623]">閲覧する</div>
              </button>
            ))
          )}
        </div>
      </section>

      {selectedFriend ? (
        <section className="mt-5 rounded-[30px] border border-[#F5A623]/25 bg-[linear-gradient(180deg,rgba(245,166,35,0.14),rgba(255,255,255,0.04))] p-5 shadow-[0_18px_40px_rgba(245,166,35,0.12)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">FRIEND GORILLA</div>
              <h2 className="mt-2 text-2xl font-black">{selectedFriend.displayName}</h2>
              <p className="mt-2 text-sm text-white/70">Lv.{selectedFriend.level} / 総XP {selectedFriend.xp.toLocaleString()} / トレ日数 {selectedFriend.trainingDays}日</p>
            </div>
            <img
              src={getCharacterGrowthImage("gorilla", Math.min(5, Math.max(1, selectedFriend.level >= 25 ? 5 : Math.ceil(selectedFriend.level / 5))))}
              alt={`${selectedFriend.displayName}のゴリラ`}
              className="h-24 w-24 rounded-3xl border border-[#F5A623]/30 bg-black/30 object-cover"
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-[#F5A623]/20 bg-black/25 p-4">
            <div className="text-sm font-bold text-[#FFE7B0]">最近のトレーニング記録</div>
            <div className="mt-3 space-y-3">
              {selectedFriend.trainingEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#F5A623]/20 px-4 py-5 text-sm text-white/60">まだ公開できるトレーニング記録がありません。</div>
              ) : (
                selectedFriend.trainingEntries.map((entry) => {
                  const likedByCurrentUser = Boolean(user && (likesByEntry[entry.id] ?? []).includes(user.uid))
                  const totalLikes = likesByEntry[entry.id]?.length ?? 0
                  const totalVolume = entry.sets.reduce((sum, set) => sum + set.weight * (set.reps ?? 0), 0)
                  return (
                    <article key={entry.id} className="rounded-[22px] border border-[#F5A623]/15 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-black">{entry.exerciseName}</div>
                          <div className="mt-1 text-sm text-white/65">{entry.bodyPart} / {entry.sets.length}セット / 総ボリューム {totalVolume.toLocaleString()}</div>
                        </div>
                        <button
                          type="button"
                          disabled={busyLikeId === entry.id}
                          onClick={() => void handleToggleLike(entry.id)}
                          className={`rounded-2xl px-4 py-2 text-sm font-black transition ${likedByCurrentUser ? "bg-[#F5A623] text-[#0a0a0a]" : "border border-[#F5A623]/30 bg-transparent text-[#F5A623]"} disabled:opacity-60`}
                        >
                          ♥ {totalLikes}
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}