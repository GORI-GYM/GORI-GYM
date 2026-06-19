import type { User } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/firebase"
import type { TrainingEntry } from "@/sections/TrainingPage"

export const MONTHLY_XP_STORAGE_KEY = "gym-quest-monthly-xp"
export const MONTHLY_LEVEL_STORAGE_KEY = "gym-quest-monthly-level"
export const MONTHLY_RESET_DATE_STORAGE_KEY = "gym-quest-monthly-reset-date"
export const MONTHLY_XP_BREAKDOWN_STORAGE_KEY = "gym-quest-monthly-xp-breakdown"

export const MONTHLY_LEVEL_THRESHOLDS = [
  0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100,
  5000, 6000, 7100, 8300, 9600, 11000, 12500, 14100, 15800, 17600,
] as const

export const MONTHLY_MAX_LEVEL = 20

export interface MonthlyXpBreakdown {
  trainingXP: number
  bonusXP: number
  multiplierApplied: number
}

export interface MonthlyCharacterProgressState {
  monthlyXP: number
  monthlyLevel: number
  monthResetDate: string
  breakdown: MonthlyXpBreakdown
}

export interface MonthlyCharacterProgressSummary extends MonthlyCharacterProgressState {
  currentLevelXpFloor: number
  nextLevelXp: number | null
  xpIntoLevel: number
  xpForNextLevel: number
  xpRemainingToNextLevel: number
  progressPercent: number
}

export interface MonthlyCharacterProgressFirestorePayload extends MonthlyCharacterProgressState {}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function getEntryDate(entry: TrainingEntry) {
  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (entry.dateLabel) {
    case "today":
      return baseDate
    case "yesterday":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1)
    case "daysAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0))
    case "weekAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7)
  }
}

export function getDefaultMonthlyCharacterProgressState(referenceDate = new Date()): MonthlyCharacterProgressState {
  return {
    monthlyXP: 0,
    monthlyLevel: 1,
    monthResetDate: getMonthKey(referenceDate),
    breakdown: {
      trainingXP: 0,
      bonusXP: 0,
      multiplierApplied: 1,
    },
  }
}

export function getMonthlyLevelFromXp(monthlyXP: number) {
  let level = 1
  for (let index = 0; index < MONTHLY_LEVEL_THRESHOLDS.length; index += 1) {
    if (monthlyXP >= MONTHLY_LEVEL_THRESHOLDS[index]) {
      level = index + 1
    }
  }
  return Math.min(MONTHLY_MAX_LEVEL, level)
}

export function getStoredMonthlyCharacterProgressState(referenceDate = new Date()): MonthlyCharacterProgressState {
  if (typeof window === "undefined") {
    return getDefaultMonthlyCharacterProgressState(referenceDate)
  }

  const fallback = getDefaultMonthlyCharacterProgressState(referenceDate)
  const storedResetDate = window.localStorage.getItem(MONTHLY_RESET_DATE_STORAGE_KEY) || fallback.monthResetDate
  const storedBreakdown = window.localStorage.getItem(MONTHLY_XP_BREAKDOWN_STORAGE_KEY)

  let breakdown = fallback.breakdown
  if (storedBreakdown) {
    try {
      const parsed = JSON.parse(storedBreakdown) as Partial<MonthlyXpBreakdown>
      breakdown = {
        trainingXP: normalizeNumber(parsed.trainingXP, 0),
        bonusXP: normalizeNumber(parsed.bonusXP, 0),
        multiplierApplied: normalizeNumber(parsed.multiplierApplied, 1),
      }
    } catch {
      breakdown = fallback.breakdown
    }
  }

  const monthlyXP = normalizeNumber(window.localStorage.getItem(MONTHLY_XP_STORAGE_KEY), fallback.monthlyXP)
  const monthlyLevel = normalizeNumber(window.localStorage.getItem(MONTHLY_LEVEL_STORAGE_KEY), getMonthlyLevelFromXp(monthlyXP))

  return resolveMonthlyCharacterProgress({
    monthlyXP,
    monthlyLevel,
    monthResetDate: storedResetDate,
    breakdown,
  }, referenceDate)
}

export function persistMonthlyCharacterProgressState(state: MonthlyCharacterProgressState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(MONTHLY_XP_STORAGE_KEY, String(state.monthlyXP))
  window.localStorage.setItem(MONTHLY_LEVEL_STORAGE_KEY, String(state.monthlyLevel))
  window.localStorage.setItem(MONTHLY_RESET_DATE_STORAGE_KEY, state.monthResetDate)
  window.localStorage.setItem(MONTHLY_XP_BREAKDOWN_STORAGE_KEY, JSON.stringify(state.breakdown))
}

export function resolveMonthlyCharacterProgress(state: MonthlyCharacterProgressState, referenceDate = new Date()) {
  const currentMonthKey = getMonthKey(referenceDate)
  if (state.monthResetDate !== currentMonthKey) {
    return getDefaultMonthlyCharacterProgressState(referenceDate)
  }

  return {
    ...state,
    monthlyLevel: getMonthlyLevelFromXp(state.monthlyXP),
  }
}

export function calculateMonthlyCharacterProgressSummary(state: MonthlyCharacterProgressState): MonthlyCharacterProgressSummary {
  const monthlyLevel = getMonthlyLevelFromXp(state.monthlyXP)
  const currentLevelXpFloor = MONTHLY_LEVEL_THRESHOLDS[monthlyLevel - 1] ?? 0
  const nextLevelXp = monthlyLevel >= MONTHLY_MAX_LEVEL ? null : (MONTHLY_LEVEL_THRESHOLDS[monthlyLevel] ?? null)
  const xpIntoLevel = state.monthlyXP - currentLevelXpFloor
  const xpForNextLevel = nextLevelXp === null ? 0 : nextLevelXp - currentLevelXpFloor
  const xpRemainingToNextLevel = nextLevelXp === null ? 0 : Math.max(0, nextLevelXp - state.monthlyXP)
  const progressPercent = nextLevelXp === null ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100))

  return {
    ...state,
    monthlyLevel,
    currentLevelXpFloor,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    xpRemainingToNextLevel,
    progressPercent,
  }
}

export function applyMonthlyTrainingCompletion(currentState: MonthlyCharacterProgressState, sessionXp: number, bonusXp: number, xpMultiplier: number, referenceDate = new Date()) {
  const resolvedState = resolveMonthlyCharacterProgress(currentState, referenceDate)
  const nextMonthlyXP = resolvedState.monthlyXP + sessionXp + bonusXp

  return {
    nextState: {
      monthlyXP: nextMonthlyXP,
      monthlyLevel: getMonthlyLevelFromXp(nextMonthlyXP),
      monthResetDate: getMonthKey(referenceDate),
      breakdown: {
        trainingXP: resolvedState.breakdown.trainingXP + sessionXp,
        bonusXP: resolvedState.breakdown.bonusXP + bonusXp,
        multiplierApplied: xpMultiplier,
      },
    } satisfies MonthlyCharacterProgressState,
  }
}

export function getMonthlyCharacterHistory(entries: TrainingEntry[]) {
  const formatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" })
  const monthlyMap = entries.reduce<Map<string, { xp: number; workoutCount: number; date: Date; trainingDays: Set<string> }>>((map, entry) => {
    const entryDate = getEntryDate(entry)
    const monthKey = getMonthKey(entryDate)
    const current = map.get(monthKey) ?? { xp: 0, workoutCount: 0, date: new Date(entryDate.getFullYear(), entryDate.getMonth(), 1), trainingDays: new Set<string>() }
    current.xp += Math.round(entry.sets.reduce((total, set) => total + set.weight * (set.reps ?? 0), 0) * 0.1)
    current.workoutCount += 1
    current.trainingDays.add(entryDate.toISOString().slice(0, 10))
    map.set(monthKey, current)
    return map
  }, new Map())

  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, value]) => ({
      monthKey,
      monthLabel: formatter.format(value.date),
      level: getMonthlyLevelFromXp(value.xp),
      xp: value.xp,
      workoutCount: value.workoutCount,
      trainingDays: value.trainingDays.size,
    }))
}

export async function loadMonthlyCharacterProgressFromFirestore(user: User) {
  const snapshot = await getDoc(doc(db, "users", user.uid))
  const data = snapshot.data() as Partial<MonthlyCharacterProgressFirestorePayload> | undefined
  if (!data) return null

  return resolveMonthlyCharacterProgress({
    monthlyXP: normalizeNumber(data.monthlyXP, 0),
    monthlyLevel: normalizeNumber(data.monthlyLevel, 1),
    monthResetDate: typeof data.monthResetDate === "string" ? data.monthResetDate : getDefaultMonthlyCharacterProgressState().monthResetDate,
    breakdown: {
      trainingXP: normalizeNumber(data.breakdown?.trainingXP, 0),
      bonusXP: normalizeNumber(data.breakdown?.bonusXP, 0),
      multiplierApplied: normalizeNumber(data.breakdown?.multiplierApplied, 1),
    },
  })
}

export async function saveMonthlyCharacterProgressToFirestore(user: User, state: MonthlyCharacterProgressState) {
  await setDoc(doc(db, "users", user.uid), { ...state, updatedAt: serverTimestamp() }, { merge: true })
}