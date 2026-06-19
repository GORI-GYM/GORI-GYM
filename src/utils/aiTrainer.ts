import type { GorillaEmotion } from "@/utils/gorillaEmotion"
import { exerciseBodyPartLabels, exerciseDatabase, getExerciseGuideEntry, normalizeExerciseName } from "@/utils/exerciseDatabase"
import type { MonthlyCharacterProgressSummary } from "@/utils/monthlyCharacterProgress"
import type { TrainingEntry } from "@/sections/TrainingPage"
import type { WeeklyProgressSummary } from "@/utils/weeklyProgress"

type TrainingBodyPart = TrainingEntry["bodyPart"]
type ExerciseBodyPart = keyof typeof exerciseBodyPartLabels
type AiTrainerGrade = "S" | "A" | "B" | "C" | "D"

export interface AiTrainerInsight {
  title: string
  message: string
  tone: "praise" | "improve" | "warning"
}

export interface AiTrainerBodyPartBalanceItem {
  bodyPart: ExerciseBodyPart
  label: string
  count: number
  percentage: number
}

export interface AiTrainerWeightTrendItem {
  exerciseName: string
  latestWeight: number
  previousWeight: number
  delta: number
  stagnant: boolean
  improving: boolean
  message: string
}

export interface AiTrainerRecommendationItem {
  exerciseName: string
  bodyPart: ExerciseBodyPart
  reason: string
  difficulty: string
}

export interface WeeklyAiReport {
  weekKey: string
  generatedAt: string
  title: string
  summary: string
  highlights: string[]
}

export interface AiTrainerAnalysis {
  hasEnoughData: boolean
  totalSessions: number
  grade: AiTrainerGrade
  gradeComment: string
  greeting: string
  bodyPartBalance: {
    items: AiTrainerBodyPartBalanceItem[]
    insight: AiTrainerInsight
    weakestBodyPart: ExerciseBodyPart | null
  }
  weightTrends: {
    items: AiTrainerWeightTrendItem[]
    insight: AiTrainerInsight
  }
  frequency: {
    completed: number
    goal: number
    achievementRate: number
    insight: AiTrainerInsight
  }
  recovery: {
    consecutiveBodyParts: string[]
    insight: AiTrainerInsight
  }
  recommendations: AiTrainerRecommendationItem[]
  weeklyReport: WeeklyAiReport | null
  weeklyReportReady: boolean
}

export const AI_TRAINER_WEEKLY_REPORT_STORAGE_KEY = "gym-quest-ai-trainer-weekly-report"

const DAY_MS = 24 * 60 * 60 * 1000
const BODY_PART_ORDER: ExerciseBodyPart[] = ["chest", "back", "legs", "shoulders", "biceps", "triceps"]

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

function getEntryDate(entry: TrainingEntry, now = new Date()) {
  if (entry.dateKey) {
    return parseDateKey(entry.dateKey)
  }

  const baseDate = startOfDay(now)
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

function getEntryMaxWeight(entry: TrainingEntry) {
  return entry.sets.reduce((max, set) => Math.max(max, set.weight), 0)
}

function mapTrainingBodyPartToExerciseBodyPart(bodyPart: TrainingBodyPart): ExerciseBodyPart {
  switch (bodyPart) {
    case "CHEST":
      return "chest"
    case "BACK":
      return "back"
    case "LEGS":
      return "legs"
    case "SHOULDERS":
      return "shoulders"
    case "BICEPS":
      return "biceps"
    case "TRICEPS":
      return "triceps"
  }
}

function resolveExerciseBodyPart(entry: TrainingEntry): ExerciseBodyPart {
  const guide = getExerciseGuideEntry(entry.exerciseName)
  return guide?.bodyPart ?? mapTrainingBodyPartToExerciseBodyPart(entry.bodyPart)
}

function getUniqueSessionDateKeys(entries: TrainingEntry[], now = new Date()) {
  return Array.from(new Set(entries.map((entry) => toDateKey(getEntryDate(entry, now))))).sort((left, right) => left.localeCompare(right))
}

function getWeekStart(date = new Date()) {
  const normalized = startOfDay(date)
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

function getPreviousWeekRange(referenceDate = new Date()) {
  const currentWeekStart = getWeekStart(referenceDate)
  const previousWeekStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - 7)
  const previousWeekEnd = new Date(previousWeekStart.getFullYear(), previousWeekStart.getMonth(), previousWeekStart.getDate() + 6)
  return {
    start: previousWeekStart,
    end: previousWeekEnd,
    weekKey: `${toDateKey(previousWeekStart)}_${toDateKey(previousWeekEnd)}`,
  }
}

function getStoredWeeklyReport(): WeeklyAiReport | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(AI_TRAINER_WEEKLY_REPORT_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WeeklyAiReport
  } catch {
    return null
  }
}

export function persistWeeklyAiReport(report: WeeklyAiReport) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(AI_TRAINER_WEEKLY_REPORT_STORAGE_KEY, JSON.stringify(report))
}

export function generateWeeklyAiReport(
  entries: TrainingEntry[],
  weeklyProgress: WeeklyProgressSummary,
  monthlyCharacterProgress: MonthlyCharacterProgressSummary,
  referenceDate = new Date(),
) {
  const range = getPreviousWeekRange(referenceDate)
  const previousWeekEntries = entries.filter((entry) => {
    const date = getEntryDate(entry, referenceDate)
    return date >= range.start && date <= range.end
  })

  const sessionDays = new Set(previousWeekEntries.map((entry) => toDateKey(getEntryDate(entry, referenceDate))))
  const totalVolume = previousWeekEntries.reduce(
    (sum, entry) => sum + entry.sets.reduce((entrySum, set) => entrySum + set.weight * (set.reps ?? 0), 0),
    0,
  )
  const topExercise = previousWeekEntries.reduce<{ name: string; volume: number } | null>((best, entry) => {
    const volume = entry.sets.reduce((entrySum, set) => entrySum + set.weight * (set.reps ?? 0), 0)
    if (!best || volume > best.volume) {
      return { name: entry.exerciseName, volume }
    }
    return best
  }, null)

  const highlights = [
    `先週のトレーニング日は${sessionDays.size}日だ。目標${weeklyProgress.weeklyGoal}回に対して${sessionDays.size}回、ここを積み上げればもっと強くなれるぞ。`,
    `総ボリュームは${Math.round(totalVolume).toLocaleString()}kg。積み上げた仕事量は裏切らない。`,
    topExercise ? `一番気合いが入っていたのは${topExercise.name}だ。お前やるじゃん！` : "先週は記録が少なめだ。今週はまず1回ジムに行こう。",
    `月間レベルはLv.${monthlyCharacterProgress.monthlyLevel}、月間XPは${monthlyCharacterProgress.monthlyXP}だ。勢いはまだ残ってるぞ。`,
  ]

  return {
    weekKey: range.weekKey,
    generatedAt: referenceDate.toISOString(),
    title: "先週のAIレポート",
    summary: sessionDays.size > 0 ? `先週は${sessionDays.size}日動けている。今週はその流れを切らすな。` : "おい、最近サボってないか？ 先週の記録が見当たらないぞ。",
    highlights,
  } satisfies WeeklyAiReport
}

export function ensureWeeklyAiReport(
  entries: TrainingEntry[],
  weeklyProgress: WeeklyProgressSummary,
  monthlyCharacterProgress: MonthlyCharacterProgressSummary,
  referenceDate = new Date(),
) {
  const range = getPreviousWeekRange(referenceDate)
  const stored = getStoredWeeklyReport()
  if (stored?.weekKey === range.weekKey) {
    return stored
  }

  const report = generateWeeklyAiReport(entries, weeklyProgress, monthlyCharacterProgress, referenceDate)
  persistWeeklyAiReport(report)
  return report
}

function buildGreeting(emotion: GorillaEmotion, grade: AiTrainerGrade) {
  if (grade === "S" || grade === "A") {
    return "ウホッ、かなり仕上がってるな。お前やるじゃん！"
  }
  if (emotion === "ANGRY") {
    return "ウホッ。数字は正直だぞ。ここを直せばもっと強くなれるぞ。"
  }
  return "ウホッ、記録を全部見た。今日は俺が次の一手を教えてやる。"
}

export function analyzeAiTrainer(
  entries: TrainingEntry[],
  weeklyProgress: WeeklyProgressSummary,
  monthlyCharacterProgress: MonthlyCharacterProgressSummary,
  gorillaEmotion: GorillaEmotion,
  referenceDate = new Date(),
): AiTrainerAnalysis {
  const sortedEntries = [...entries].sort((left, right) => getEntryDate(right, referenceDate).getTime() - getEntryDate(left, referenceDate).getTime())
  const sessionDateKeys = getUniqueSessionDateKeys(sortedEntries, referenceDate)
  const hasEnoughData = sessionDateKeys.length >= 5

  const monthAgo = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() - 30)
  const recentEntries = sortedEntries.filter((entry) => getEntryDate(entry, referenceDate) >= monthAgo)

  const bodyPartCounts = BODY_PART_ORDER.reduce<Record<ExerciseBodyPart, number>>((accumulator, bodyPart) => {
    accumulator[bodyPart] = 0
    return accumulator
  }, {} as Record<ExerciseBodyPart, number>)

  recentEntries.forEach((entry) => {
    bodyPartCounts[resolveExerciseBodyPart(entry)] += 1
  })

  const totalRecentEntries = recentEntries.length || 1
  const bodyPartItems = BODY_PART_ORDER.map((bodyPart) => {
    const count = bodyPartCounts[bodyPart]
    return {
      bodyPart,
      label: exerciseBodyPartLabels[bodyPart],
      count,
      percentage: Math.round((count / totalRecentEntries) * 100),
    }
  })

  const weakestBodyPart = [...bodyPartItems].sort((left, right) => left.count - right.count)[0]
  const strongestBodyPart = [...bodyPartItems].sort((left, right) => right.count - left.count)[0]
  const bodyPartInsight: AiTrainerInsight = weakestBodyPart.count === strongestBodyPart.count
    ? {
        title: "部位バランス",
        message: "全身をまんべんなく触れている。いい配分だ、この調子で回していこう。",
        tone: "praise",
      }
    : weakestBodyPart.percentage <= 10
      ? {
          title: "部位バランス",
          message: `${weakestBodyPart.label}トレが全体の${weakestBodyPart.percentage}%しかない。週1回は${weakestBodyPart.label}の日を入れよう。ここを直せばもっと強くなれるぞ。`,
          tone: "improve",
        }
      : {
          title: "部位バランス",
          message: `${strongestBodyPart.label}が強め、${weakestBodyPart.label}がやや少なめだ。次は${weakestBodyPart.label}を足して全身を仕上げよう。`,
          tone: "improve",
        }

  const groupedByExercise = sortedEntries.reduce<Map<string, TrainingEntry[]>>((map, entry) => {
    const key = normalizeExerciseName(entry.exerciseName)
    const current = map.get(key) ?? []
    current.push(entry)
    map.set(key, current)
    return map
  }, new Map())

  const weightTrendItems = Array.from(groupedByExercise.values())
    .map((history) => [...history].sort((left, right) => getEntryDate(left, referenceDate).getTime() - getEntryDate(right, referenceDate).getTime()))
    .filter((history) => history.length >= 2)
    .map((history) => {
      const latest = history[history.length - 1]
      const previous = history[history.length - 2]
      const latestWeight = getEntryMaxWeight(latest)
      const previousWeight = getEntryMaxWeight(previous)
      const delta = latestWeight - previousWeight
      const daysBetween = Math.floor((getEntryDate(latest, referenceDate).getTime() - getEntryDate(previous, referenceDate).getTime()) / DAY_MS)
      const stagnant = delta === 0 && daysBetween >= 14
      const improving = delta >= 2.5
      return {
        exerciseName: latest.exerciseName,
        latestWeight,
        previousWeight,
        delta,
        stagnant,
        improving,
        message: improving
          ? `${latest.exerciseName}、前回比+${delta}kg！ お前やるじゃん！`
          : stagnant
            ? `${latest.exerciseName}が停滞中だ。セット数を増やすか、重量を少し下げてレップ数を増やしてみよう。`
            : `${latest.exerciseName}は${latestWeight}kgを維持している。次はフォームを固めて1段上を狙え。`,
      } satisfies AiTrainerWeightTrendItem
    })
    .sort((left, right) => {
      if (left.stagnant !== right.stagnant) return left.stagnant ? -1 : 1
      if (left.improving !== right.improving) return left.improving ? -1 : 1
      return right.delta - left.delta
    })
    .slice(0, 4)

  const stagnantCount = weightTrendItems.filter((item) => item.stagnant).length
  const improvingCount = weightTrendItems.filter((item) => item.improving).length
  const weightInsight: AiTrainerInsight = improvingCount > stagnantCount
    ? {
        title: "重量推移",
        message: weightTrendItems[0]?.message ?? "重量は順調だ。次も丁寧に積み上げよう。",
        tone: "praise",
      }
    : stagnantCount > 0
      ? {
          title: "重量推移",
          message: weightTrendItems.find((item) => item.stagnant)?.message ?? "停滞が見える。刺激を変えて壁を壊すぞ。",
          tone: "improve",
        }
      : {
          title: "重量推移",
          message: "大きな停滞はない。フォームと回数を揃えて次の伸びにつなげよう。",
          tone: "praise",
        }

  const achievementRate = weeklyProgress.weeklyGoal > 0 ? Math.round((weeklyProgress.completedDays / weeklyProgress.weeklyGoal) * 100) : 0
  const frequencyInsight: AiTrainerInsight = achievementRate >= 100
    ? {
        title: "頻度",
        message: `今週は目標${weeklyProgress.weeklyGoal}回を達成済みだ。ストリーク${weeklyProgress.currentStreak}週、かなりいい流れだぞ。`,
        tone: "praise",
      }
    : achievementRate >= 60
      ? {
          title: "頻度",
          message: `今週は目標${weeklyProgress.weeklyGoal}回中${weeklyProgress.completedDays}回だ。あと1回増やせば流れに乗れる。`,
          tone: "improve",
        }
      : {
          title: "頻度",
          message: `今週は目標${weeklyProgress.weeklyGoal}回中${weeklyProgress.completedDays}回。おい、最近サボってないか？ まずは次の1回を入れよう。`,
          tone: "warning",
        }

  const entriesByDay = Array.from(
    sortedEntries.reduce<Map<string, Set<ExerciseBodyPart>>>((map, entry) => {
      const dateKey = toDateKey(getEntryDate(entry, referenceDate))
      const current = map.get(dateKey) ?? new Set<ExerciseBodyPart>()
      current.add(resolveExerciseBodyPart(entry))
      map.set(dateKey, current)
      return map
    }, new Map()),
  )
    .map(([dateKey, bodyParts]) => ({ dateKey, bodyParts: Array.from(bodyParts) }))
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))

  const consecutiveBodyParts = new Set<string>()
  for (let index = 1; index < entriesByDay.length; index += 1) {
    const previous = entriesByDay[index - 1]
    const current = entriesByDay[index]
    const dayDiff = Math.floor((parseDateKey(current.dateKey).getTime() - parseDateKey(previous.dateKey).getTime()) / DAY_MS)
    if (dayDiff !== 1) continue
    previous.bodyParts.forEach((bodyPart) => {
      if (current.bodyParts.includes(bodyPart)) {
        consecutiveBodyParts.add(exerciseBodyPartLabels[bodyPart])
      }
    })
  }

  const recoveryInsight: AiTrainerInsight = consecutiveBodyParts.size > 0
    ? {
        title: "休息",
        message: `${Array.from(consecutiveBodyParts).join("・")}を連日やっている。筋肉の回復には48時間必要だ。明日は別の部位にしよう。`,
        tone: "warning",
      }
    : {
        title: "休息",
        message: "連日の同部位トレは見当たらない。回復の回し方は悪くないぞ。",
        tone: "praise",
      }

  let score = 0
  if (achievementRate >= 100) score += 2
  else if (achievementRate >= 60) score += 1
  if (improvingCount > 0) score += 2
  if (stagnantCount > 0) score -= 1
  if (consecutiveBodyParts.size > 0) score -= 1
  if (weakestBodyPart.percentage <= 10) score -= 1
  if (monthlyCharacterProgress.monthlyLevel >= 8) score += 1

  const grade: AiTrainerGrade = score >= 4 ? "S" : score >= 3 ? "A" : score >= 1 ? "B" : score >= 0 ? "C" : "D"
  const gradeComment = grade === "S"
    ? "仕上がりはSランクだ。継続も伸びも文句なし、かなり強いぞ。"
    : grade === "A"
      ? "Aランクだ。かなり良い流れだ、このまま積み上げれば一段上に行ける。"
      : grade === "B"
        ? "Bランクだ。土台はできている。弱点を1つ潰せば一気に伸びるぞ。"
        : grade === "C"
          ? "Cランクだ。ここを直せばもっと強くなれるぞ。まずは頻度と配分を整えよう。"
          : "Dランクだ。おい、最近サボってないか？ まずは週のリズムを取り戻せ。"

  const recommendedBodyParts = BODY_PART_ORDER
    .map((bodyPart) => ({
      bodyPart,
      count: bodyPartCounts[bodyPart],
    }))
    .sort((left, right) => left.count - right.count)
    .slice(0, 3)

  const usedExerciseNames = new Set<string>()
  const recommendations = recommendedBodyParts.flatMap(({ bodyPart }) => {
    return exerciseDatabase
      .filter((exercise) => exercise.bodyPart === bodyPart && !usedExerciseNames.has(exercise.name))
      .slice(0, 1)
      .map((exercise) => {
        usedExerciseNames.add(exercise.name)
        return {
          exerciseName: exercise.name,
          bodyPart,
          difficulty: exercise.difficulty,
          reason: bodyPart === weakestBodyPart.bodyPart
            ? `${exerciseBodyPartLabels[bodyPart]}の頻度が少ない。次回はここを補強しよう。`
            : stagnantCount > 0
              ? "刺激を変えて停滞を抜けるための候補だ。"
              : "全身バランスを整えるために入れておきたい種目だ。",
        } satisfies AiTrainerRecommendationItem
      })
  }).slice(0, 3)

  const weeklyReport = ensureWeeklyAiReport(entries, weeklyProgress, monthlyCharacterProgress, referenceDate)
  const weeklyReportReady = referenceDate.getDay() === 1 && weeklyReport.weekKey === getPreviousWeekRange(referenceDate).weekKey

  return {
    hasEnoughData,
    totalSessions: sessionDateKeys.length,
    grade,
    gradeComment,
    greeting: buildGreeting(gorillaEmotion, grade),
    bodyPartBalance: {
      items: bodyPartItems,
      insight: bodyPartInsight,
      weakestBodyPart: weakestBodyPart.bodyPart,
    },
    weightTrends: {
      items: weightTrendItems,
      insight: weightInsight,
    },
    frequency: {
      completed: weeklyProgress.completedDays,
      goal: weeklyProgress.weeklyGoal,
      achievementRate,
      insight: frequencyInsight,
    },
    recovery: {
      consecutiveBodyParts: Array.from(consecutiveBodyParts),
      insight: recoveryInsight,
    },
    recommendations,
    weeklyReport,
    weeklyReportReady,
  }
}