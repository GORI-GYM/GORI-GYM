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
    return <div className="bg-[#0a0a0a] px-4 py-8 text-center text-[#888] text-sm">読み込み中...</div>
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#0a0a0a] px-4 py-8">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-center">
          <div className="mx-auto bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex h-16 w-16 items-center justify-center text-[#F5A623]">
            <IconUsers className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-white font-bold text-lg">SOCIAL</h1>
          <p className="mt-3 text-[#ccc]">ログインするとフレンド管理とゴリラ閲覧が使えます。</p>
        </div>
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
        <div className="text-[#888] text-sm">SOCIAL HQ</div>
        <h1 className="mt-2 text-white font-bold text-lg">フレンド & ゴリラ</h1>
        <p className="mt-2 text-[#ccc]">受信リクエストの承認、フレンド一覧、相手の成長状況をここで確認できます。</p>
        {message ? <p className="mt-3 text-[#ccc]">{message}</p> : null}
      </motion.section>

      <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">受信リクエスト</h2>
          <span className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">{requests.length}件</span>
        </div>
        <div className="mt-4 space-y-3">
          {requests.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">未処理のリクエストはありません。</div>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-bold text-lg">{request.fromProfile?.displayName}</div>
                    <div className="mt-1 text-[#888] text-sm">Lv.{request.fromProfile?.level} / {request.fromProfile?.friendCode}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleRequestAction(request.id, "accepted")}
                      className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 disabled:opacity-60"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      disabled={busyRequestId === request.id}
                      onClick={() => void handleRequestAction(request.id, "rejected")}
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
        <h2 className="text-white font-bold text-lg">フレンド一覧</h2>
        <div className="mt-4 space-y-3">
          {friends.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">まだフレンドがいません。プロフィール画面から仲間を探しましょう。</div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.uid}
                type="button"
                onClick={() => void handleSelectFriend(friend.uid)}
                className="flex w-full items-center justify-between bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-left transition"
              >
                <div>
                  <div className="text-white font-bold text-lg">{friend.displayName}</div>
                  <div className="mt-1 text-[#888] text-sm">ゴリラレベル Lv.{friend.level}</div>
                </div>
                <div className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2">閲覧する</div>
              </button>
            ))
          )}
        </div>
      </section>

      {selectedFriend ? (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[#888] text-sm">FRIEND GORILLA</div>
              <h2 className="mt-2 text-white font-bold text-lg">{selectedFriend.displayName}</h2>
              <p className="mt-2 text-[#ccc]">Lv.{selectedFriend.level} / 総XP {selectedFriend.xp.toLocaleString()} / トレ日数 {selectedFriend.trainingDays}日</p>
            </div>
            <img
              src={getCharacterGrowthImage("gorilla", Math.min(5, Math.max(1, selectedFriend.level >= 25 ? 5 : Math.ceil(selectedFriend.level / 5))))}
              alt={`${selectedFriend.displayName}のゴリラ`}
              className="h-24 w-24 rounded-3xl border border-[#F5A623]/30 bg-black/30 object-cover"
            />
          </div>

          <div className="mt-5 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
            <div className="text-white font-bold text-lg">最近のトレーニング記録</div>
            <div className="mt-3 space-y-3">
              {selectedFriend.trainingEntries.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#888] text-sm">まだ公開できるトレーニング記録がありません。</div>
              ) : (
                selectedFriend.trainingEntries.map((entry) => {
                  const likedByCurrentUser = Boolean(user && (likesByEntry[entry.id] ?? []).includes(user.uid))
                  const totalLikes = likesByEntry[entry.id]?.length ?? 0
                  const totalVolume = entry.sets.reduce((sum, set) => sum + set.weight * (set.reps ?? 0), 0)
                  return (
                    <article key={entry.id} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-bold text-lg">{entry.exerciseName}</div>
                          <div className="mt-1 text-[#888] text-sm">{entry.bodyPart} / {entry.sets.length}セット / 総ボリューム {totalVolume.toLocaleString()}</div>
                        </div>
                        <button
                          type="button"
                          disabled={busyLikeId === entry.id}
                          onClick={() => void handleToggleLike(entry.id)}
                          className={`rounded-lg px-4 py-2 text-sm transition ${likedByCurrentUser ? "bg-[#F5A623] text-black font-bold" : "border border-[#F5A623] text-[#F5A623]"} disabled:opacity-60`}
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