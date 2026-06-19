import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
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
}

interface FirestoreTrainingLog extends TrainingEntry {
  updatedAt?: unknown
}

interface FirestoreUserProfile extends UserProfile {
  updatedAt?: unknown
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