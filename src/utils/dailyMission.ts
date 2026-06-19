import type { User } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/firebase"
import type { TrainingEntry } from "@/sections/TrainingPage"
import type { WeeklyProgressState } from "@/utils/weeklyProgress"
import type { MonthlyCharacterProgressState } from "@/utils/monthlyCharacterProgress"
import { getBeginnerWeightLabel, getExerciseGuideEntry, normalizeExerciseName, type ProfileGender } from "@/utils/exerciseDatabase"

export const DAILY_MISSION_STORAGE_KEY = "gym-quest-daily-missions"
export const DAILY_MISSION_HISTORY_STORAGE_KEY = "gym-quest-daily-mission-history"
export const DAILY_MISSION_SETTINGS_STORAGE_KEY = "gym-quest-daily-mission-settings"
export const DAILY_MISSION_XP = 100

export type MissionBodyPart = "chest" | "back" | "legs" | "shoulders" | "biceps" | "triceps" | "arms"
export type TrainingBodyPart = "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "LEGS"

export interface MissionExerciseOption {
  name: string
  bodyPart: MissionBodyPart
  trainingBodyPart: TrainingBodyPart
}

export interface DailyMission {
  id: string
  dateKey: string
  bodyPart: MissionBodyPart
  exerciseName: string
  trainingBodyPart: TrainingBodyPart
  targetSets: number
  recommendedWeight: string
  completed: boolean
  completedAt: string | null
  source: "preset" | "custom"
}

export interface DailyMissionDay {
  dateKey: string
  isRestDay: boolean
  rotationBodyPart: MissionBodyPart
  missions: DailyMission[]
  completedAll: boolean
}

export interface DailyMissionHistoryEntry {
  dateKey: string
  isRestDay: boolean
  completedMissionIds: string[]
  missionCount: number
  completedAll: boolean
}

export interface DailyMissionSettings {
  customExercises: MissionExerciseOption[]
  selectedExercisesByBodyPart: Partial<Record<MissionBodyPart, string[]>>
}

export interface DailyMissionFirestorePayload {
  currentDay: DailyMissionDay
  history: DailyMissionHistoryEntry[]
  settings: DailyMissionSettings
}

const BODY_PART_ROTATION: MissionBodyPart[] = ["chest", "back", "legs", "shoulders", "arms"]

const BODY_PART_LABELS: Record<MissionBodyPart, string> = {
  chest: "胸",
  back: "背中",
  legs: "脚",
  shoulders: "肩",
  biceps: "上腕二頭筋",
  triceps: "上腕三頭筋",
  arms: "腕",
}

const ARM_PRESET_EXERCISES: MissionExerciseOption[] = [
  { name: "アームカール", bodyPart: "arms", trainingBodyPart: "BICEPS" },
  { name: "ハンマーカール", bodyPart: "arms", trainingBodyPart: "BICEPS" },
  { name: "プリーチャーカール", bodyPart: "arms", trainingBodyPart: "BICEPS" },
  { name: "コンセントレーションカール", bodyPart: "arms", trainingBodyPart: "BICEPS" },
  { name: "トライセプスエクステンション", bodyPart: "arms", trainingBodyPart: "TRICEPS" },
  { name: "スカルクラッシャー", bodyPart: "arms", trainingBodyPart: "TRICEPS" },
  { name: "ケーブルプレスダウン", bodyPart: "arms", trainingBodyPart: "TRICEPS" },
  { name: "ディップス", bodyPart: "arms", trainingBodyPart: "TRICEPS" },
]

const PRESET_EXERCISES: Record<MissionBodyPart, MissionExerciseOption[]> = {
  chest: [
    { name: "ベンチプレス", bodyPart: "chest", trainingBodyPart: "CHEST" },
    { name: "ダンベルフライ", bodyPart: "chest", trainingBodyPart: "CHEST" },
    { name: "チェストプレス", bodyPart: "chest", trainingBodyPart: "CHEST" },
  ],
  back: [
    { name: "ラットプルダウン", bodyPart: "back", trainingBodyPart: "BACK" },
    { name: "シーテッドロウ", bodyPart: "back", trainingBodyPart: "BACK" },
    { name: "デッドリフト", bodyPart: "back", trainingBodyPart: "BACK" },
  ],
  legs: [
    { name: "スクワット", bodyPart: "legs", trainingBodyPart: "LEGS" },
    { name: "レッグプレス", bodyPart: "legs", trainingBodyPart: "LEGS" },
    { name: "レッグカール", bodyPart: "legs", trainingBodyPart: "LEGS" },
  ],
  shoulders: [
    { name: "ショルダープレス", bodyPart: "shoulders", trainingBodyPart: "SHOULDERS" },
    { name: "サイドレイズ", bodyPart: "shoulders", trainingBodyPart: "SHOULDERS" },
    { name: "フロントレイズ", bodyPart: "shoulders", trainingBodyPart: "SHOULDERS" },
  ],
  biceps: ARM_PRESET_EXERCISES.filter((exercise) => exercise.trainingBodyPart === "BICEPS").map((exercise) => ({ ...exercise, bodyPart: "biceps" })),
  triceps: ARM_PRESET_EXERCISES.filter((exercise) => exercise.trainingBodyPart === "TRICEPS").map((exercise) => ({ ...exercise, bodyPart: "triceps" })),
  arms: ARM_PRESET_EXERCISES,
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getEntryDateKey(entry: TrainingEntry) {
  if (entry.dateKey) return entry.dateKey
  const today = new Date()
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  switch (entry.dateLabel) {
    case "today":
      return toDateKey(baseDate)
    case "yesterday":
      return toDateKey(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1))
    case "daysAgo":
      return toDateKey(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0)))
    case "weekAgo":
      return toDateKey(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7))
  }
}

function getMissionCountForGoal(weeklyGoal: number) {
  if (weeklyGoal <= 2) return 1
  if (weeklyGoal <= 4) return 2
  return 3
}

function getTrainingDaysForGoal(weeklyGoal: number) {
  const clampedGoal = Math.min(7, Math.max(1, Math.round(weeklyGoal)))
  const indexes = new Set<number>()
  if (clampedGoal >= 7) {
    return new Set([0, 1, 2, 3, 4, 5, 6])
  }
  for (let index = 0; index < clampedGoal; index += 1) {
    const dayIndex = Math.floor((index * 7) / clampedGoal)
    indexes.add(dayIndex)
  }
  return indexes
}

function getRotationBodyPart(date: Date) {
  const dayIndex = (date.getDay() + 6) % 7
  return BODY_PART_ROTATION[dayIndex % BODY_PART_ROTATION.length]
}

export function getBodyPartLabel(bodyPart: MissionBodyPart) {
  return BODY_PART_LABELS[bodyPart]
}

export function getDefaultDailyMissionSettings(): DailyMissionSettings {
  return {
    customExercises: [],
    selectedExercisesByBodyPart: {},
  }
}

export function getStoredDailyMissionSettings(): DailyMissionSettings {
  if (typeof window === "undefined") return getDefaultDailyMissionSettings()
  const raw = window.localStorage.getItem(DAILY_MISSION_SETTINGS_STORAGE_KEY)
  if (!raw) return getDefaultDailyMissionSettings()
  try {
    const parsed = JSON.parse(raw) as Partial<DailyMissionSettings>
    return {
      customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises.filter((item): item is MissionExerciseOption => typeof item?.name === "string" && typeof item?.bodyPart === "string" && typeof item?.trainingBodyPart === "string") : [],
      selectedExercisesByBodyPart: parsed.selectedExercisesByBodyPart && typeof parsed.selectedExercisesByBodyPart === "object" ? parsed.selectedExercisesByBodyPart : {},
    }
  } catch {
    return getDefaultDailyMissionSettings()
  }
}

export function persistDailyMissionSettings(settings: DailyMissionSettings) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DAILY_MISSION_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function getMissionExerciseOptions(settings: DailyMissionSettings, bodyPart: MissionBodyPart) {
  return [...PRESET_EXERCISES[bodyPart], ...settings.customExercises.filter((exercise) => exercise.bodyPart === bodyPart)]
}

function getSelectedExercises(settings: DailyMissionSettings, bodyPart: MissionBodyPart) {
  const selectedNames = settings.selectedExercisesByBodyPart[bodyPart]
  const options = getMissionExerciseOptions(settings, bodyPart)
  if (!selectedNames || selectedNames.length === 0) {
    return options
  }
  const selected = options.filter((option) => selectedNames.includes(option.name))
  return selected.length > 0 ? selected : options
}

function getRecommendedWeight(entries: TrainingEntry[], exerciseName: string, gender: ProfileGender = "male") {
  const normalized = normalizeExerciseName(exerciseName)
  const matchedEntries = entries.filter((entry) => normalizeExerciseName(entry.exerciseName) === normalized)
  if (matchedEntries.length === 0) {
    return getBeginnerWeightLabel(exerciseName, gender) ?? "自分が10回ギリギリできる重さ"
  }
  const latestEntry = matchedEntries[matchedEntries.length - 1]
  const weights = latestEntry.sets.map((set) => normalizeNumber(set.weight, 0)).filter((weight) => weight > 0)
  if (weights.length === 0) {
    return getBeginnerWeightLabel(exerciseName, gender) ?? "自分が10回ギリギリできる重さ"
  }
  const averageWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length
  const roundedWeight = averageWeight % 1 === 0 ? averageWeight.toFixed(0) : averageWeight.toFixed(1)
  const exercise = getExerciseGuideEntry(exerciseName)
  const step = exercise?.equipment === "バーベル" ? 2.5 : 2
  const challengeWeight = (Math.round((averageWeight + step) * 10) / 10).toFixed(Number.isInteger(averageWeight + step) ? 0 : 1)
  return `前回 ${roundedWeight}kg / ${challengeWeight}kgに挑戦！`
}

function createMission(dateKey: string, bodyPart: MissionBodyPart, exercise: MissionExerciseOption, entries: TrainingEntry[], source: "preset" | "custom", gender: ProfileGender): DailyMission {
  return {
    id: `${dateKey}-${bodyPart}-${normalizeExerciseName(exercise.name)}`,
    dateKey,
    bodyPart,
    exerciseName: exercise.name,
    trainingBodyPart: exercise.trainingBodyPart,
    targetSets: 3,
    recommendedWeight: getRecommendedWeight(entries, exercise.name, gender),
    completed: false,
    completedAt: null,
    source,
  }
}

function trimHistory(history: DailyMissionHistoryEntry[]) {
  return history
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
    .slice(0, 7)
}

export function getDefaultDailyMissionDay(referenceDate = new Date()): DailyMissionDay {
  return {
    dateKey: toDateKey(referenceDate),
    isRestDay: false,
    rotationBodyPart: getRotationBodyPart(referenceDate),
    missions: [],
    completedAll: false,
  }
}

export function getStoredDailyMissionDay(referenceDate = new Date()): DailyMissionDay {
  if (typeof window === "undefined") return getDefaultDailyMissionDay(referenceDate)
  const raw = window.localStorage.getItem(DAILY_MISSION_STORAGE_KEY)
  if (!raw) return getDefaultDailyMissionDay(referenceDate)
  try {
    const parsed = JSON.parse(raw) as Partial<DailyMissionDay>
    return {
      dateKey: typeof parsed.dateKey === "string" ? parsed.dateKey : toDateKey(referenceDate),
      isRestDay: Boolean(parsed.isRestDay),
      rotationBodyPart: BODY_PART_ROTATION.includes(parsed.rotationBodyPart as MissionBodyPart) ? parsed.rotationBodyPart as MissionBodyPart : getRotationBodyPart(referenceDate),
      missions: Array.isArray(parsed.missions) ? parsed.missions as DailyMission[] : [],
      completedAll: Boolean(parsed.completedAll),
    }
  } catch {
    return getDefaultDailyMissionDay(referenceDate)
  }
}

export function persistDailyMissionDay(day: DailyMissionDay) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DAILY_MISSION_STORAGE_KEY, JSON.stringify(day))
}

export function getStoredDailyMissionHistory(): DailyMissionHistoryEntry[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(DAILY_MISSION_HISTORY_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as DailyMissionHistoryEntry[] : []
  } catch {
    return []
  }
}

export function persistDailyMissionHistory(history: DailyMissionHistoryEntry[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DAILY_MISSION_HISTORY_STORAGE_KEY, JSON.stringify(trimHistory(history)))
}

export function generateDailyMissionDay(
  entries: TrainingEntry[],
  weeklyProgress: WeeklyProgressState,
  settings: DailyMissionSettings,
  gender: ProfileGender = "male",
  referenceDate = new Date(),
): DailyMissionDay {
  const dateKey = toDateKey(referenceDate)
  const rotationBodyPart = getRotationBodyPart(referenceDate)
  const trainingDays = getTrainingDaysForGoal(weeklyProgress.weeklyGoal)
  const dayIndex = (referenceDate.getDay() + 6) % 7
  const isRestDay = !trainingDays.has(dayIndex)

  if (isRestDay) {
    return {
      dateKey,
      isRestDay: true,
      rotationBodyPart,
      missions: [],
      completedAll: false,
    }
  }

  const selectedExercises = getSelectedExercises(settings, rotationBodyPart)
  const missionCount = Math.min(getMissionCountForGoal(weeklyProgress.weeklyGoal), selectedExercises.length)
  const missions = selectedExercises.slice(0, missionCount).map((exercise) =>
    createMission(
      dateKey,
      rotationBodyPart,
      exercise,
      entries,
      PRESET_EXERCISES[rotationBodyPart].some((preset) => preset.name === exercise.name) ? "preset" : "custom",
      gender,
    ),
  )

  return {
    dateKey,
    isRestDay: false,
    rotationBodyPart,
    missions,
    completedAll: false,
  }
}

export function resolveDailyMissionState(
  currentDay: DailyMissionDay,
  history: DailyMissionHistoryEntry[],
  entries: TrainingEntry[],
  weeklyProgress: WeeklyProgressState,
  settings: DailyMissionSettings,
  gender: ProfileGender = "male",
  referenceDate = new Date(),
) {
  const todayKey = toDateKey(referenceDate)
  if (currentDay.dateKey === todayKey) {
    return {
      currentDay: {
        ...currentDay,
        completedAll: currentDay.missions.length > 0 && currentDay.missions.every((mission) => mission.completed),
      },
      history: trimHistory(history),
    }
  }

  const previousHistoryEntry: DailyMissionHistoryEntry = {
    dateKey: currentDay.dateKey,
    isRestDay: currentDay.isRestDay,
    completedMissionIds: currentDay.missions.filter((mission) => mission.completed).map((mission) => mission.id),
    missionCount: currentDay.missions.length,
    completedAll: currentDay.missions.length > 0 && currentDay.missions.every((mission) => mission.completed),
  }

  return {
    currentDay: generateDailyMissionDay(entries, weeklyProgress, settings, gender, referenceDate),
    history: trimHistory([previousHistoryEntry, ...history.filter((entry) => entry.dateKey !== currentDay.dateKey)]),
  }
}

export function completeDailyMission(
  currentDay: DailyMissionDay,
  missionId: string,
  weeklyProgress: WeeklyProgressState,
  monthlyProgress: MonthlyCharacterProgressState,
) {
  const nextDay: DailyMissionDay = {
    ...currentDay,
    missions: currentDay.missions.map((mission) =>
      mission.id === missionId && !mission.completed
        ? { ...mission, completed: true, completedAt: new Date().toISOString() }
        : mission,
    ),
  }

  const completedMission = nextDay.missions.find((mission) => mission.id === missionId)
  const wasAlreadyCompleted = currentDay.missions.find((mission) => mission.id === missionId)?.completed
  const xpAwarded = completedMission && !wasAlreadyCompleted ? DAILY_MISSION_XP : 0
  const completedAll = nextDay.missions.length > 0 && nextDay.missions.every((mission) => mission.completed)

  return {
    nextDay: {
      ...nextDay,
      completedAll,
    },
    nextWeeklyProgress: {
      ...weeklyProgress,
      weeklyXP: weeklyProgress.weeklyXP + xpAwarded,
    },
    nextMonthlyProgress: {
      ...monthlyProgress,
      monthlyXP: monthlyProgress.monthlyXP + xpAwarded,
      monthlyLevel: monthlyProgress.monthlyLevel,
      breakdown: {
        ...monthlyProgress.breakdown,
        bonusXP: monthlyProgress.breakdown.bonusXP + xpAwarded,
      },
    },
    xpAwarded,
    completedAll,
  }
}

export function buildMissionHistoryEntry(day: DailyMissionDay): DailyMissionHistoryEntry {
  return {
    dateKey: day.dateKey,
    isRestDay: day.isRestDay,
    completedMissionIds: day.missions.filter((mission) => mission.completed).map((mission) => mission.id),
    missionCount: day.missions.length,
    completedAll: day.completedAll,
  }
}

export function getMissionCompletionCount(day: DailyMissionDay) {
  return day.missions.filter((mission) => mission.completed).length
}

export function getMissionHeadline(day: DailyMissionDay) {
  if (day.isRestDay) {
    return "今日は休息日！ゴリラも一緒に回復中🦍"
  }
  return `今日は${getBodyPartLabel(day.rotationBodyPart)}の日！`
}

export function getMissionDescription(mission: DailyMission) {
  return `今日は${getBodyPartLabel(mission.bodyPart)}の日！${mission.exerciseName}を${mission.targetSets}セットやろう`
}

export function getMissionHistoryStatus(historyEntry: DailyMissionHistoryEntry) {
  if (historyEntry.isRestDay) return "rest"
  if (historyEntry.completedAll) return "complete"
  if (historyEntry.completedMissionIds.length > 0) return "partial"
  return "missed"
}

export async function loadDailyMissionFromFirestore(user: User) {
  const snapshot = await getDoc(doc(db, "users", user.uid))
  const data = snapshot.data() as Partial<DailyMissionFirestorePayload> | undefined
  if (!data?.currentDay) return null
  return {
    currentDay: data.currentDay,
    history: Array.isArray(data.history) ? data.history : [],
    settings: data.settings ?? getDefaultDailyMissionSettings(),
  }
}

export async function saveDailyMissionToFirestore(user: User, payload: DailyMissionFirestorePayload) {
  await setDoc(doc(db, "users", user.uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
}

export function getMissionTrainingSuggestion(entries: TrainingEntry[], bodyPart: MissionBodyPart) {
  const latestEntry = [...entries].reverse().find((entry) => {
    if (bodyPart === "arms") {
      return entry.bodyPart === "BICEPS" || entry.bodyPart === "TRICEPS"
    }
    if (bodyPart === "chest") return entry.bodyPart === "CHEST"
    if (bodyPart === "back") return entry.bodyPart === "BACK"
    if (bodyPart === "legs") return entry.bodyPart === "LEGS"
    return entry.bodyPart === "SHOULDERS"
  })
  return latestEntry ? getEntryDateKey(latestEntry) : null
}