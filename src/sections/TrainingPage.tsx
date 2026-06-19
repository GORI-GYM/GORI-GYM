import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { IconArrowDown, IconArrowUp, IconBook, IconChart, IconEqual, IconGorillaFace, IconPlus, IconStar } from "@/icons"
import EmptyState from "@/components/EmptyState"
import { exerciseOptions, getExerciseWeightStep, type Routine } from "@/sections/routineData"

type TrainingBodyPart = "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "LEGS"
type BodyPartFilter = "ALL" | TrainingBodyPart
type CharacterBodyPart = "chest" | "arms" | "legs" | "back" | "shoulders"
type TrainingView = "session" | "history"

interface TrainingSet {
  weight: number
  reps?: number
  seconds?: number
  completed?: boolean
  isPR?: boolean
}

interface SessionExercise {
  id: number
  exerciseName: string
  bodyPart: TrainingBodyPart
  weightStep: 1 | 5
  sets: TrainingSet[]
  targetWeight?: number
  targetWeights?: number[]
  targetReps?: number
}

export interface TrainingEntry {
  id: number
  dateLabel: "today" | "yesterday" | "daysAgo" | "weekAgo"
  daysAgo?: number
  dateKey?: string
  exerciseName: string
  bodyPart: TrainingBodyPart
  sets: TrainingSet[]
}

export interface Big3Records {
  benchPress: number
  deadlift: number
  squat: number
}

export interface OneRMRecord {
  estimatedMax: number
  weight: number
  reps: number
}

export interface Big3OneRMRecords {
  benchPress: OneRMRecord
  deadlift: OneRMRecord
  squat: OneRMRecord
}

export interface BodyPartXPMap {
  chest: number
  arms: number
  legs: number
  back: number
  shoulders: number
  core: number
}

interface TrainingPageProps {
  entries: TrainingEntry[]
  onEntriesChange: React.Dispatch<React.SetStateAction<TrainingEntry[]>>
  big3Records: Big3Records
  onBig3RecordsChange: React.Dispatch<React.SetStateAction<Big3Records>>
  xp: number
  level: number
  onXpChange: React.Dispatch<React.SetStateAction<number>>
  bodyPartXP: BodyPartXPMap
  onBodyPartXPChange: React.Dispatch<React.SetStateAction<BodyPartXPMap>>
  routines?: Routine[]
  pendingStartRoutine?: Routine | null
  onPendingStartRoutineConsumed?: () => void
  selectedDateKey?: string | null
}

interface SuggestionSummary {
  exerciseName: string
  type: "up" | "same" | "deload"
  nextWeight: number
}

interface CelebrationParticle {
  id: number
  left: string
  delay: string
  duration: string
  rotation: string
  color: string
}

const bodyParts: BodyPartFilter[] = ["ALL", "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS"]

export const sampleEntries: TrainingEntry[] = [
  { id: 1, dateLabel: "today", exerciseName: "ベンチプレス", bodyPart: "CHEST", sets: [{ weight: 80, reps: 10 }, { weight: 80, reps: 8 }, { weight: 75, reps: 8 }] },
  { id: 2, dateLabel: "today", exerciseName: "Dumbbell Fly", bodyPart: "CHEST", sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 10 }] },
  { id: 3, dateLabel: "yesterday", exerciseName: "スクワット", bodyPart: "LEGS", sets: [{ weight: 100, reps: 8 }, { weight: 100, reps: 6 }, { weight: 90, reps: 8 }] },
  { id: 4, dateLabel: "yesterday", exerciseName: "Leg Press", bodyPart: "LEGS", sets: [{ weight: 150, reps: 10 }, { weight: 150, reps: 8 }] },
  { id: 5, dateLabel: "daysAgo", daysAgo: 3, exerciseName: "デッドリフト", bodyPart: "BACK", sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 110, reps: 6 }] },
  { id: 6, dateLabel: "daysAgo", daysAgo: 3, exerciseName: "Lat Pulldown", bodyPart: "BACK", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
  { id: 7, dateLabel: "daysAgo", daysAgo: 5, exerciseName: "Overhead Press", bodyPart: "SHOULDERS", sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 8 }] },
  { id: 8, dateLabel: "daysAgo", daysAgo: 5, exerciseName: "Lateral Raise", bodyPart: "SHOULDERS", sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 12 }] },
  { id: 9, dateLabel: "weekAgo", exerciseName: "Bicep Curl", bodyPart: "BICEPS", sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 10 }] },
  { id: 10, dateLabel: "weekAgo", exerciseName: "Triceps Pushdown", bodyPart: "TRICEPS", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 10 }] },
]

const bodyPartBadgeStyles: Record<TrainingBodyPart, { bg: string; text: string; border: string }> = {
  CHEST: { bg: "#FFF1A8", text: "#8A6500", border: "#FFF07A" },
  BACK: { bg: "#FFF8D6", text: "#B8860B", border: "#FFE066" },
  BICEPS: { bg: "#FFF4CC", text: "#A66B00", border: "#FFD54A" },
  TRICEPS: { bg: "#F5E6C8", text: "#8B5A2B", border: "#D4A900" },
  LEGS: { bg: "#FFFBEA", text: "#7A5C00", border: "#E7D7A2" },
  SHOULDERS: { bg: "#FFF8D6", text: "#9C6B00", border: "#FFD54A" },
}

export const XP_PER_VOLUME_UNIT = 0.1
export const MAX_LEVEL = 100
export const XP_PER_LEVEL = 5000
export const LEVEL_THRESHOLDS = Array.from({ length: MAX_LEVEL }, (_, index) => index * XP_PER_LEVEL)

const cardClassName = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#D4A900]/20 dark:bg-[#171717] dark:text-[#F8FAFC]"
const subtleCardClassName = "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#D4A900]/20 dark:bg-[#111111] dark:text-[#CBD5E1]"
const secondaryButtonClassName = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#FFE066] hover:text-[#D4A017] dark:border-[#D4A900]/20 dark:bg-[#171717] dark:text-[#CBD5E1] dark:hover:border-[#FFD400] dark:hover:text-[#F8FAFC]"
const primaryButtonClassName = "w-full rounded-xl bg-[#D4A017] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B8860B]"
const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#D4A017] focus:ring-4 focus:ring-[#FFF1A8] dark:border-[#D4A900]/20 dark:bg-[#171717] dark:text-[#F8FAFC]"
const celebrationColors = ["#D4A900", "#FFB800", "#FFE066", "#FFF07A", "#8A6500", "#F5E6C8"] as const

function createCelebrationParticles(): CelebrationParticle[] {
  return Array.from({ length: 28 }, (_, index) => ({
    id: Date.now() + index,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.35}s`,
    duration: `${2 + Math.random() * 1.1}s`,
    rotation: `${Math.round((Math.random() * 2 - 1) * 180)}deg`,
    color: celebrationColors[index % celebrationColors.length],
  }))
}

function normalizeTargetWeights(weights: number[] | undefined, sets: number, fallbackWeight: number): number[] {
  return Array.from({ length: sets }, (_, index) => {
    const candidate = weights?.[index]
    return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallbackWeight
  })
}

function createRoutineSessionSet(previousSet: TrainingSet | undefined, targetWeight: number, targetReps: number | undefined): TrainingSet {
  return {
    weight: previousSet?.weight ?? targetWeight,
    reps: previousSet?.reps ?? targetReps,
    completed: false,
    isPR: false,
  }
}

function getEntryVolume(entry: Pick<TrainingEntry, "sets">) {
  return entry.sets.reduce((total, set) => total + set.weight * (set.reps ?? 0), 0)
}

function mapTrainingBodyPart(bodyPart: TrainingBodyPart): CharacterBodyPart {
  switch (bodyPart) {
    case "CHEST":
      return "chest"
    case "BACK":
      return "back"
    case "BICEPS":
    case "TRICEPS":
      return "arms"
    case "LEGS":
      return "legs"
    case "SHOULDERS":
      return "shoulders"
  }
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "")
}

function getBig3Key(exerciseName: string): keyof Big3Records | null {
  const normalized = normalizeExerciseName(exerciseName)
  if (normalized === "benchpress" || normalized === normalizeExerciseName("繝吶Φ繝√・繝ｬ繧ｹ")) return "benchPress"
  if (normalized === "deadlift" || normalized === normalizeExerciseName("繝・ャ繝峨Μ繝輔ヨ")) return "deadlift"
  if (normalized === "squat" || normalized === normalizeExerciseName("繧ｹ繧ｯ繝ｯ繝・ヨ")) return "squat"
  return null
}

function getExerciseMaxWeight(sets: TrainingSet[]) {
  return Math.max(...sets.map((set) => set.weight), 0)
}

export function calculateEstimatedOneRM(weight: number, reps?: number) {
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || !reps || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

function getExerciseBestOneRM(sets: TrainingSet[]): OneRMRecord {
  return sets.reduce<OneRMRecord>((best, set) => {
    const estimatedMax = calculateEstimatedOneRM(set.weight, set.reps)
    if (estimatedMax <= best.estimatedMax) return best
    return {
      estimatedMax,
      weight: set.weight,
      reps: set.reps ?? 0,
    }
  }, { estimatedMax: 0, weight: 0, reps: 0 })
}

function getPreviousEntry(entries: TrainingEntry[], exerciseName: string) {
  const normalized = normalizeExerciseName(exerciseName)
  return entries.find((entry) => normalizeExerciseName(entry.exerciseName) === normalized)
}

function getExerciseTrendSummaries(entries: TrainingEntry[]) {
  const grouped = entries.reduce<Map<string, TrainingEntry[]>>((map, entry) => {
    const key = normalizeExerciseName(entry.exerciseName)
    const current = map.get(key) ?? []
    current.push(entry)
    map.set(key, current)
    return map
  }, new Map())

  return Array.from(grouped.values())
    .map((history) => {
      const sortedHistory = [...history].sort((a, b) => a.id - b.id)
      const latestEntry = sortedHistory[sortedHistory.length - 1]
      const latestMaxWeight = getExerciseMaxWeight(latestEntry.sets)
      const previousMaxWeight = sortedHistory.length > 1 ? getExerciseMaxWeight(sortedHistory[sortedHistory.length - 2].sets) : latestMaxWeight
      return {
        exerciseName: latestEntry.exerciseName,
        bodyPart: latestEntry.bodyPart,
        history: sortedHistory.slice(-5),
        latestEntry,
        latestMaxWeight,
        previousMaxWeight,
      }
    })
    .sort((a, b) => b.latestEntry.id - a.latestEntry.id)
}

function getNiceStep(range: number) {
  if (range <= 10) return 5
  if (range <= 30) return 10
  if (range <= 60) return 20
  if (range <= 100) return 25
  return 50
}

function getChartTicks(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = Math.max(5, Math.ceil((max - min || 5) * 0.1))
  const step = getNiceStep(max - min || 5)
  const start = Math.floor((min - padding) / step) * step
  const end = Math.ceil((max + padding) / step) * step
  const ticks: number[] = []
  for (let value = start; value <= end; value += step) {
    ticks.push(value)
  }
  return { start, end, ticks }
}

export function calculateBig3Records(entries: TrainingEntry[]): Big3Records {
  return entries.reduce<Big3Records>((records, entry) => {
    const key = getBig3Key(entry.exerciseName)
    if (!key) return records
    const maxWeight = getExerciseMaxWeight(entry.sets)
    return { ...records, [key]: Math.max(records[key], maxWeight) }
  }, { benchPress: 0, deadlift: 0, squat: 0 })
}

export function calculateExerciseOneRMHistory(entries: TrainingEntry[]) {
  return entries.reduce<Record<string, OneRMRecord>>((records, entry) => {
    const key = normalizeExerciseName(entry.exerciseName)
    const best = getExerciseBestOneRM(entry.sets)
    if (best.estimatedMax <= (records[key]?.estimatedMax ?? 0)) return records
    return {
      ...records,
      [key]: best,
    }
  }, {})
}

export function calculateBig3OneRMRecords(entries: TrainingEntry[]): Big3OneRMRecords {
  return entries.reduce<Big3OneRMRecords>((records, entry) => {
    const key = getBig3Key(entry.exerciseName)
    if (!key) return records
    const best = getExerciseBestOneRM(entry.sets)
    if (best.estimatedMax <= records[key].estimatedMax) return records
    return { ...records, [key]: best }
  }, {
    benchPress: { estimatedMax: 0, weight: 0, reps: 0 },
    deadlift: { estimatedMax: 0, weight: 0, reps: 0 },
    squat: { estimatedMax: 0, weight: 0, reps: 0 },
  })
}

export function calculateTotalXP(entries: TrainingEntry[]) {
  return Math.round(entries.reduce((total, entry) => total + getEntryVolume(entry) * XP_PER_VOLUME_UNIT, 0))
}

export function calculateBodyPartXPMap(entries: TrainingEntry[]): BodyPartXPMap {
  return entries.reduce<BodyPartXPMap>((totals, entry) => {
    const key = mapTrainingBodyPart(entry.bodyPart)
    totals[key] += Math.round(getEntryVolume(entry) * XP_PER_VOLUME_UNIT)
    return totals
  }, { chest: 0, arms: 0, legs: 0, back: 0, shoulders: 0, core: 0 })
}

export function getLevelFromXP(xp: number) {
  return Math.min(MAX_LEVEL, Math.floor(Math.max(xp, 0) / XP_PER_LEVEL) + 1)
}

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1)
}

function adjustWeightByStep(weight: number, delta: number, step: number) {
  return Math.max(0, weight + delta * step)
}

function ProgressChart({
  entries,
  title,
  t,
}: {
  entries: TrainingEntry[]
  title: string
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const values = entries.map((entry) => getExerciseMaxWeight(entry.sets)).reverse()
  const labels = entries.map((entry) => {
    if (entry.dateLabel === "today") return t("training.today")
    if (entry.dateLabel === "yesterday") return t("training.yesterday")
    if (entry.dateLabel === "weekAgo") return t("training.weekAgo")
    return t("training.daysAgo", { count: entry.daysAgo ?? 0 })
  }).reverse()
  const { start, end, ticks } = getChartTicks(values)
  const chartHeight = 180
  const chartWidth = 320
  const leftPad = 42
  const bottomPad = 28
  const topPad = 18
  const innerHeight = chartHeight - topPad - bottomPad
  const innerWidth = chartWidth - leftPad - 12
  const barWidth = Math.min(30, Math.floor(innerWidth / Math.max(values.length * 1.6, 1)))
  const gap = values.length > 1 ? (innerWidth - barWidth * values.length) / (values.length - 1) : 0
  const latestIsHighest = values[values.length - 1] === Math.max(...values)

  const getY = (value: number) => topPad + ((end - value) / Math.max(end - start, 1)) * innerHeight

  return (
    <div className={cardClassName}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800">{title}</div>
        <div className="text-xs font-medium text-[#D4A017]">{t("training.maxWeight")}: {Math.max(...values)}kg</div>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[180px] w-full">
        {ticks.map((tick) => {
          const y = getY(tick)
          return (
            <g key={tick}>
              <line x1={leftPad} x2={chartWidth - 8} y1={y} y2={y} stroke="#CBD5E1" strokeDasharray="4 4" />
              <text x={4} y={y + 4} fontSize="10" fill="#64748B">{tick}kg</text>
            </g>
          )
        })}
        {values.map((value, index) => {
          const x = leftPad + index * (barWidth + gap)
          const y = getY(value)
          const height = chartHeight - bottomPad - y
          const isMax = value === Math.max(...values)
          return (
            <g key={`${labels[index]}-${value}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={isMax ? "#D4A900" : "#FFF07A"}
                opacity={isMax ? 1 : 0.88}
                stroke={isMax ? "#111111" : "#FFE066"}
                strokeWidth="2"
                rx="2"
              />
              {isMax ? <rect x={x - 2} y={y - 2} width={barWidth + 4} height={height + 4} fill="none" stroke="#FFE066" opacity="0.45" /> : null}
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#334155">{formatWeight(value)}kg</text>
              <text x={x + barWidth / 2} y={chartHeight - 10} textAnchor="middle" fontSize="9" fill="#64748B">{labels[index]}</text>
              {latestIsHighest && index === values.length - 1 ? (
                <text x={x + barWidth / 2} y={y - 18} textAnchor="middle" fontSize="12" fill="#D4A900">★</text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function TrainingPage({
  entries,
  onEntriesChange,
  big3Records: _big3Records,
  onBig3RecordsChange,
  xp: _xp,
  level: _level,
  onXpChange,
  bodyPartXP: _bodyPartXP,
  onBodyPartXPChange,
  routines = [],
  pendingStartRoutine = null,
  onPendingStartRoutineConsumed,
  selectedDateKey = null,
}: TrainingPageProps) {
  const { t } = useTranslation()
  const hasEntries = entries.length > 0
  const [activeView, setActiveView] = useState<TrainingView>("session")
  const [activeBodyPart, setActiveBodyPart] = useState<BodyPartFilter>("ALL")
  const [showForm, setShowForm] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [exerciseName, setExerciseName] = useState("")
  const [selectedBodyPart, setSelectedBodyPart] = useState<TrainingBodyPart>("CHEST")
  const [weightInput, setWeightInput] = useState("")
  const [repsInput, setRepsInput] = useState("")
  const [pendingSets, setPendingSets] = useState<TrainingSet[]>([])
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [expandedChartExercise, setExpandedChartExercise] = useState<string | null>(null)
  const [prBanner, setPrBanner] = useState<{ exerciseName: string; weight: number } | null>(null)
  const [completionSuggestions, setCompletionSuggestions] = useState<SuggestionSummary[]>([])
  const [celebration, setCelebration] = useState<{ message: string; particles: CelebrationParticle[] } | null>(null)
  const exerciseOneRMHistory = useMemo(() => calculateExerciseOneRMHistory(entries), [entries])
  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) {
      return null
    }

    const parsed = new Date(`${selectedDateKey}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return selectedDateKey
    }

    return new Intl.DateTimeFormat(t("common.locale") === "ja" ? "ja-JP" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(parsed)
  }, [selectedDateKey, t])

  const groupedExerciseOptions = useMemo(
    () => exerciseOptions.map((group) => ({
      ...group,
      label: t(`training.${group.bodyPart.toLowerCase()}`),
      translatedExercises: group.exercises.map((exercise) => ({
        ...exercise,
        label: t(`training.suggestions.${exercise.id}`),
      })),
    })),
    [t],
  )
  const filteredEntries = useMemo(
    () => entries.filter((entry) => activeBodyPart === "ALL" || entry.bodyPart === activeBodyPart),
    [activeBodyPart, entries],
  )
  const filteredTrendSummaries = useMemo(
    () => getExerciseTrendSummaries(filteredEntries),
    [filteredEntries],
  )
  const filteredGroupedExerciseOptions = useMemo(() => {
    const query = exerciseName.trim().toLowerCase()
    if (!query) return groupedExerciseOptions
    return groupedExerciseOptions
      .map((group) => ({
        ...group,
        translatedExercises: group.translatedExercises.filter((exercise) =>
          [exercise.label, exercise.en, exercise.ja].some((value) => value.toLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.translatedExercises.length > 0)
  }, [exerciseName, groupedExerciseOptions])

  const totalSessions = entries.length
  const totalWeight = entries.reduce((total, entry) => total + getEntryVolume(entry), 0)
  const sessionTotalVolume = sessionExercises.reduce((total, exercise) => total + getEntryVolume(exercise), 0)
  const favoriteBodyPart = useMemo(() => {
    const counts = entries.reduce<Record<TrainingBodyPart, number>>((acc, entry) => {
      acc[entry.bodyPart] += 1
      return acc
    }, { CHEST: 0, BACK: 0, SHOULDERS: 0, BICEPS: 0, TRICEPS: 0, LEGS: 0 })
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as TrainingBodyPart) ?? "CHEST"
  }, [entries])

  useEffect(() => {
    if (!prBanner) return
    const timer = window.setTimeout(() => setPrBanner(null), 3000)
    return () => window.clearTimeout(timer)
  }, [prBanner])

  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(null), 2600)
    return () => window.clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    if (!pendingStartRoutine) return
    setSessionExercises(
      pendingStartRoutine.exercises.map((exercise, index) => {
        const translatedName = t(`training.suggestions.${exercise.nameKey}`)
        const previous = getPreviousEntry(entries, translatedName)
        const targetWeights = normalizeTargetWeights(exercise.weights, exercise.sets, exercise.targetWeight)
        return {
          id: Date.now() + index,
          exerciseName: translatedName,
          bodyPart: exercise.bodyPart as TrainingBodyPart,
          weightStep: exercise.weightStep,
          targetWeight: exercise.targetWeight,
          targetWeights,
          targetReps: exercise.targetReps,
          sets: Array.from({ length: exercise.sets }, (_, setIndex) =>
            createRoutineSessionSet(previous?.sets[setIndex], targetWeights[setIndex], exercise.targetReps),
          ),
        }
      }),
    )
    setActiveView("session")
    onPendingStartRoutineConsumed?.()
  }, [entries, onPendingStartRoutineConsumed, pendingStartRoutine, t])

  const getDateLabel = (entry: TrainingEntry) => {
    if (entry.dateLabel === "today") return t("training.today")
    if (entry.dateLabel === "yesterday") return t("training.yesterday")
    if (entry.dateLabel === "weekAgo") return t("training.weekAgo")
    return t("training.daysAgo", { count: entry.daysAgo ?? 0 })
  }

  const handleAddSet = () => {
    const weight = Number(weightInput)
    const reps = Number(repsInput)
    if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(reps) || reps <= 0) return
    setPendingSets((current) => [...current, { weight, reps, completed: false }])
    setWeightInput("")
    setRepsInput("")
  }

  const handleWeightAdjust = (delta: number) => {
    const current = Number(weightInput || "0")
    const step = getExerciseWeightStep(exerciseName.trim())
    const next = adjustWeightByStep(current, delta, step)
    setWeightInput(next === 0 ? "" : `${next}`)
  }

  const handleRepsAdjust = (delta: number) => {
    const current = Number(repsInput || "0")
    const next = Math.max(0, current + delta)
    setRepsInput(next === 0 ? "" : `${next}`)
  }

  const resetForm = () => {
    setExerciseName("")
    setSelectedBodyPart("CHEST")
    setWeightInput("")
    setRepsInput("")
    setPendingSets([])
  }

  const handleCancel = () => {
    setShowForm(false)
    setShowAddMenu(false)
    resetForm()
  }

  const handleCompleteExercise = () => {
    const trimmedName = exerciseName.trim()
    if (!trimmedName || pendingSets.length === 0) return

    setSessionExercises((current) => [
      ...current,
      {
        id: Date.now(),
        exerciseName: trimmedName,
        bodyPart: selectedBodyPart,
        weightStep: getExerciseWeightStep(trimmedName),
        sets: pendingSets,
      },
    ])
    setShowForm(false)
    setShowAddMenu(false)
    resetForm()
  }

  const handleOpenAddMenu = () => {
    setShowAddMenu(true)
  }

  const handleOpenManualForm = () => {
    setShowAddMenu(false)
    setShowForm(true)
  }

  const handleStartRoutineFromMenu = (routineId: string) => {
    handleRoutineSelect(routineId)
    setShowAddMenu(false)
    setActiveView("session")
  }

  const buildSessionFromRoutine = (routine: Routine) => {
    setSessionExercises(
      routine.exercises.map((exercise, index) => {
        const translatedName = t(`training.suggestions.${exercise.nameKey}`)
        const previous = getPreviousEntry(entries, translatedName)
        const targetWeights = normalizeTargetWeights(exercise.weights, exercise.sets, exercise.targetWeight)
        return {
          id: Date.now() + index,
          exerciseName: translatedName,
          bodyPart: exercise.bodyPart as TrainingBodyPart,
          weightStep: exercise.weightStep,
          targetWeight: exercise.targetWeight,
          targetWeights,
          targetReps: exercise.targetReps,
          sets: Array.from({ length: exercise.sets }, (_, setIndex) =>
            createRoutineSessionSet(previous?.sets[setIndex], targetWeights[setIndex], exercise.targetReps),
          ),
        }
      }),
    )
  }

  const handleRoutineSelect = (routineId: string) => {
    const routine = routines.find((item) => item.id === routineId)
    if (!routine) {
      setSessionExercises([])
      return
    }
    buildSessionFromRoutine(routine)
  }

  const adjustSessionExerciseSets = (exerciseId: number, delta: number) => {
    setSessionExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise
        const nextCount = Math.min(10, Math.max(1, exercise.sets.length + delta))
        if (nextCount === exercise.sets.length) return exercise
        const targetWeights = normalizeTargetWeights(exercise.targetWeights, nextCount, exercise.targetWeight ?? 0)
        const nextSets =
          nextCount > exercise.sets.length
            ? [
                ...exercise.sets,
                ...Array.from({ length: nextCount - exercise.sets.length }, (_, index) =>
                  createRoutineSessionSet(
                    undefined,
                    targetWeights[exercise.sets.length + index] ?? exercise.targetWeight ?? 0,
                    exercise.targetReps,
                  ),
                ),
              ]
            : exercise.sets.slice(0, nextCount)

        return {
          ...exercise,
          targetWeights,
          sets: nextSets,
        }
      }),
    )
  }

  const updateSessionSet = (exerciseId: number, setIndex: number, updater: (set: TrainingSet, exercise: SessionExercise) => TrainingSet) => {
    setSessionExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, index) => (index === setIndex ? updater(set, exercise) : set)),
            },
      ),
    )
  }

  const adjustSessionSetWeight = (exerciseId: number, setIndex: number, delta: number) => {
    updateSessionSet(exerciseId, setIndex, (set, exercise) => {
      const nextWeight = adjustWeightByStep(set.weight, delta, exercise.weightStep)
      const nextEstimatedMax = calculateEstimatedOneRM(nextWeight, set.reps)
      const previousBestOneRM = exerciseOneRMHistory[normalizeExerciseName(exercise.exerciseName)]?.estimatedMax ?? 0
      const isPR = nextEstimatedMax > previousBestOneRM
      if (isPR) {
        setPrBanner({ exerciseName: exercise.exerciseName, weight: nextWeight })
      }
      return { ...set, weight: nextWeight, isPR }
    })
  }

  const adjustSessionSetReps = (exerciseId: number, setIndex: number, delta: number) => {
    updateSessionSet(exerciseId, setIndex, (set, exercise) => {
      const reps = Math.max(1, (set.reps ?? 1) + delta)
      const nextEstimatedMax = calculateEstimatedOneRM(set.weight, reps)
      const previousBestOneRM = exerciseOneRMHistory[normalizeExerciseName(exercise.exerciseName)]?.estimatedMax ?? 0
      return {
        ...set,
        reps,
        isPR: nextEstimatedMax > previousBestOneRM,
      }
    })
  }

  const toggleSessionSetCompleted = (exerciseId: number, setIndex: number) => {
    let completedAllSets = false
    updateSessionSet(exerciseId, setIndex, (set, exercise) => {
      const nextSet = { ...set, completed: !set.completed }
      const nextSets = exercise.sets.map((currentSet, currentIndex) => (currentIndex === setIndex ? nextSet : currentSet))
      completedAllSets = nextSets.length > 0 && nextSets.every((currentSet) => currentSet.completed)
      return nextSet
    })
    if (completedAllSets) {
      setCelebration({
        message: t("training.celebrationExerciseComplete"),
        particles: createCelebrationParticles(),
      })
    }
  }

  const getSuggestionForExercise = (exercise: SessionExercise): SuggestionSummary => {
    const completedSets = exercise.sets.filter((set) => set.completed)
    const allCompletedAtTarget = completedSets.length === exercise.sets.length && completedSets.every((set) => (set.reps ?? 0) >= (exercise.targetReps ?? 0))
    const previous = getPreviousEntry(entries, exercise.exerciseName)
    const previousMissed = previous ? previous.sets.filter((set) => (set.reps ?? 0) < (exercise.targetReps ?? 0)).length >= 2 : false
    const currentWeight = Math.max(...exercise.sets.map((set) => set.weight), exercise.targetWeight ?? 0)

    if (allCompletedAtTarget) {
      return { exerciseName: exercise.exerciseName, type: "up", nextWeight: currentWeight + exercise.weightStep }
    }
    if (previousMissed) {
      return { exerciseName: exercise.exerciseName, type: "deload", nextWeight: Math.round(currentWeight * 0.9 * 10) / 10 }
    }
    return { exerciseName: exercise.exerciseName, type: "same", nextWeight: currentWeight }
  }

  const handleSaveTraining = () => {
    if (sessionExercises.length === 0) return

    const todayDateKey = new Date().toISOString().slice(0, 10)
    const targetDateKey = selectedDateKey ?? todayDateKey

    const nextEntries = [
      ...sessionExercises.map((exercise) => ({
        id: exercise.id,
        dateLabel: targetDateKey === todayDateKey ? "today" as const : "daysAgo" as const,
        daysAgo: targetDateKey === todayDateKey
          ? undefined
          : Math.max(
            0,
            Math.round(
              (new Date(`${todayDateKey}T00:00:00`).getTime() - new Date(`${targetDateKey}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24),
            ),
          ),
        dateKey: targetDateKey,
        exerciseName: exercise.exerciseName,
        bodyPart: exercise.bodyPart,
        sets: exercise.sets,
      })),
      ...entries,
    ]

    onEntriesChange(nextEntries)
    setCompletionSuggestions(sessionExercises.map(getSuggestionForExercise))
    onBig3RecordsChange(calculateBig3Records(nextEntries))
    onXpChange(calculateTotalXP(nextEntries))
    onBodyPartXPChange(calculateBodyPartXPMap(nextEntries))
    setSessionExercises([])
    setActiveView("history")
    resetForm()
    setCelebration({
      message: t("training.celebrationSessionComplete"),
      particles: createCelebrationParticles(),
    })
  }

  return (
    <section className="min-h-full bg-slate-100 px-4 pb-28 pt-4 text-slate-900 transition-colors duration-200 dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-auto max-w-[430px] space-y-4">
        {!hasEntries ? (
          <EmptyState
            icon={<IconGorillaFace className="h-10 w-10" />}
            title="最初のトレーニングを記録しよう！"
            description="まだトレーニング記録がありません。最初の1回を残すと、進捗・BIG3・成長履歴がここからどんどん育っていきます。"
          />
        ) : null}
        <AnimatePresence>
          {selectedDateLabel ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-[#FFD54A] bg-[#FFF8D6] px-4 py-3 text-sm font-semibold text-[#8A6500] dark:border-[#D4A900]/30 dark:bg-[#111827] dark:text-[#FFF07A]"
            >
              {t("training.selectedDateBanner", { date: selectedDateLabel })}
            </motion.div>
          ) : null}
          {celebration ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
            >
              {celebration.particles.map((particle) => (
                <span
                  key={particle.id}
                  className="training-confetti"
                  style={{
                    left: particle.left,
                    animationDelay: particle.delay,
                    animationDuration: particle.duration,
                    rotate: particle.rotation,
                    background: `linear-gradient(180deg, ${particle.color}, rgba(255,255,255,0.92))`,
                  }}
                />
              ))}
              <div className="absolute inset-x-4 top-6 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-[320px] rounded-[1.75rem] border border-[#FFD54A] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,214,0.98))] px-5 py-4 text-center shadow-[0_24px_60px_rgba(212,169,0,0.22)] backdrop-blur"
                >
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#FFE066]">
                    Great Job
                  </div>
                  <div className="mt-1 text-lg font-black text-[#8A6500]">
                    {celebration.message}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
          {prBanner ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: -18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden rounded-[1.75rem] border border-yellow-300/80 px-4 py-4 text-slate-900 shadow-[0_18px_50px_rgba(234,179,8,0.28)]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,248,220,0.98) 0%, rgba(255,215,64,0.96) 28%, rgba(255,237,160,0.98) 58%, rgba(255,255,255,0.98) 100%)",
              }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.95), transparent 24%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.75), transparent 18%), radial-gradient(circle at 50% 50%, rgba(250,204,21,0.28), transparent 60%)",
                }}
              />
              <motion.div
                className="absolute -left-1/4 top-0 h-full w-1/2"
                animate={{ x: ["-10%", "220%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0) 100%)",
                  transform: "skewX(-20deg)",
                }}
              />
              {Array.from({ length: 12 }).map((_, index) => (
                <motion.div
                  key={`pr-star-${index}`}
                  className="absolute text-yellow-100"
                  initial={{ opacity: 0, scale: 0.4, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.4, 1.15, 0.2],
                    x: (index - 5.5) * 18,
                    y: -18 - (index % 4) * 16,
                    rotate: index % 2 === 0 ? 24 : -24,
                  }}
                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.15, delay: index * 0.05, ease: "easeOut" }}
                  style={{
                    left: "50%",
                    bottom: "18px",
                    textShadow: "0 0 14px rgba(255,255,255,0.95)",
                  }}
                >
                  笘・                </motion.div>
              ))}
              <div className="relative flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.18, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-200/80 bg-white/70 shadow-[0_0_24px_rgba(250,204,21,0.45)]"
                >
                  <IconStar className="h-6 w-6 text-yellow-500" />
                </motion.div>
                <div className="min-w-0">
                  <div className="bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-600 bg-clip-text text-lg font-black tracking-[0.18em] text-transparent">
                    NEW RECORD!
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-900">
                    {prBanner.exerciseName} ﾂｷ {formatWeight(prBanner.weight)}kg
                  </div>
                  <div className="text-xs font-medium text-amber-800/80">
                    {t("training.newPR")}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#8A6500] via-[#D4A017] to-[#FFD54A] px-5 py-5 text-white">
            <div className="mb-2 flex items-center gap-2 text-[#FFF8D6]">
              <IconBook className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">{t("training.title")}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{t("training.title")}</h1>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-3 backdrop-blur-sm">
                <div className="text-xs font-medium text-[#FFF8D6]/80">{t("training.totalSessions")}</div>
                <div className="mt-1 text-base font-semibold text-white">{totalSessions}</div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-3 backdrop-blur-sm">
                <div className="text-xs font-medium text-[#FFF8D6]/80">{t("training.totalWeight")}</div>
                <div className="mt-1 text-base font-semibold text-white">{totalWeight.toLocaleString()} kg</div>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/15 px-3 py-3 backdrop-blur-sm">
                <div className="text-xs font-medium text-[#FFF8D6]/80">{t("training.favoritePart")}</div>
                <div className="mt-1 text-base font-semibold text-white">{t(`training.${favoriteBodyPart.toLowerCase()}`)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-6 border-b border-slate-200 px-1">
          {(["session", "history"] as const).map((view) => {
            const active = activeView === view
            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`border-b-2 pb-2 text-sm font-semibold transition-colors ${
                  active ? "border-[#D4A017] text-[#D4A017]" : "border-transparent text-slate-500 hover:text-[#8A6500]"
                }`}
              >
                {t(`training.${view}`)}
              </button>
            )
          })}
        </div>

        {activeView === "session" ? (
          <div className="space-y-3">
            <div className={cardClassName}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">{t("training.currentSession")}</h2>
                <span className="text-xs font-medium text-[#D4A017]">{sessionTotalVolume.toLocaleString()} kg</span>
              </div>
              {sessionExercises.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  {t("training.noSessionExercises")}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionExercises.map((exercise) => {
                    const badgeStyle = bodyPartBadgeStyles[exercise.bodyPart]
                    return (
                      <div key={exercise.id} className={subtleCardClassName}>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900">{exercise.exerciseName}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {exercise.targetWeight
                                ? `${t("training.target")}: ${formatWeight(exercise.targetWeight)}kg ﾂｷ ${exercise.targetReps}`
                                : t("training.freeInput")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {exercise.targetWeights ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => adjustSessionExerciseSets(exercise.id, -1)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[#FFE066] hover:text-[#D4A017]"
                                  aria-label={t("training.removeSet")}
                                >
                                  <IconArrowDown className="h-4 w-4" />
                                </button>
                                <span className="min-w-[4.5rem] text-center text-xs font-semibold text-slate-500">
                                  {exercise.sets.length} {t("common.sets")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustSessionExerciseSets(exercise.id, 1)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[#FFE066] hover:text-[#D4A017]"
                                  aria-label={t("training.addSet")}
                                >
                                  <IconPlus className="h-4 w-4" />
                                </button>
                              </div>
                            ) : null}
                            <div
                              className="rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{ background: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}` }}
                            >
                              {t(`training.${exercise.bodyPart.toLowerCase()}`)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm text-slate-700">
                          {exercise.sets.map((set, index) => (
                            <div
                              key={`${exercise.id}-${index}`}
                              className={`rounded-3xl border px-4 py-4 shadow-sm ${set.completed ? "border-[#FFD54A] bg-gradient-to-br from-[#FFF8D6] to-white" : "border-[#FFE066] bg-white"}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A017]">
                                    {t("training.set")} {index + 1}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {set.completed ? t("training.completed") : t("training.tapToComplete")}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSessionSetCompleted(exercise.id, index)}
                                  className={`flex h-9 min-w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                                    set.completed ? "border-[#D4A017] bg-[#D4A017] text-white shadow-[0_10px_24px_rgba(212,169,0,0.28)]" : "border-[#FFD54A] bg-[#FFF8D6] text-[#D4A017] hover:bg-[#FFF1A8]"
                                  }`}
                                >
                                  笨・                                </button>
                              </div>

                              <div className="mt-4 grid gap-3">
                                <div>
                                  <div className="mb-1.5 text-xs font-semibold text-[#B8860B]">{t("training.weight")}</div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => adjustSessionSetWeight(exercise.id, index, -1)}
                                      className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-[#FFD54A] bg-[#FFF8D6] text-lg font-semibold text-[#D4A017] transition hover:bg-[#FFF1A8]"
                                    >
                                      竏・                                    </button>
                                    <div className="flex-1 rounded-2xl border border-[#FFE066] bg-gradient-to-br from-white to-[#FFF8D6] px-3 py-3 text-center text-base font-semibold text-slate-800">
                                      {formatWeight(set.weight)}kg
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => adjustSessionSetWeight(exercise.id, index, 1)}
                                      className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-[#FFD54A] bg-[#FFF8D6] text-lg font-semibold text-[#D4A017] transition hover:bg-[#FFF1A8]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <div className="mb-1.5 text-xs font-semibold text-[#B8860B]">{t("training.reps")}</div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => adjustSessionSetReps(exercise.id, index, -1)}
                                      className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-[#FFD54A] bg-[#FFF8D6] text-lg font-semibold text-[#D4A017] transition hover:bg-[#FFF1A8]"
                                    >
                                      竏・                                    </button>
                                    <div className="flex-1 rounded-2xl border border-[#FFE066] bg-gradient-to-br from-white to-[#FFF8D6] px-3 py-3 text-center text-base font-semibold text-slate-800">
                                      {set.reps ?? 0}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => adjustSessionSetReps(exercise.id, index, 1)}
                                      className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-[#FFD54A] bg-[#FFF8D6] text-lg font-semibold text-[#D4A017] transition hover:bg-[#FFF1A8]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {completionSuggestions.length > 0 ? (
              <div className={cardClassName}>
                <div className="mb-3 text-base font-semibold text-slate-900">{t("training.nextSuggestion")}</div>
                <div className="space-y-2">
                  {completionSuggestions.map((suggestion) => (
                    <div key={suggestion.exerciseName} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800">
                      <div className="text-xs font-semibold text-slate-700">{suggestion.exerciseName}</div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {suggestion.type === "up" ? <IconArrowUp className="h-3.5 w-3.5 text-[#D4A017]" /> : null}
                        {suggestion.type === "same" ? <IconEqual className="h-3.5 w-3.5 text-slate-500" /> : null}
                        {suggestion.type === "deload" ? <IconArrowDown className="h-3.5 w-3.5 text-rose-500" /> : null}
                        <span>{formatWeight(suggestion.nextWeight)}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSaveTraining}
              className="w-full rounded-2xl bg-[#D4A017] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={sessionExercises.length === 0}
            >
              {t("training.finishSession")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {bodyParts.map((part) => {
                const active = activeBodyPart === part
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setActiveBodyPart(part)}
                    className={`shrink-0 px-3 py-2 text-xs font-semibold transition ${
                      active ? "rounded-xl border border-[#D4A017] bg-[#D4A017] text-white" : "rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#FFE066] hover:text-[#D4A017]"
                    }`}
                  >
                    {t(`training.${part.toLowerCase()}`)}
                  </button>
                )
              })}
            </div>

            <div className={cardClassName}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-slate-900">{t("training.history")}</div>
                  <div className="text-xs text-slate-500">{filteredTrendSummaries.length} {t("common.exercises")}</div>
                </div>
                <IconChart className="h-5 w-5 text-[#D4A017]" />
              </div>

              {filteredTrendSummaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  {t("training.noTrainingYet")}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTrendSummaries.map((summary) => {
                    const { exerciseName: trendExerciseName, history, latestEntry, latestMaxWeight, previousMaxWeight } = summary
                    const isExpanded = expandedChartExercise === trendExerciseName
                    const bestOneRM = getExerciseBestOneRM(latestEntry.sets)
                    const delta = latestMaxWeight - previousMaxWeight
                    return (
                      <div key={trendExerciseName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{trendExerciseName}</div>
                            <div className="mt-1 text-xs text-slate-500">{history.length} {t("training.sessions")} ・ {getDateLabel(latestEntry)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedChartExercise(isExpanded ? null : trendExerciseName)}
                            className={secondaryButtonClassName}
                          >
                            {t("common.view")}
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <div className="text-slate-500">{t("training.maxWeight")}</div>
                            <div className="mt-1 font-semibold text-slate-900">{formatWeight(latestMaxWeight)} kg</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <div className="text-slate-500">{t("training.estimatedMax")}</div>
                            <div className="mt-1 font-semibold text-slate-900">{formatWeight(bestOneRM.estimatedMax)} kg</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs">
                          <span className="text-slate-500">{t("training.progressChart")}</span>
                          <span className={`inline-flex items-center gap-1 font-semibold ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-500" : "text-slate-500"}`}>
                            {delta > 0 ? <IconArrowUp className="h-4 w-4" /> : delta < 0 ? <IconArrowDown className="h-4 w-4" /> : <IconEqual className="h-4 w-4" />}
                            {delta === 0 ? t("training.same") : `${delta > 0 ? "+" : ""}${formatWeight(delta)} kg`}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <span className="text-xs text-slate-500">{t("training.set")}</span>
                          {latestEntry.sets.map((set, setIndex) => {
                            const isPR = set.weight === getExerciseMaxWeight(latestEntry.sets)
                            return (
                              <div key={`${latestEntry.id}-${setIndex}`} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                <span className="text-xs font-semibold text-slate-700">{t("training.set")} {setIndex + 1}</span>
                                <span className="text-xs text-slate-600">
                                  {formatWeight(set.weight)}kg {set.reps ? `ﾂｷ ${set.reps}${t("training.repsSuffix")}` : `ﾂｷ ${set.seconds}${t("training.seconds")}`}
                                </span>
                                {isPR ? <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">{t("training.personalBest")}</span> : null}
                              </div>
                            )
                          })}
                        </div>

                        {isExpanded && history.length > 1 ? (
                          <div className="mt-4">
                            <ProgressChart entries={history} title={t("training.progressChart")} t={t} />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenAddMenu}
          className="fixed bottom-24 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 rounded-2xl bg-[#D4A017] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#B8860B]"
        >
          {t("training.addTraining")}
        </button>

        <AnimatePresence>
          {showAddMenu ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/45 px-4 pb-24 pt-10"
              onClick={() => setShowAddMenu(false)}
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[430px] rounded-[2rem] bg-[#0f172a] p-5 text-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">{t("training.addTraining")}</h2>
                  <button type="button" onClick={() => setShowAddMenu(false)} className="text-sm text-slate-300">
                    {t("common.close")}
                  </button>
                </div>
                <div className="space-y-3">
                  <button type="button" onClick={handleOpenManualForm} className={primaryButtonClassName}>
                    {t("training.addMore")}
                  </button>
                  {routines.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t("training.selectRoutine")}</div>
                      {routines.map((routine) => (
                        <button
                          key={routine.id}
                          type="button"
                          onClick={() => handleStartRoutineFromMenu(routine.id)}
                          className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm text-white transition hover:border-[#FFD54A]"
                        >
                          <span>{routine.customName || (routine.nameKey ? t(`routine.${routine.nameKey}`) : routine.id)}</span>
                          <span className="text-xs text-slate-400">{routine.exercises.length} {t("common.exercises")}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showForm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/45 px-4 pb-24 pt-10"
              onClick={handleCancel}
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[430px] rounded-[2rem] bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">{t("training.addTraining")}</h2>
                  <button type="button" onClick={handleCancel} className="text-sm text-slate-500">
                    {t("training.cancel")}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">{t("training.exerciseName")}</label>
                    <input
                      value={exerciseName}
                      onChange={(event) => setExerciseName(event.target.value)}
                      placeholder={t("workout.exerciseNamePlaceholder")}
                      className={inputClassName}
                    />
                    {filteredGroupedExerciseOptions.length > 0 ? (
                      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#D4A900]/20 dark:bg-[#111111]">
                        {filteredGroupedExerciseOptions.map((group) => (
                          <div key={group.key}>
                            <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4A017]">
                              {group.label}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.translatedExercises.map((exercise) => (
                                <button
                                  key={exercise.id}
                                  type="button"
                                  onClick={() => {
                                    setExerciseName(exercise.label)
                                    setSelectedBodyPart(group.bodyPart)
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#FFE066] hover:text-[#D4A017]"
                                >
                                  {exercise.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">{t("training.selectBodyPart")}</label>
                    <div className="flex flex-wrap gap-2">
                      {bodyParts.filter((part): part is TrainingBodyPart => part !== "ALL").map((part) => {
                        const active = selectedBodyPart === part
                        return (
                          <button
                            key={part}
                            type="button"
                            onClick={() => setSelectedBodyPart(part)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              active ? "bg-[#D4A017] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#FFE066] hover:text-[#D4A017]"
                            }`}
                          >
                            {t(`training.${part.toLowerCase()}`)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">{t("training.weight")}</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleWeightAdjust(-1)} className={secondaryButtonClassName}>−</button>
                        <input
                          value={weightInput}
                          onChange={(event) => setWeightInput(event.target.value)}
                          inputMode="decimal"
                          className={inputClassName}
                        />
                        <button type="button" onClick={() => handleWeightAdjust(1)} className={secondaryButtonClassName}>+</button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">{t("training.reps")}</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => handleRepsAdjust(-1)} className={secondaryButtonClassName}>−</button>
                        <input
                          value={repsInput}
                          onChange={(event) => setRepsInput(event.target.value)}
                          inputMode="numeric"
                          className={inputClassName}
                        />
                        <button type="button" onClick={() => handleRepsAdjust(1)} className={secondaryButtonClassName}>+</button>
                      </div>
                    </div>
                  </div>

                  <button type="button" onClick={handleAddSet} className={primaryButtonClassName}>
                    {t("training.addSet")}
                  </button>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-xs text-slate-500">{t("training.setsRecorded")}</div>
                    {pendingSets.length === 0 ? (
                      <div className="text-sm text-slate-500">{t("training.noSets")}</div>
                    ) : (
                      <div className="space-y-2">
                        {pendingSets.map((set, index) => (
                          <div key={`${set.weight}-${set.reps}-${index}`} className="flex items-center justify-between gap-2">
                            <span>{t("training.set")} {index + 1}</span>
                            <span>{formatWeight(set.weight)}kg ﾂｷ {set.reps}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleCancel} className={secondaryButtonClassName}>
                      {t("training.cancel")}
                    </button>
                    <button type="button" onClick={handleCompleteExercise} className={primaryButtonClassName}>
                      {t("workout.done")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
