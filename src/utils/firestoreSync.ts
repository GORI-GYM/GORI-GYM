import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAt,
  endAt,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/firebase"
import type { TrainingEntry } from "@/sections/TrainingPage"

export interface UserProfile {
  displayName: string
  level: number
  xp: number
  trainingDays: number
  friendCode?: string
  friends?: string[]
}

interface FirestoreTrainingLog extends TrainingEntry {
  updatedAt?: unknown
}

interface FirestoreUserProfile extends UserProfile {
  updatedAt?: unknown
}

export interface PublicUserProfile {
  uid: string
  displayName: string
  level: number
  xp: number
  trainingDays: number
  friendCode: string
}

export interface FriendRequest {
  id: string
  from: string
  to: string
  status: "pending" | "accepted" | "rejected"
  timestamp?: unknown
  fromProfile?: PublicUserProfile
}

export interface FriendProfile extends PublicUserProfile {
  trainingEntries: TrainingEntry[]
}

export interface RankingUserProfile extends PublicUserProfile {
  friends?: string[]
}

export interface RankingEntry {
  uid: string
  displayName: string
  friendCode: string
  level: number
  totalVolume: number
  trainingDays: number
  rank: number
}

export interface TrainingLike {
  id: string
  uid: string
  displayName: string
  timestamp?: unknown
}

export interface SyncPayload {
  trainingEntries: TrainingEntry[]
  profile: UserProfile
}

function getUserDocRef(uid: string) {
  return doc(db, "users", uid)
}

function getTrainingLogsCollectionRef(uid: string) {
  return collection(db, "users", uid, "trainingLogs")
}

function getFriendRequestsCollectionRef() {
  return collection(db, "friendRequests")
}

function getTrainingEntryIdentity(entry: TrainingEntry) {
  return JSON.stringify({
    dateLabel: entry.dateLabel,
    daysAgo: entry.daysAgo ?? null,
    dateKey: entry.dateKey ?? null,
    exerciseName: entry.exerciseName,
    bodyPart: entry.bodyPart,
    sets: entry.sets.map((set) => ({
      weight: set.weight,
      reps: set.reps ?? null,
      seconds: set.seconds ?? null,
      completed: set.completed ?? null,
      isPR: set.isPR ?? null,
    })),
  })
}

function dedupeTrainingEntries(entries: TrainingEntry[]) {
  const uniqueEntries = new Map<string, TrainingEntry>()

  entries.forEach((entry) => {
    uniqueEntries.set(getTrainingEntryIdentity(entry), entry)
  })

  return Array.from(uniqueEntries.values()).sort((left, right) => left.id - right.id)
}

function normalizeTrainingEntries(entries: TrainingEntry[]) {
  return dedupeTrainingEntries(entries).map((entry, index) => ({
    ...entry,
    id: index + 1,
  }))
}

function getTrainingDays(entries: TrainingEntry[]) {
  return new Set(
    entries.map((entry) => {
      if (entry.dateKey) {
        return entry.dateKey
      }

      const now = new Date()
      const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (entry.dateLabel) {
        case "today":
          return baseDate.toISOString().slice(0, 10)
        case "yesterday":
          return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1).toISOString().slice(0, 10)
        case "daysAgo":
          return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0)).toISOString().slice(0, 10)
        case "weekAgo":
          return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7).toISOString().slice(0, 10)
      }
    }),
  ).size
}

export function buildUserProfile(user: User, xp: number, level: number, trainingEntries: TrainingEntry[]): UserProfile {
  return {
    displayName: user.displayName?.trim() || "GORU GYM USER",
    level,
    xp,
    trainingDays: getTrainingDays(trainingEntries),
  }
}

export async function mergeLocalDataToFirestore(user: User, payload: SyncPayload) {
  const normalizedEntries = normalizeTrainingEntries(payload.trainingEntries)
  const userDocRef = getUserDocRef(user.uid)
  const trainingLogsRef = getTrainingLogsCollectionRef(user.uid)
  const [userSnapshot, trainingSnapshots] = await Promise.all([
    getDoc(userDocRef),
    getDocs(trainingLogsRef),
  ])

  const remoteEntries = trainingSnapshots.docs.map((snapshot) => snapshot.data() as FirestoreTrainingLog)
  const mergedEntries = normalizeTrainingEntries([...remoteEntries, ...normalizedEntries])
  const remoteProfile = userSnapshot.exists() ? userSnapshot.data() as FirestoreUserProfile : null
  const mergedProfile: UserProfile = {
    displayName: payload.profile.displayName || remoteProfile?.displayName || user.displayName?.trim() || "GORU GYM USER",
    level: Math.max(payload.profile.level, remoteProfile?.level ?? 0),
    xp: Math.max(payload.profile.xp, remoteProfile?.xp ?? 0),
    trainingDays: Math.max(payload.profile.trainingDays, remoteProfile?.trainingDays ?? 0, getTrainingDays(mergedEntries)),
  }

  const batch = writeBatch(db)
  batch.set(userDocRef, { ...mergedProfile, updatedAt: serverTimestamp() }, { merge: true })

  trainingSnapshots.docs.forEach((snapshot) => {
    batch.delete(snapshot.ref)
  })

  mergedEntries.forEach((entry) => {
    batch.set(doc(trainingLogsRef, String(entry.id)), { ...entry, updatedAt: serverTimestamp() })
  })

  await batch.commit()

  return {
    trainingEntries: mergedEntries,
    profile: mergedProfile,
  }
}

export function subscribeToUserTrainingData(
  uid: string,
  onData: (payload: SyncPayload) => void,
  onError?: (error: FirestoreError) => void,
) {
  let latestProfile: UserProfile | null = null
  let latestEntries: TrainingEntry[] = []

  const emit = () => {
    if (!latestProfile) {
      return
    }

    onData({
      profile: {
        ...latestProfile,
        trainingDays: Math.max(latestProfile.trainingDays, getTrainingDays(latestEntries)),
      },
      trainingEntries: normalizeTrainingEntries(latestEntries),
    })
  }

  const unsubscribers: Unsubscribe[] = [
    onSnapshot(
      getUserDocRef(uid),
      (snapshot) => {
        const data = snapshot.data() as FirestoreUserProfile | undefined
        latestProfile = {
          displayName: data?.displayName || "GORU GYM USER",
          level: data?.level ?? 1,
          xp: data?.xp ?? 0,
          trainingDays: data?.trainingDays ?? 0,
        }
        emit()
      },
      onError,
    ),
    onSnapshot(
      getTrainingLogsCollectionRef(uid),
      (snapshot) => {
        latestEntries = snapshot.docs.map((docSnapshot) => docSnapshot.data() as FirestoreTrainingLog)
        emit()
      },
      onError,
    ),
  ]

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe())
  }
}

export async function saveUserProfile(uid: string, profile: UserProfile) {
  await setDoc(getUserDocRef(uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true })
}

export async function saveTrainingEntries(uid: string, entries: TrainingEntry[]) {
  const normalizedEntries = normalizeTrainingEntries(entries)
  const trainingLogsRef = getTrainingLogsCollectionRef(uid)
  const existingSnapshots = await getDocs(trainingLogsRef)
  const batch = writeBatch(db)

  existingSnapshots.docs.forEach((snapshot) => {
    batch.delete(snapshot.ref)
  })

  normalizedEntries.forEach((entry) => {
    batch.set(doc(trainingLogsRef, String(entry.id)), { ...entry, updatedAt: serverTimestamp() })
  })

  await batch.commit()
}

function generateFriendCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

async function isFriendCodeAvailable(friendCode: string) {
  const snapshot = await getCountFromServer(
    query(collection(db, "users"), orderBy("friendCode"), startAt(friendCode), endAt(friendCode)),
  )
  return snapshot.data().count === 0
}

export async function ensureUserFriendCode(uid: string) {
  const userDocRef = getUserDocRef(uid)
  const snapshot = await getDoc(userDocRef)
  const existingCode = snapshot.data()?.friendCode

  if (typeof existingCode === "string" && existingCode.trim().length > 0) {
    return existingCode.trim().toUpperCase()
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const nextCode = generateFriendCode()
    const available = await isFriendCodeAvailable(nextCode)

    if (!available) {
      continue
    }

    await setDoc(userDocRef, { friendCode: nextCode, updatedAt: serverTimestamp() }, { merge: true })
    return nextCode
  }

  throw new Error("フレンドコードの生成に失敗しました。時間をおいて再度お試しください。")
}

function normalizePublicUserProfile(uid: string, data: FirestoreUserProfile | undefined): PublicUserProfile | null {
  const friendCode = data?.friendCode?.trim().toUpperCase()

  if (!friendCode) {
    return null
  }

  return {
    uid,
    displayName: data?.displayName || "GORU GYM USER",
    level: data?.level ?? 1,
    xp: data?.xp ?? 0,
    trainingDays: data?.trainingDays ?? 0,
    friendCode,
  }
}

async function getPublicUserProfile(uid: string) {
  const snapshot = await getDoc(getUserDocRef(uid))

  if (!snapshot.exists()) {
    return null
  }

  return normalizePublicUserProfile(uid, snapshot.data() as FirestoreUserProfile)
}

export async function searchUsers(searchTerm: string, currentUid?: string) {
  const normalizedTerm = searchTerm.trim()

  if (!normalizedTerm) {
    return [] as PublicUserProfile[]
  }

  const normalizedCode = normalizedTerm.toUpperCase()
  const usersRef = collection(db, "users")
  const snapshots = await Promise.all([
    getDocs(query(usersRef, orderBy("friendCode"), startAt(normalizedCode), endAt(normalizedCode), limit(10))),
    getDocs(query(usersRef, orderBy("displayName"), startAt(normalizedTerm), endAt(`${normalizedTerm}\uf8ff`), limit(10))),
  ])

  const mergedUsers = new Map<string, PublicUserProfile>()

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((docSnapshot) => {
      if (docSnapshot.id === currentUid) {
        return
      }

      const normalizedProfile = normalizePublicUserProfile(docSnapshot.id, docSnapshot.data() as FirestoreUserProfile)

      if (!normalizedProfile) {
        return
      }

      mergedUsers.set(docSnapshot.id, normalizedProfile)
    })
  })

  return Array.from(mergedUsers.values()).sort((left, right) => {
    if (left.friendCode === normalizedCode && right.friendCode !== normalizedCode) {
      return -1
    }

    if (right.friendCode === normalizedCode && left.friendCode !== normalizedCode) {
      return 1
    }

    return left.displayName.localeCompare(right.displayName, "ja")
  })
}

export async function sendFriendRequest(fromUid: string, toUid: string) {
  if (fromUid === toUid) {
    throw new Error("自分自身にはフレンドリクエストを送れません。")
  }

  const [fromSnapshot, toSnapshot] = await Promise.all([
    getDoc(getUserDocRef(fromUid)),
    getDoc(getUserDocRef(toUid)),
  ])

  if (!toSnapshot.exists()) {
    throw new Error("送信先ユーザーが見つかりません。")
  }

  const fromFriends = Array.isArray(fromSnapshot.data()?.friends) ? fromSnapshot.data()?.friends as string[] : []
  if (fromFriends.includes(toUid)) {
    throw new Error("すでにフレンドです。")
  }

  const existingRequests = await getDocs(query(getFriendRequestsCollectionRef(), orderBy("timestamp", "desc"), limit(100)))
  const duplicate = existingRequests.docs.find((snapshot) => {
    const data = snapshot.data() as Omit<FriendRequest, "id">
    return (
      ((data.from === fromUid && data.to === toUid) || (data.from === toUid && data.to === fromUid))
      && data.status === "pending"
    )
  })

  if (duplicate) {
    throw new Error("すでに保留中のフレンドリクエストがあります。")
  }

  await addDoc(getFriendRequestsCollectionRef(), {
    from: fromUid,
    to: toUid,
    status: "pending",
    timestamp: serverTimestamp(),
  })
}

export function subscribeToPendingFriendRequestCount(uid: string, onCount: (count: number) => void, onError?: (error: FirestoreError) => void) {
  return onSnapshot(
    query(getFriendRequestsCollectionRef(), orderBy("timestamp", "desc"), limit(100)),
    (snapshot) => {
      const count = snapshot.docs.reduce((total, docSnapshot) => {
        const data = docSnapshot.data() as Omit<FriendRequest, "id">
        return data.to === uid && data.status === "pending" ? total + 1 : total
      }, 0)
      onCount(count)
    },
    onError,
  )
}

export async function getIncomingFriendRequests(uid: string) {
  const snapshot = await getDocs(query(getFriendRequestsCollectionRef(), orderBy("timestamp", "desc"), limit(100)))
  const requests = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<FriendRequest, "id">) }))
      .filter((request) => request.to === uid && request.status === "pending")
      .map(async (request) => ({
        ...request,
        fromProfile: await getPublicUserProfile(request.from),
      })),
  )

  return requests.filter((request) => request.fromProfile) as FriendRequest[]
}

export async function respondToFriendRequest(requestId: string, action: "accepted" | "rejected") {
  const requestRef = doc(db, "friendRequests", requestId)

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef)

    if (!requestSnapshot.exists()) {
      throw new Error("フレンドリクエストが見つかりません。")
    }

    const request = requestSnapshot.data() as Omit<FriendRequest, "id">
    if (request.status !== "pending") {
      throw new Error("このリクエストはすでに処理済みです。")
    }

    transaction.set(requestRef, { status: action }, { merge: true })

    if (action === "accepted") {
      transaction.set(getUserDocRef(request.from), { friends: arrayUnion(request.to), updatedAt: serverTimestamp() }, { merge: true })
      transaction.set(getUserDocRef(request.to), { friends: arrayUnion(request.from), updatedAt: serverTimestamp() }, { merge: true })
    }
  })
}

export async function getFriends(uid: string) {
  const userSnapshot = await getDoc(getUserDocRef(uid))
  const friendIds = Array.isArray(userSnapshot.data()?.friends) ? userSnapshot.data()?.friends as string[] : []
  const profiles = await Promise.all(friendIds.map((friendUid) => getPublicUserProfile(friendUid)))
  return profiles.filter(Boolean) as PublicUserProfile[]
}

function getEntryDateKey(entry: TrainingEntry) {
  if (entry.dateKey) {
    return entry.dateKey
  }

  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (entry.dateLabel) {
    case "today":
      return baseDate.toISOString().slice(0, 10)
    case "yesterday":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1).toISOString().slice(0, 10)
    case "daysAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0)).toISOString().slice(0, 10)
    case "weekAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7).toISOString().slice(0, 10)
  }
}

function getEntryVolume(entry: TrainingEntry) {
  return entry.sets.reduce((entryTotal, set) => entryTotal + set.weight * (set.reps ?? 0), 0)
}

function isWithinCurrentMonth(entry: TrainingEntry, startKey: string, endKey: string) {
  const dateKey = getEntryDateKey(entry)
  return dateKey >= startKey && dateKey < endKey
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return {
    startKey: start.toISOString().slice(0, 10),
    endKey: end.toISOString().slice(0, 10),
  }
}

export async function getMonthlyRanking(friendOnlyForUid?: string) {
  const usersSnapshot = await getDocs(collection(db, "users"))
  const rankingProfiles = usersSnapshot.docs
    .map((snapshot) => {
      const data = snapshot.data() as FirestoreUserProfile
      const friendCode = data.friendCode?.trim().toUpperCase()
      if (!friendCode) {
        return null
      }

      return {
        uid: snapshot.id,
        displayName: data.displayName || "GORU GYM USER",
        level: data.level ?? 1,
        xp: data.xp ?? 0,
        trainingDays: data.trainingDays ?? 0,
        friendCode,
        friends: Array.isArray(data.friends) ? data.friends as string[] : [],
      } satisfies RankingUserProfile
    })
    .filter(Boolean) as RankingUserProfile[]

  const targetUids = friendOnlyForUid
    ? new Set([friendOnlyForUid, ...(rankingProfiles.find((profile) => profile.uid === friendOnlyForUid)?.friends ?? [])])
    : null

  const filteredProfiles = targetUids
    ? rankingProfiles.filter((profile) => targetUids.has(profile.uid))
    : rankingProfiles

  const { startKey, endKey } = getCurrentMonthRange()
  const rankingEntries = await Promise.all(
    filteredProfiles.map(async (profile) => {
      const trainingSnapshot = await getDocs(getTrainingLogsCollectionRef(profile.uid))
      const monthlyEntries = trainingSnapshot.docs
        .map((snapshot) => snapshot.data() as TrainingEntry)
        .filter((entry) => isWithinCurrentMonth(entry, startKey, endKey))

      return {
        uid: profile.uid,
        displayName: profile.displayName,
        friendCode: profile.friendCode,
        level: profile.level,
        totalVolume: monthlyEntries.reduce((sum, entry) => sum + getEntryVolume(entry), 0),
        trainingDays: new Set(monthlyEntries.map((entry) => getEntryDateKey(entry))).size,
        rank: 0,
      } satisfies RankingEntry
    }),
  )

  const sortAndRank = (entries: RankingEntry[], metric: "totalVolume" | "trainingDays") => {
    let previousValue: number | null = null
    let previousRank = 0

    return [...entries]
      .sort((left, right) => {
        if (right[metric] !== left[metric]) {
          return right[metric] - left[metric]
        }
        if (right.totalVolume !== left.totalVolume) {
          return right.totalVolume - left.totalVolume
        }
        if (right.trainingDays !== left.trainingDays) {
          return right.trainingDays - left.trainingDays
        }
        return left.displayName.localeCompare(right.displayName, "ja")
      })
      .map((entry, index) => {
        const currentValue = entry[metric]
        const rank = previousValue === currentValue ? previousRank : index + 1
        previousValue = currentValue
        previousRank = rank
        return { ...entry, rank }
      })
    }

  return {
    overallVolume: sortAndRank(rankingEntries, "totalVolume"),
    overallFrequency: sortAndRank(rankingEntries, "trainingDays"),
  }
}

export async function getFriendProfile(friendUid: string) {
  const [profile, trainingSnapshot] = await Promise.all([
    getPublicUserProfile(friendUid),
    getDocs(query(getTrainingLogsCollectionRef(friendUid), orderBy("id", "desc"), limit(20))),
  ])

  if (!profile) {
    throw new Error("フレンド情報の取得に失敗しました。")
  }

  return {
    ...profile,
    trainingEntries: trainingSnapshot.docs.map((snapshot) => snapshot.data() as TrainingEntry),
  } satisfies FriendProfile
}

export async function toggleTrainingLike(ownerUid: string, trainingEntryId: number, currentUser: Pick<PublicUserProfile, "uid" | "displayName">) {
  const likeRef = doc(db, "users", ownerUid, "trainingLogs", String(trainingEntryId), "likes", currentUser.uid)
  const snapshot = await getDoc(likeRef)

  if (snapshot.exists()) {
    const batch = writeBatch(db)
    batch.delete(likeRef)
    await batch.commit()
    return false
  }

  await setDoc(likeRef, {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    timestamp: serverTimestamp(),
  })
  return true
}

export async function getTrainingLikes(ownerUid: string, trainingEntryId: number) {
  const snapshot = await getDocs(collection(db, "users", ownerUid, "trainingLogs", String(trainingEntryId), "likes"))
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<TrainingLike, "id">) }))
}