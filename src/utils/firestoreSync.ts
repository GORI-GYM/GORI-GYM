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
import type { DailyMissionDay, DailyMissionHistoryEntry, DailyMissionSettings } from "@/utils/dailyMission"
import { calculateGuildWarWinner, getWeekRange, isDateWithinRange, type GuildWarStatus } from "@/utils/guildWar"

export interface UserProfile {
  displayName: string
  level: number
  xp: number
  trainingDays: number
  gender?: "male" | "female" | "unspecified"
  lastTrainingAt?: string | null
  gorillaEmotion?: string
  gorillaEmotionUpdatedAt?: string
  gorillaSkippedDays?: number
  monthlyXP?: number
  monthlyLevel?: number
  monthResetDate?: string
  breakdown?: {
    trainingXP: number
    bonusXP: number
    multiplierApplied: number
  }
  friendCode?: string
  friends?: string[]
  weeklyGoal?: number
  currentStreak?: number
  weeklyXP?: number
  streakFreezeAvailable?: boolean
  weekStartDate?: string
  dailyMissionCurrentDay?: DailyMissionDay
  dailyMissionHistory?: DailyMissionHistoryEntry[]
  dailyMissionSettings?: DailyMissionSettings
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

export interface GuildMemberSummary extends PublicUserProfile {
  monthlyVolume: number
}

export interface Guild {
  id: string
  name: string
  leaderId: string
  members: string[]
  createdAt?: unknown
}

export interface GuildInvite {
  id: string
  from: string
  to: string
  guildId: string
  status: "pending" | "accepted" | "rejected"
  timestamp?: unknown
  guildName?: string
  fromProfile?: PublicUserProfile
}

export interface GuildMessage {
  id: string
  text: string
  senderId: string
  senderName: string
  timestamp?: unknown
}

export interface GuildDetails extends Guild {
  memberProfiles: GuildMemberSummary[]
  monthlyTotalVolume: number
  monthlyTrainingDays: number
}

export interface GuildWarMemberContribution extends PublicUserProfile {
  weeklyXP: number
}

export interface GuildWarRecord {
  id: string
  guild1Id: string
  guild2Id: string
  guild1TotalXP: number
  guild2TotalXP: number
  weekStart: string
  weekEnd: string
  status: GuildWarStatus
  winnerId?: string | null
  requestedBy: string
  createdAt?: unknown
  completedAt?: unknown
  guild1Name?: string
  guild2Name?: string
  guild1Members?: GuildWarMemberContribution[]
  guild2Members?: GuildWarMemberContribution[]
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

export interface GorillaBattleStats {
  punch: number
  speed: number
  defense: number
  stamina: number
  spirit: number
  total: number
}

export interface GorillaBattleRecord {
  id: string
  challenger: string
  opponent: string
  challengerStats: GorillaBattleStats
  opponentStats: GorillaBattleStats
  status: "pending" | "accepted" | "rejected" | "completed"
  result?: "challenger" | "opponent" | "draw"
  createdAt?: unknown
  completedAt?: unknown
  challengerProfile?: PublicUserProfile
  opponentProfile?: PublicUserProfile
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

function getGuildsCollectionRef() {
  return collection(db, "guilds")
}

function getGuildInvitesCollectionRef() {
  return collection(db, "guildInvites")
}

function getGuildMessagesCollectionRef(guildId: string) {
  return collection(db, "guilds", guildId, "messages")
}

function getGuildWarsCollectionRef() {
  return collection(db, "guildWars")
}

function getGorillaBattlesCollectionRef() {
  return collection(db, "gorillaBattles")
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
    gender: "unspecified",
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
    gender: payload.profile.gender ?? remoteProfile?.gender ?? "unspecified",
    lastTrainingAt: payload.profile.lastTrainingAt ?? remoteProfile?.lastTrainingAt ?? null,
    gorillaEmotion: payload.profile.gorillaEmotion ?? remoteProfile?.gorillaEmotion,
    gorillaEmotionUpdatedAt: payload.profile.gorillaEmotionUpdatedAt ?? remoteProfile?.gorillaEmotionUpdatedAt,
    gorillaSkippedDays: payload.profile.gorillaSkippedDays ?? remoteProfile?.gorillaSkippedDays,
    monthlyXP: Math.max(payload.profile.monthlyXP ?? 0, remoteProfile?.monthlyXP ?? 0),
    monthlyLevel: Math.max(payload.profile.monthlyLevel ?? 1, remoteProfile?.monthlyLevel ?? 1),
    monthResetDate: payload.profile.monthResetDate || remoteProfile?.monthResetDate,
    breakdown: payload.profile.breakdown ?? remoteProfile?.breakdown,
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
          gender: data?.gender ?? "unspecified",
          monthlyXP: data?.monthlyXP ?? 0,
          monthlyLevel: data?.monthlyLevel ?? 1,
          monthResetDate: data?.monthResetDate,
          breakdown: data?.breakdown,
          weeklyGoal: data?.weeklyGoal,
          currentStreak: data?.currentStreak,
          weeklyXP: data?.weeklyXP,
          streakFreezeAvailable: data?.streakFreezeAvailable,
          weekStartDate: data?.weekStartDate,
          friendCode: data?.friendCode,
          friends: data?.friends,
          dailyMissionCurrentDay: data?.dailyMissionCurrentDay,
          dailyMissionHistory: data?.dailyMissionHistory,
          dailyMissionSettings: data?.dailyMissionSettings,
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

export function subscribeToPendingGorillaBattleCount(uid: string, onCount: (count: number) => void, onError?: (error: FirestoreError) => void) {
  return onSnapshot(
    query(getGorillaBattlesCollectionRef(), orderBy("createdAt", "desc"), limit(100)),
    (snapshot) => {
      const count = snapshot.docs.reduce((total, docSnapshot) => {
        const data = docSnapshot.data() as Omit<GorillaBattleRecord, "id">
        return data.opponent === uid && data.status === "pending" ? total + 1 : total
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

export async function createGorillaBattle(
  challengerUid: string,
  opponentUid: string,
  challengerStats: GorillaBattleStats,
  opponentStats: GorillaBattleStats,
) {
  if (challengerUid === opponentUid) {
    throw new Error("自分自身には対決を申し込めません。")
  }

  const snapshot = await getDocs(query(getGorillaBattlesCollectionRef(), orderBy("createdAt", "desc"), limit(200)))
  const todayKey = new Date().toISOString().slice(0, 10)
  const duplicate = snapshot.docs.find((docSnapshot) => {
    const data = docSnapshot.data() as Omit<GorillaBattleRecord, "id">
    const createdAt = data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
      ? (data.createdAt as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
      : null

    return (
      createdAt === todayKey
      && ((data.challenger === challengerUid && data.opponent === opponentUid) || (data.challenger === opponentUid && data.opponent === challengerUid))
      && data.status !== "rejected"
    )
  })

  if (duplicate) {
    throw new Error("同じ相手への対決申し込みは1日1回までです。")
  }

  const battleRef = await addDoc(getGorillaBattlesCollectionRef(), {
    challenger: challengerUid,
    opponent: opponentUid,
    challengerStats,
    opponentStats,
    status: "pending",
    createdAt: serverTimestamp(),
  })

  return battleRef.id
}

export async function getIncomingGorillaBattles(uid: string) {
  const snapshot = await getDocs(query(getGorillaBattlesCollectionRef(), orderBy("createdAt", "desc"), limit(100)))
  const battles = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GorillaBattleRecord, "id">) }))
      .filter((battle) => battle.opponent === uid && battle.status === "pending")
      .map(async (battle) => ({
        ...battle,
        challengerProfile: await getPublicUserProfile(battle.challenger),
        opponentProfile: await getPublicUserProfile(battle.opponent),
      })),
  )

  return battles.filter((battle) => battle.challengerProfile && battle.opponentProfile) as GorillaBattleRecord[]
}

export async function respondToGorillaBattle(battleId: string, action: "accepted" | "rejected") {
  const battleRef = doc(db, "gorillaBattles", battleId)

  await runTransaction(db, async (transaction) => {
    const battleSnapshot = await transaction.get(battleRef)

    if (!battleSnapshot.exists()) {
      throw new Error("対決リクエストが見つかりません。")
    }

    const battle = battleSnapshot.data() as Omit<GorillaBattleRecord, "id">
    if (battle.status !== "pending") {
      throw new Error("この対決リクエストはすでに処理済みです。")
    }

    transaction.set(battleRef, { status: action }, { merge: true })
  })
}

export async function completeGorillaBattle(battleId: string, result: "challenger" | "opponent" | "draw") {
  await setDoc(doc(db, "gorillaBattles", battleId), {
    status: "completed",
    result,
    completedAt: serverTimestamp(),
  }, { merge: true })
}

export async function getGorillaBattleHistory(uid: string) {
  const snapshot = await getDocs(query(getGorillaBattlesCollectionRef(), orderBy("createdAt", "desc"), limit(100)))
  const battles = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GorillaBattleRecord, "id">) }))
      .filter((battle) => battle.challenger === uid || battle.opponent === uid)
      .map(async (battle) => ({
        ...battle,
        challengerProfile: await getPublicUserProfile(battle.challenger),
        opponentProfile: await getPublicUserProfile(battle.opponent),
      })),
  )

  return battles.filter((battle) => battle.challengerProfile && battle.opponentProfile) as GorillaBattleRecord[]
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

async function getUserGuild(uid: string) {
  const snapshot = await getDocs(getGuildsCollectionRef())
  const guild = snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<Guild, "id">) }))
    .find((entry) => Array.isArray(entry.members) && entry.members.includes(uid))

  return guild ?? null
}

async function getGuildById(guildId: string) {
  const snapshot = await getDoc(doc(db, "guilds", guildId))
  if (!snapshot.exists()) {
    return null
  }

  return { id: snapshot.id, ...(snapshot.data() as Omit<Guild, "id">) } satisfies Guild
}

function getTrainingEntryXP(entry: TrainingEntry) {
  return entry.sets.reduce((total, set) => total + Math.round(set.weight * (set.reps ?? 0) * 0.1), 0)
}

async function getWeeklyXpSummary(uid: string, weekStart: string, weekEnd: string) {
  const [profile, trainingSnapshot] = await Promise.all([
    getPublicUserProfile(uid),
    getDocs(getTrainingLogsCollectionRef(uid)),
  ])

  if (!profile) {
    return null
  }

  const weeklyEntries = trainingSnapshot.docs
    .map((snapshot) => snapshot.data() as TrainingEntry)
    .filter((entry) => {
      const dateKey = getEntryDateKey(entry)
      return isDateWithinRange(dateKey, weekStart, weekEnd)
    })

  return {
    ...profile,
    weeklyXP: weeklyEntries.reduce((sum, entry) => sum + getTrainingEntryXP(entry), 0),
  } satisfies GuildWarMemberContribution
}

async function buildGuildWarProgress(guildId: string, weekStart: string, weekEnd: string) {
  const guild = await getGuildById(guildId)
  if (!guild) {
    return null
  }

  const members = (await Promise.all(
    guild.members.map((memberUid) => getWeeklyXpSummary(memberUid, weekStart, weekEnd)),
  )).filter(Boolean) as GuildWarMemberContribution[]

  return {
    guild,
    totalXP: members.reduce((sum, member) => sum + member.weeklyXP, 0),
    members: members.sort((left, right) => right.weeklyXP - left.weeklyXP),
  }
}

async function getActiveGuildWarForGuild(guildId: string) {
  const snapshot = await getDocs(query(getGuildWarsCollectionRef(), orderBy("createdAt", "desc"), limit(100)))
  const war = snapshot.docs
    .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GuildWarRecord, "id">) }))
    .find((entry) => (entry.guild1Id === guildId || entry.guild2Id === guildId) && entry.status !== "completed")

  return war ?? null
}

async function getMonthlyTrainingSummary(uid: string) {
  const { startKey, endKey } = getCurrentMonthRange()
  const trainingSnapshot = await getDocs(getTrainingLogsCollectionRef(uid))
  const monthlyEntries = trainingSnapshot.docs
    .map((snapshot) => snapshot.data() as TrainingEntry)
    .filter((entry) => isWithinCurrentMonth(entry, startKey, endKey))

  return {
    totalVolume: monthlyEntries.reduce((sum, entry) => sum + getEntryVolume(entry), 0),
    trainingDays: new Set(monthlyEntries.map((entry) => getEntryDateKey(entry))).size,
  }
}

export async function createGuild(leaderUid: string, name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("ギルド名を入力してください。")
  }

  const existingGuild = await getUserGuild(leaderUid)
  if (existingGuild) {
    throw new Error("すでにギルドに所属しています。")
  }

  const guildRef = await addDoc(getGuildsCollectionRef(), {
    name: trimmedName,
    leaderId: leaderUid,
    members: [leaderUid],
    createdAt: serverTimestamp(),
  })

  return guildRef.id
}

export async function getGuildDetails(uid: string) {
  const guild = await getUserGuild(uid)
  if (!guild) {
    return null
  }

  const memberProfiles = await Promise.all(
    guild.members.map(async (memberUid) => {
      const [profile, monthlySummary] = await Promise.all([
        getPublicUserProfile(memberUid),
        getMonthlyTrainingSummary(memberUid),
      ])

      if (!profile) {
        return null
      }

      return {
        ...profile,
        monthlyVolume: monthlySummary.totalVolume,
      } satisfies GuildMemberSummary
    }),
  )

  const filteredProfiles = memberProfiles.filter(Boolean) as GuildMemberSummary[]
  const monthlyTotalVolume = filteredProfiles.reduce((sum, member) => sum + member.monthlyVolume, 0)
  const monthlyTrainingDays = guild.members.length === 0
    ? 0
    : (await Promise.all(guild.members.map((memberUid) => getMonthlyTrainingSummary(memberUid))))
      .reduce((sum, summary) => sum + summary.trainingDays, 0)

  return {
    ...guild,
    memberProfiles: filteredProfiles,
    monthlyTotalVolume,
    monthlyTrainingDays,
  } satisfies GuildDetails
}

export async function getGuildInviteCandidates(uid: string) {
  const [guild, friends] = await Promise.all([
    getUserGuild(uid),
    getFriends(uid),
  ])

  if (!guild) {
    throw new Error("ギルドが見つかりません。")
  }

  if (guild.leaderId !== uid) {
    throw new Error("招待できるのはリーダーのみです。")
  }

  const candidates = await Promise.all(
    friends.map(async (friend) => {
      const friendGuild = await getUserGuild(friend.uid)
      return friendGuild ? null : friend
    }),
  )

  return candidates.filter((candidate) => candidate && !guild.members.includes(candidate.uid)) as PublicUserProfile[]
}

export async function searchGuildsForWar(uid: string, searchTerm: string) {
  const guild = await getUserGuild(uid)
  if (!guild) {
    throw new Error("ギルドに所属していません。")
  }

  if (guild.leaderId !== uid) {
    throw new Error("対抗戦を申し込めるのはリーダーのみです。")
  }

  const activeWar = await getActiveGuildWarForGuild(guild.id)
  if (activeWar) {
    throw new Error("現在進行中の対抗戦があります。")
  }

  const normalizedTerm = searchTerm.trim().toLowerCase()
  const snapshot = await getDocs(getGuildsCollectionRef())

  const candidates = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<Guild, "id">) }))
      .filter((entry) => entry.id !== guild.id)
      .filter((entry) => normalizedTerm.length === 0 || entry.name.toLowerCase().includes(normalizedTerm))
      .map(async (entry) => {
        const activeOpponentWar = await getActiveGuildWarForGuild(entry.id)
        if (activeOpponentWar) {
          return null
        }

        const memberProfiles = (await Promise.all(entry.members.map((memberUid) => getPublicUserProfile(memberUid))))
          .filter(Boolean) as PublicUserProfile[]

        return {
          ...entry,
          memberProfiles,
        }
      }),
  )

  return candidates.filter(Boolean) as Array<Guild & { memberProfiles: PublicUserProfile[] }>
}

export async function createGuildWarRequest(requestedByUid: string, opponentGuildId: string) {
  const requesterGuild = await getUserGuild(requestedByUid)
  if (!requesterGuild) {
    throw new Error("ギルドに所属していません。")
  }

  if (requesterGuild.leaderId !== requestedByUid) {
    throw new Error("対抗戦を申し込めるのはリーダーのみです。")
  }

  const opponentGuild = await getGuildById(opponentGuildId)
  if (!opponentGuild) {
    throw new Error("対戦相手のギルドが見つかりません。")
  }

  const [requesterActiveWar, opponentActiveWar] = await Promise.all([
    getActiveGuildWarForGuild(requesterGuild.id),
    getActiveGuildWarForGuild(opponentGuildId),
  ])

  if (requesterActiveWar || opponentActiveWar) {
    throw new Error("どちらかのギルドがすでに対抗戦中です。")
  }

  const { weekStart, weekEnd } = getWeekRange()
  const warRef = await addDoc(getGuildWarsCollectionRef(), {
    guild1Id: requesterGuild.id,
    guild2Id: opponentGuild.id,
    guild1TotalXP: 0,
    guild2TotalXP: 0,
    weekStart,
    weekEnd,
    status: "active",
    winnerId: null,
    requestedBy: requestedByUid,
    createdAt: serverTimestamp(),
  })

  return warRef.id
}

export async function getGuildWarHistory(guildId: string) {
  const snapshot = await getDocs(query(getGuildWarsCollectionRef(), orderBy("createdAt", "desc"), limit(100)))
  const wars = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GuildWarRecord, "id">) }))
      .filter((entry) => entry.guild1Id === guildId || entry.guild2Id === guildId)
      .map(async (entry) => {
        const [guild1, guild2] = await Promise.all([getGuildById(entry.guild1Id), getGuildById(entry.guild2Id)])
        return {
          ...entry,
          guild1Name: guild1?.name ?? "UNKNOWN GUILD",
          guild2Name: guild2?.name ?? "UNKNOWN GUILD",
        } satisfies GuildWarRecord
      }),
  )

  return wars
}

export async function getGuildWarDetails(guildId: string) {
  const activeWar = await getActiveGuildWarForGuild(guildId)
  if (!activeWar) {
    return null
  }

  const [guild1Progress, guild2Progress] = await Promise.all([
    buildGuildWarProgress(activeWar.guild1Id, activeWar.weekStart, activeWar.weekEnd),
    buildGuildWarProgress(activeWar.guild2Id, activeWar.weekStart, activeWar.weekEnd),
  ])

  if (!guild1Progress || !guild2Progress) {
    return null
  }

  const nextWinnerId = activeWar.status === "completed"
    ? activeWar.winnerId ?? null
    : calculateGuildWarWinner(guild1Progress.guild.id, guild2Progress.guild.id, guild1Progress.totalXP, guild2Progress.totalXP)

  await setDoc(doc(db, "guildWars", activeWar.id), {
    guild1TotalXP: guild1Progress.totalXP,
    guild2TotalXP: guild2Progress.totalXP,
    winnerId: nextWinnerId,
  }, { merge: true })

  return {
    ...activeWar,
    guild1Name: guild1Progress.guild.name,
    guild2Name: guild2Progress.guild.name,
    guild1TotalXP: guild1Progress.totalXP,
    guild2TotalXP: guild2Progress.totalXP,
    guild1Members: guild1Progress.members,
    guild2Members: guild2Progress.members,
    winnerId: nextWinnerId,
  } satisfies GuildWarRecord
}

export function subscribeToGuildWar(
  guildId: string,
  onWar: (war: GuildWarRecord | null) => void,
  onError?: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(getGuildWarsCollectionRef(), orderBy("createdAt", "desc"), limit(100)),
    async (snapshot) => {
      const activeWar = snapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GuildWarRecord, "id">) }))
        .find((entry) => (entry.guild1Id === guildId || entry.guild2Id === guildId) && entry.status !== "completed")

      if (!activeWar) {
        onWar(null)
        return
      }

      const details = await getGuildWarDetails(guildId)
      onWar(details)
    },
    onError,
  )
}

export async function completeGuildWar(warId: string) {
  const warRef = doc(db, "guildWars", warId)

  await runTransaction(db, async (transaction) => {
    const warSnapshot = await transaction.get(warRef)
    if (!warSnapshot.exists()) {
      throw new Error("対抗戦が見つかりません。")
    }

    const war = { id: warSnapshot.id, ...(warSnapshot.data() as Omit<GuildWarRecord, "id">) } satisfies GuildWarRecord
    if (war.status === "completed") {
      return
    }

    const [guild1Progress, guild2Progress, guild1, guild2] = await Promise.all([
      buildGuildWarProgress(war.guild1Id, war.weekStart, war.weekEnd),
      buildGuildWarProgress(war.guild2Id, war.weekStart, war.weekEnd),
      getGuildById(war.guild1Id),
      getGuildById(war.guild2Id),
    ])

    if (!guild1Progress || !guild2Progress || !guild1 || !guild2) {
      throw new Error("対抗戦データの集計に失敗しました。")
    }

    const winnerId = calculateGuildWarWinner(guild1.id, guild2.id, guild1Progress.totalXP, guild2Progress.totalXP)
    const winnerBonus = 300
    const loserBonus = 100

    const applyReward = async (memberUid: string, bonusXp: number) => {
      const userRef = getUserDocRef(memberUid)
      const userSnapshot = await transaction.get(userRef)
      const data = userSnapshot.data() as FirestoreUserProfile | undefined
      const currentXp = data?.xp ?? 0
      const currentMonthlyXp = data?.monthlyXP ?? 0
      const currentBreakdown = data?.breakdown ?? { trainingXP: 0, bonusXP: 0, multiplierApplied: 1 }

      transaction.set(userRef, {
        xp: currentXp + bonusXp,
        monthlyXP: currentMonthlyXp + bonusXp,
        breakdown: {
          trainingXP: currentBreakdown.trainingXP,
          bonusXP: currentBreakdown.bonusXP + bonusXp,
          multiplierApplied: currentBreakdown.multiplierApplied,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }

    for (const memberUid of guild1.members) {
      await applyReward(memberUid, winnerId === guild1.id ? winnerBonus : loserBonus)
    }

    for (const memberUid of guild2.members) {
      await applyReward(memberUid, winnerId === guild2.id ? winnerBonus : loserBonus)
    }

    transaction.set(warRef, {
      guild1TotalXP: guild1Progress.totalXP,
      guild2TotalXP: guild2Progress.totalXP,
      status: "completed",
      winnerId,
      completedAt: serverTimestamp(),
    }, { merge: true })
  })
}

export async function sendGuildInvite(fromUid: string, toUid: string, guildId: string) {
  if (fromUid === toUid) {
    throw new Error("自分自身は招待できません。")
  }

  const [guildSnapshot, senderGuild, receiverGuild] = await Promise.all([
    getDoc(doc(db, "guilds", guildId)),
    getUserGuild(fromUid),
    getUserGuild(toUid),
  ])

  if (!guildSnapshot.exists()) {
    throw new Error("ギルドが見つかりません。")
  }

  const guild = { id: guildSnapshot.id, ...(guildSnapshot.data() as Omit<Guild, "id">) }
  if (!senderGuild || senderGuild.id !== guildId || guild.leaderId !== fromUid) {
    throw new Error("招待できるのは所属ギルドのリーダーのみです。")
  }

  if (guild.members.length >= 5) {
    throw new Error("ギルドは最大5人までです。")
  }

  if (receiverGuild) {
    throw new Error("相手はすでに別のギルドに所属しています。")
  }

  const existingInvites = await getDocs(query(getGuildInvitesCollectionRef(), orderBy("timestamp", "desc"), limit(100)))
  const duplicate = existingInvites.docs.find((snapshot) => {
    const data = snapshot.data() as Omit<GuildInvite, "id">
    return data.guildId === guildId && data.to === toUid && data.status === "pending"
  })

  if (duplicate) {
    throw new Error("このフレンドにはすでに招待を送っています。")
  }

  await addDoc(getGuildInvitesCollectionRef(), {
    from: fromUid,
    to: toUid,
    guildId,
    status: "pending",
    timestamp: serverTimestamp(),
  })
}

export async function getIncomingGuildInvites(uid: string) {
  const snapshot = await getDocs(query(getGuildInvitesCollectionRef(), orderBy("timestamp", "desc"), limit(100)))
  const invites = await Promise.all(
    snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<GuildInvite, "id">) }))
      .filter((invite) => invite.to === uid && invite.status === "pending")
      .map(async (invite) => {
        const [fromProfile, guildSnapshot] = await Promise.all([
          getPublicUserProfile(invite.from),
          getDoc(doc(db, "guilds", invite.guildId)),
        ])

        return {
          ...invite,
          fromProfile: fromProfile ?? undefined,
          guildName: guildSnapshot.exists() ? (guildSnapshot.data() as Guild).name : "UNKNOWN GUILD",
        } satisfies GuildInvite
      }),
  )

  return invites
}

export async function respondToGuildInvite(inviteId: string, action: "accepted" | "rejected") {
  const inviteRef = doc(db, "guildInvites", inviteId)

  await runTransaction(db, async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef)
    if (!inviteSnapshot.exists()) {
      throw new Error("ギルド招待が見つかりません。")
    }

    const invite = inviteSnapshot.data() as Omit<GuildInvite, "id">
    if (invite.status !== "pending") {
      throw new Error("この招待はすでに処理済みです。")
    }

    transaction.set(inviteRef, { status: action }, { merge: true })

    if (action === "accepted") {
      const guildRef = doc(db, "guilds", invite.guildId)
      const [guildSnapshot, userGuild] = await Promise.all([
        transaction.get(guildRef),
        getUserGuild(invite.to),
      ])

      if (userGuild) {
        throw new Error("すでに別のギルドに所属しています。")
      }

      if (!guildSnapshot.exists()) {
        throw new Error("ギルドが見つかりません。")
      }

      const guild = guildSnapshot.data() as Guild
      const members = Array.isArray(guild.members) ? guild.members : []
      if (members.length >= 5) {
        throw new Error("ギルドは満員です。")
      }

      transaction.set(guildRef, { members: arrayUnion(invite.to) }, { merge: true })
    }
  })
}

export function subscribeToGuildMessages(
  guildId: string,
  onMessages: (messages: GuildMessage[]) => void,
  onError?: (error: FirestoreError) => void,
) {
  return onSnapshot(
    query(getGuildMessagesCollectionRef(guildId), orderBy("timestamp", "asc"), limit(100)),
    (snapshot) => {
      onMessages(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<GuildMessage, "id">),
        })),
      )
    },
    onError,
  )
}

export async function sendGuildMessage(guildId: string, senderId: string, senderName: string, text: string) {
  const trimmedText = text.trim()
  if (!trimmedText) {
    throw new Error("メッセージを入力してください。")
  }

  await addDoc(getGuildMessagesCollectionRef(guildId), {
    text: trimmedText,
    senderId,
    senderName,
    timestamp: serverTimestamp(),
  })
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

export async function getUserTrainingEntries(uid: string) {
  const trainingSnapshot = await getDocs(query(getTrainingLogsCollectionRef(uid), orderBy("id", "desc"), limit(200)))
  return trainingSnapshot.docs.map((snapshot) => snapshot.data() as TrainingEntry)
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