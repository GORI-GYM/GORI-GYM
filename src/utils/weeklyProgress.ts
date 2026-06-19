import type { User } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/firebase"
import type { TrainingEntry } from "@/sections/TrainingPage"

export const WEEKLY_GOAL_STORAGE_KEY = "weeklyGoal"
export const CURRENT_STREAK_STORAGE_KEY = "currentStreak"
export const WEEKLY_XP_STORAGE_KEY = "weeklyXP"
export const STREAK_FREEZE_AVAILABLE_STORAGE_KEY = "streakFreezeAvailable"
export const WEEK_START_DATE_STORAGE_KEY = "weekStartDate"

const DEFAULT_WEEKLY_GOAL = 3
const BASE_TRAINING_XP = 100
const WEEKLY_GOAL_BONUS_XP = 200

export interface WeeklyProgressState {
  weeklyGoal: number
  currentStreak: number
  weeklyXP: number
  streakFreezeAvailable: boolean
  weekStartDate: string
}

export interface WeeklyProgressSummary extends WeeklyProgressState {
  completedDays: number
  completedDateKeys: string[]
  goalReached: boolean
  xpMultiplier: number
}

function clampWeeklyGoal(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return DEFAULT_WEEKLY_GOAL
  return Math.min(7, Math.max(1, Math.round(numeric)))
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getWeekStartDate(date = new Date()) {
  const normalized = startOfDay(date)
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

function getEntryDateKey(entry: TrainingEntry) {
  if (entry.dateKey) return entry.dateKey

  const today = startOfDay(new Date())
  switch (entry.dateLabel) {
    case "today":
      return toDateKey(today)
    case "yesterday":
      return toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))
    case "daysAgo":
      return toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (entry.daysAgo ?? 0)))
    case "weekAgo":
      return toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7))
  }
}

export function getDefaultWeeklyProgressState(referenceDate = new Date()): WeeklyProgressState {
  return {
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    currentStreak: 0,
    weeklyXP: 0,
    streakFreezeAvailable: true,
    weekStartDate: toDateKey(getWeekStartDate(referenceDate)),
  }
}

export function getStoredWeeklyProgressState(referenceDate = new Date()): WeeklyProgressState {
  if (typeof window === "undefined") {
    return getDefaultWeeklyProgressState(referenceDate)
  }

  const fallback = getDefaultWeeklyProgressState(referenceDate)
  return {
    weeklyGoal: clampWeeklyGoal(window.localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY)),
    currentStreak: normalizeNumber(window.localStorage.getItem(CURRENT_STREAK_STORAGE_KEY), fallback.currentStreak),
    weeklyXP: normalizeNumber(window.localStorage.getItem(WEEKLY_XP_STORAGE_KEY), fallback.weeklyXP),
    streakFreezeAvailable: normalizeBoolean(window.localStorage.getItem(STREAK_FREEZE_AVAILABLE_STORAGE_KEY), fallback.streakFreezeAvailable),
    weekStartDate: window.localStorage.getItem(WEEK_START_DATE_STORAGE_KEY) || fallback.weekStartDate,
  }
}

export function persistWeeklyProgressState(state: WeeklyProgressState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(state.weeklyGoal))
  window.localStorage.setItem(CURRENT_STREAK_STORAGE_KEY, String(state.currentStreak))
  window.localStorage.setItem(WEEKLY_XP_STORAGE_KEY, String(state.weeklyXP))
  window.localStorage.setItem(STREAK_FREEZE_AVAILABLE_STORAGE_KEY, String(state.streakFreezeAvailable))
  window.localStorage.setItem(WEEK_START_DATE_STORAGE_KEY, state.weekStartDate)
}

export function getWeeklyCompletedDateKeys(entries: TrainingEntry[], weekStartDate: string) {
  const weekStart = parseDateKey(weekStartDate)
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  const completed = new Set<string>()

  entries.forEach((entry) => {
    const dateKey = getEntryDateKey(entry)
    const date = parseDateKey(dateKey)
    if (date >= weekStart && date <= weekEnd) {
      completed.add(dateKey)
    }
  })

  return Array.from(completed).sort((left, right) => left.localeCompare(right))
}

export function getStreakXpMultiplier(streak: number) {
  if (streak >= 8) return 2
  if (streak >= 4) return 1.5
  if (streak >= 2) return 1.2
  return 1
}

export function calculateWeeklyProgressSummary(entries: TrainingEntry[], state: WeeklyProgressState): WeeklyProgressSummary {
  const completedDateKeys = getWeeklyCompletedDateKeys(entries, state.weekStartDate)
  const completedDays = completedDateKeys.length
  return {
    ...state,
    completedDays,
    completedDateKeys,
    goalReached: completedDays >= state.weeklyGoal,
    xpMultiplier: getStreakXpMultiplier(state.currentStreak),
  }
}

export function calculateTrainingSessionXp(currentStreak: number) {
  return Math.round(BASE_TRAINING_XP * getStreakXpMultiplier(currentStreak))
}

export function calculateWeeklyGoalBonusXp(currentStreak: number) {
  return Math.round(WEEKLY_GOAL_BONUS_XP * getStreakXpMultiplier(currentStreak))
}

export function resolveWeeklyProgress(entries: TrainingEntry[], currentState: WeeklyProgressState, referenceDate = new Date()) {
  let nextState = { ...currentState }
  const currentWeekStartDate = toDateKey(getWeekStartDate(referenceDate))

  while (nextState.weekStartDate < currentWeekStartDate) {
    const completedDays = getWeeklyCompletedDateKeys(entries, nextState.weekStartDate).length
    const achieved = completedDays >= nextState.weeklyGoal

    if (achieved) {
      nextState = {
        ...nextState,
        currentStreak: nextState.currentStreak + 1,
        weeklyXP: 0,
        streakFreezeAvailable: true,
        weekStartDate: toDateKey(new Date(parseDateKey(nextState.weekStartDate).getFullYear(), parseDateKey(nextState.weekStartDate).getMonth(), parseDateKey(nextState.weekStartDate).getDate() + 7)),
      }
      continue
    }

    if (nextState.streakFreezeAvailable) {
      nextState = {
        ...nextState,
        weeklyXP: 0,
        streakFreezeAvailable: false,
        weekStartDate: toDateKey(new Date(parseDateKey(nextState.weekStartDate).getFullYear(), parseDateKey(nextState.weekStartDate).getMonth(), parseDateKey(nextState.weekStartDate).getDate() + 7)),
      }
      continue
    }

    nextState = {
      ...nextState,
      currentStreak: 0,
      weeklyXP: 0,
      streakFreezeAvailable: true,
      weekStartDate: toDateKey(new Date(parseDateKey(nextState.weekStartDate).getFullYear(), parseDateKey(nextState.weekStartDate).getMonth(), parseDateKey(nextState.weekStartDate).getDate() + 7)),
    }
  }

  if (nextState.weekStartDate !== currentWeekStartDate) {
    nextState.weekStartDate = currentWeekStartDate
    nextState.weeklyXP = 0
  }

  return nextState
}

export function applyTrainingCompletion(entries: TrainingEntry[], currentState: WeeklyProgressState, targetDateKey: string) {
  const resolvedState = resolveWeeklyProgress(entries, currentState, parseDateKey(targetDateKey))
  const completedDateKeys = getWeeklyCompletedDateKeys(entries, resolvedState.weekStartDate)
  const isCurrentWeekTraining = completedDateKeys.includes(targetDateKey)
  const sessionXp = isCurrentWeekTraining ? calculateTrainingSessionXp(resolvedState.currentStreak) : 0
  const completedDaysBefore = completedDateKeys.filter((dateKey) => dateKey !== targetDateKey).length
  const reachedGoalBefore = completedDaysBefore >= resolvedState.weeklyGoal
  const reachedGoalAfter = completedDateKeys.length >= resolvedState.weeklyGoal
  const bonusXp = !reachedGoalBefore && reachedGoalAfter ? calculateWeeklyGoalBonusXp(resolvedState.currentStreak) : 0

  return {
    nextState: {
      ...resolvedState,
      weeklyXP: resolvedState.weeklyXP + sessionXp + bonusXp,
    },
    sessionXp,
    bonusXp,
  }
}

export interface WeeklyProgressFirestorePayload extends WeeklyProgressState {}

export async function loadWeeklyProgressFromFirestore(user: User) {
  const snapshot = await getDoc(doc(db, "users", user.uid))
  const data = snapshot.data() as Partial<WeeklyProgressFirestorePayload> | undefined
  if (!data) return null

  return {
    weeklyGoal: clampWeeklyGoal(data.weeklyGoal),
    currentStreak: normalizeNumber(data.currentStreak, 0),
    weeklyXP: normalizeNumber(data.weeklyXP, 0),
    streakFreezeAvailable: normalizeBoolean(data.streakFreezeAvailable, true),
    weekStartDate: typeof data.weekStartDate === "string" ? data.weekStartDate : getDefaultWeeklyProgressState().weekStartDate,
  } satisfies WeeklyProgressState
}

export async function saveWeeklyProgressToFirestore(user: User, state: WeeklyProgressState) {
  await setDoc(doc(db, "users", user.uid), { ...state, updatedAt: serverTimestamp() }, { merge: true })
}