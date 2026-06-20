export type RoutineBodyPart = "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "LEGS"

export interface Exercise {
  id: string
  en: string
  ja: string
}

export interface ExerciseOption {
  key: string
  bodyPart: RoutineBodyPart
  exercises: Exercise[]
}

export interface RoutineExercise {
  id: string
  nameKey: string
  bodyPart: RoutineBodyPart
  weightStep: 1 | 5
  sets: number
  targetWeight: number
  weights?: number[]
  targetReps: number
}

export interface Routine {
  id: string
  nameKey?: string
  customName: string
  targetParts: RoutineBodyPart[]
  exercises: RoutineExercise[]
}

export type RecommendedTrainingLevel = "starter" | "builder" | "warrior"

export interface RecommendedPlanDay {
  id: string
  label: string
  focus: RoutineBodyPart[]
  exercises: RoutineExercise[]
}

export interface RecommendedWeeklyPlan {
  level: RecommendedTrainingLevel
  sessionsPerWeek: number
  summary: string
  days: RecommendedPlanDay[]
}

export const routineBodyParts: RoutineBodyPart[] = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS"]

export const exerciseOptions: ExerciseOption[] = [
  {
    key: "CHEST",
    bodyPart: "CHEST",
    exercises: [
      { id: "benchPress", en: "Bench Press", ja: "ベンチプレス" },
      { id: "inclineBenchPress", en: "Incline Bench Press", ja: "インクラインベンチプレス" },
      { id: "declineBenchPress", en: "Decline Bench Press", ja: "デクラインベンチプレス" },
      { id: "dumbbellPress", en: "Dumbbell Press", ja: "ダンベルプレス" },
      { id: "inclineDumbbellPress", en: "Incline Dumbbell Press", ja: "インクラインダンベルプレス" },
      { id: "dumbbellFly", en: "Dumbbell Fly", ja: "ダンベルフライ" },
      { id: "cableCrossover", en: "Cable Crossover", ja: "ケーブルクロスオーバー" },
      { id: "chestPressMachine", en: "Chest Press Machine", ja: "チェストプレスマシン" },
      { id: "pecDeck", en: "Pec Deck", ja: "ペックデック" },
      { id: "dipsChest", en: "Dips (Chest)", ja: "ディップス (胸)" },
      { id: "pushUp", en: "Push Up", ja: "プッシュアップ" },
    ],
  },
  {
    key: "BACK",
    bodyPart: "BACK",
    exercises: [
      { id: "deadlift", en: "Deadlift", ja: "デッドリフト" },
      { id: "latPulldown", en: "Lat Pulldown", ja: "ラットプルダウン" },
      { id: "bentOverRow", en: "Bent Over Row", ja: "ベントオーバーロウ" },
      { id: "chinUp", en: "Chin Up", ja: "チンアップ" },
      { id: "seatedRow", en: "Seated Row", ja: "シーテッドロウ" },
      { id: "tBarRow", en: "T-Bar Row", ja: "Tバーロウ" },
      { id: "oneArmDumbbellRow", en: "One Arm Dumbbell Row", ja: "ワンハンドダンベルロウ" },
      { id: "cableRow", en: "Cable Row", ja: "ケーブルロウ" },
      { id: "pullUp", en: "Pull Up", ja: "プルアップ" },
      { id: "backExtension", en: "Back Extension", ja: "バックエクステンション" },
      { id: "machineRow", en: "Machine Row", ja: "マシンロウ" },
    ],
  },
  {
    key: "SHOULDERS",
    bodyPart: "SHOULDERS",
    exercises: [
      { id: "overheadPress", en: "Overhead Press", ja: "オーバーヘッドプレス" },
      { id: "dumbbellShoulderPress", en: "Dumbbell Shoulder Press", ja: "ダンベルショルダープレス" },
      { id: "sideRaise", en: "Side Raise", ja: "サイドレイズ" },
      { id: "frontRaise", en: "Front Raise", ja: "フロントレイズ" },
      { id: "rearDeltFly", en: "Rear Delt Fly", ja: "リアデルトフライ" },
      { id: "arnoldPress", en: "Arnold Press", ja: "アーノルドプレス" },
      { id: "uprightRow", en: "Upright Row", ja: "アップライトロウ" },
      { id: "facePull", en: "Face Pull", ja: "フェイスプル" },
      { id: "cableSideRaise", en: "Cable Side Raise", ja: "ケーブルサイドレイズ" },
      { id: "shrug", en: "Shrug", ja: "シュラッグ" },
    ],
  },
  {
    key: "BICEPS",
    bodyPart: "BICEPS",
    exercises: [
      { id: "barbellCurl", en: "Barbell Curl", ja: "バーベルカール" },
      { id: "dumbbellCurl", en: "Dumbbell Curl", ja: "ダンベルカール" },
      { id: "bicepCurl", en: "Bicep Curl", ja: "バイセップカール" },
      { id: "hammerCurl", en: "Hammer Curl", ja: "ハンマーカール" },
      { id: "inclineDumbbellCurl", en: "Incline Dumbbell Curl", ja: "インクラインダンベルカール" },
      { id: "concentrationCurl", en: "Concentration Curl", ja: "コンセントレーションカール" },
      { id: "cableCurl", en: "Cable Curl", ja: "ケーブルカール" },
      { id: "preacherCurl", en: "Preacher Curl", ja: "プリーチャーカール" },
      { id: "ezBarCurl", en: "EZ Bar Curl", ja: "EZバーカール" },
    ],
  },
  {
    key: "TRICEPS",
    bodyPart: "TRICEPS",
    exercises: [
      { id: "tricepsPushdown", en: "Triceps Pushdown", ja: "トライセプスプッシュダウン" },
      { id: "tricepsExtension", en: "Triceps Extension", ja: "トライセプスエクステンション" },
      { id: "tricepExtension", en: "Tricep Extension", ja: "トライセプスエクステンション" },
      { id: "skullCrusher", en: "Skull Crusher", ja: "スカルクラッシャー" },
      { id: "closeGripBenchPress", en: "Close Grip Bench Press", ja: "クローズグリップベンチプレス" },
      { id: "overheadTricepsExtension", en: "Overhead Triceps Extension", ja: "オーバーヘッドトライセプスエクステンション" },
      { id: "dipsTriceps", en: "Dips (Triceps)", ja: "ディップス (三頭筋)" },
      { id: "kickback", en: "Kickback", ja: "キックバック" },
      { id: "cableOverheadExtension", en: "Cable Overhead Extension", ja: "ケーブルオーバーヘッドエクステンション" },
    ],
  },
  {
    key: "LEGS",
    bodyPart: "LEGS",
    exercises: [
      { id: "squat", en: "Squat", ja: "スクワット" },
      { id: "frontSquat", en: "Front Squat", ja: "フロントスクワット" },
      { id: "legPress", en: "Leg Press", ja: "レッグプレス" },
      { id: "legCurl", en: "Leg Curl", ja: "レッグカール" },
      { id: "legExtension", en: "Leg Extension", ja: "レッグエクステンション" },
      { id: "romanianDeadlift", en: "Romanian Deadlift", ja: "ルーマニアンデッドリフト" },
      { id: "bulgarianSplitSquat", en: "Bulgarian Split Squat", ja: "ブルガリアンスクワット" },
      { id: "hipThrust", en: "Hip Thrust", ja: "ヒップスラスト" },
      { id: "calfRaise", en: "Calf Raise", ja: "カーフレイズ" },
      { id: "hackSquat", en: "Hack Squat", ja: "ハックスクワット" },
      { id: "gobletSquat", en: "Goblet Squat", ja: "ゴブレットスクワット" },
      { id: "lunges", en: "Lunges", ja: "ランジ" },
    ],
  },
]

export const flatExerciseOptions = exerciseOptions.flatMap((group) =>
  group.exercises.map((exercise) => ({
    key: exercise.id,
    bodyPart: group.bodyPart,
    en: exercise.en,
    ja: exercise.ja,
  })),
)

const heavyBarbellExerciseKeys = new Set([
  "benchPress",
  "inclineBenchPress",
  "declineBenchPress",
  "deadlift",
  "bentOverRow",
  "overheadPress",
  "barbellCurl",
  "closeGripBenchPress",
  "squat",
  "frontSquat",
  "romanianDeadlift",
])

export function getExerciseWeightStep(optionKey: string): 1 | 5 {
  return heavyBarbellExerciseKeys.has(optionKey) ? 5 : 1
}

export const initialRoutines: Routine[] = [
  {
    id: "routine-chest-triceps",
    nameKey: "chestTriceps",
    customName: "",
    targetParts: ["CHEST", "TRICEPS"],
    exercises: [
      { id: "bench-press", nameKey: "benchPress", bodyPart: "CHEST", weightStep: 5, sets: 4, targetWeight: 80, weights: [80, 80, 77.5, 75], targetReps: 8 },
      { id: "incline-dumbbell-press", nameKey: "inclineDumbbellPress", bodyPart: "CHEST", weightStep: 1, sets: 3, targetWeight: 26, weights: [26, 24, 22], targetReps: 10 },
      { id: "dumbbell-fly", nameKey: "dumbbellFly", bodyPart: "CHEST", weightStep: 1, sets: 3, targetWeight: 14, weights: [14, 12, 10], targetReps: 12 },
      { id: "triceps-extension", nameKey: "tricepsExtension", bodyPart: "TRICEPS", weightStep: 1, sets: 3, targetWeight: 22, weights: [22, 20, 18], targetReps: 12 },
      { id: "dips", nameKey: "dipsTriceps", bodyPart: "TRICEPS", weightStep: 1, sets: 3, targetWeight: 0, weights: [0, 0, 0], targetReps: 12 },
    ],
  },
  {
    id: "routine-back-biceps",
    nameKey: "backBiceps",
    customName: "",
    targetParts: ["BACK", "BICEPS"],
    exercises: [
      { id: "deadlift", nameKey: "deadlift", bodyPart: "BACK", weightStep: 5, sets: 3, targetWeight: 130, weights: [130, 125, 120], targetReps: 5 },
      { id: "lat-pulldown", nameKey: "latPulldown", bodyPart: "BACK", weightStep: 1, sets: 3, targetWeight: 65, weights: [65, 60, 55], targetReps: 10 },
      { id: "bent-over-row", nameKey: "bentOverRow", bodyPart: "BACK", weightStep: 5, sets: 3, targetWeight: 70, weights: [70, 67.5, 65], targetReps: 8 },
      { id: "barbell-curl", nameKey: "barbellCurl", bodyPart: "BICEPS", weightStep: 5, sets: 3, targetWeight: 25, weights: [25, 22.5, 20], targetReps: 12 },
      { id: "hammer-curl", nameKey: "hammerCurl", bodyPart: "BICEPS", weightStep: 1, sets: 3, targetWeight: 14, weights: [14, 12, 10], targetReps: 12 },
    ],
  },
  {
    id: "routine-leg-day",
    nameKey: "legDay",
    customName: "",
    targetParts: ["LEGS"],
    exercises: [
      { id: "squat", nameKey: "squat", bodyPart: "LEGS", weightStep: 5, sets: 4, targetWeight: 110, weights: [110, 105, 100, 95], targetReps: 6 },
      { id: "leg-press", nameKey: "legPress", bodyPart: "LEGS", weightStep: 1, sets: 3, targetWeight: 180, weights: [180, 170, 160], targetReps: 10 },
      { id: "leg-curl", nameKey: "legCurl", bodyPart: "LEGS", weightStep: 1, sets: 3, targetWeight: 45, weights: [45, 40, 35], targetReps: 12 },
      { id: "leg-extension", nameKey: "legExtension", bodyPart: "LEGS", weightStep: 1, sets: 3, targetWeight: 50, weights: [50, 45, 40], targetReps: 12 },
      { id: "calf-raise", nameKey: "calfRaise", bodyPart: "LEGS", weightStep: 1, sets: 3, targetWeight: 60, weights: [60, 55, 50], targetReps: 15 },
    ],
  },
  {
    id: "routine-shoulder-day",
    nameKey: "shoulderDay",
    customName: "",
    targetParts: ["SHOULDERS"],
    exercises: [
      { id: "overhead-press", nameKey: "overheadPress", bodyPart: "SHOULDERS", weightStep: 5, sets: 4, targetWeight: 42.5, weights: [42.5, 40, 37.5, 35], targetReps: 8 },
      { id: "side-raise", nameKey: "sideRaise", bodyPart: "SHOULDERS", weightStep: 1, sets: 3, targetWeight: 8, weights: [8, 7, 6], targetReps: 15 },
      { id: "front-raise", nameKey: "frontRaise", bodyPart: "SHOULDERS", weightStep: 1, sets: 3, targetWeight: 8, weights: [8, 7, 6], targetReps: 12 },
    ],
  },
]

export function createExercise(optionKey: string) {
  const option = flatExerciseOptions.find((item) => item.key === optionKey) ?? flatExerciseOptions[0]
  return {
    id: `${option.key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nameKey: option.key,
    bodyPart: option.bodyPart,
    weightStep: getExerciseWeightStep(option.key),
    sets: 3,
    targetWeight: 20,
    weights: [20, 20, 20],
    targetReps: 10,
  } satisfies RoutineExercise
}

function createRecommendedExercise(optionKey: string, sets: number, targetWeight: number, targetReps: number): RoutineExercise {
  const option = flatExerciseOptions.find((item) => item.key === optionKey) ?? flatExerciseOptions[0]
  return {
    id: `${option.key}-recommended-${Math.random().toString(36).slice(2, 8)}`,
    nameKey: option.key,
    bodyPart: option.bodyPart,
    weightStep: getExerciseWeightStep(option.key),
    sets,
    targetWeight,
    weights: Array.from({ length: sets }, (_, index) => Math.max(0, targetWeight - index * (option.bodyPart === "LEGS" ? 5 : 2))),
    targetReps,
  }
}

const recommendedDayLabels = ["DAY 1", "DAY 2", "DAY 3", "DAY 4", "DAY 5"] as const

function buildRecommendedDay(
  index: number,
  focus: RoutineBodyPart[],
  exerciseConfigs: Array<{ optionKey: string; sets: number; targetWeight: number; targetReps: number }>,
): RecommendedPlanDay {
  return {
    id: `recommended-day-${index + 1}`,
    label: recommendedDayLabels[index] ?? `DAY ${index + 1}`,
    focus,
    exercises: exerciseConfigs.map((config) =>
      createRecommendedExercise(config.optionKey, config.sets, config.targetWeight, config.targetReps),
    ),
  }
}

export function inferRecommendedTrainingLevel(trainingDays: number): RecommendedTrainingLevel {
  if (trainingDays >= 24) return "warrior"
  if (trainingDays >= 8) return "builder"
  return "starter"
}

export function generateRecommendedWeeklyPlan(trainingDays: number): RecommendedWeeklyPlan {
  const level = inferRecommendedTrainingLevel(trainingDays)

  if (level === "warrior") {
    return {
      level,
      sessionsPerWeek: 5,
      summary: "記録量が多いので、部位分割を使った週5回プランを提案します。",
      days: [
        buildRecommendedDay(0, ["CHEST", "TRICEPS"], [
          { optionKey: "chestPressMachine", sets: 4, targetWeight: 30, targetReps: 10 },
          { optionKey: "inclineDumbbellPress", sets: 3, targetWeight: 16, targetReps: 10 },
          { optionKey: "pecDeck", sets: 3, targetWeight: 25, targetReps: 12 },
          { optionKey: "tricepsPushdown", sets: 3, targetWeight: 20, targetReps: 12 },
        ]),
        buildRecommendedDay(1, ["BACK", "BICEPS"], [
          { optionKey: "latPulldown", sets: 4, targetWeight: 30, targetReps: 10 },
          { optionKey: "seatedRow", sets: 3, targetWeight: 25, targetReps: 10 },
          { optionKey: "backExtension", sets: 3, targetWeight: 0, targetReps: 15 },
          { optionKey: "dumbbellCurl", sets: 3, targetWeight: 8, targetReps: 12 },
        ]),
        buildRecommendedDay(2, ["LEGS"], [
          { optionKey: "legPress", sets: 4, targetWeight: 80, targetReps: 10 },
          { optionKey: "legCurl", sets: 3, targetWeight: 20, targetReps: 12 },
          { optionKey: "legExtension", sets: 3, targetWeight: 20, targetReps: 12 },
          { optionKey: "calfRaise", sets: 3, targetWeight: 20, targetReps: 15 },
        ]),
        buildRecommendedDay(3, ["SHOULDERS"], [
          { optionKey: "dumbbellShoulderPress", sets: 4, targetWeight: 10, targetReps: 10 },
          { optionKey: "sideRaise", sets: 3, targetWeight: 4, targetReps: 15 },
          { optionKey: "rearDeltFly", sets: 3, targetWeight: 4, targetReps: 15 },
          { optionKey: "facePull", sets: 3, targetWeight: 15, targetReps: 12 },
        ]),
        buildRecommendedDay(4, ["CHEST", "BACK"], [
          { optionKey: "pushUp", sets: 3, targetWeight: 0, targetReps: 15 },
          { optionKey: "machineRow", sets: 3, targetWeight: 25, targetReps: 12 },
          { optionKey: "cableCrossover", sets: 3, targetWeight: 15, targetReps: 12 },
          { optionKey: "cableRow", sets: 3, targetWeight: 20, targetReps: 12 },
        ]),
      ],
    }
  }

  if (level === "builder") {
    return {
      level,
      sessionsPerWeek: 4,
      summary: "継続できているので、回復も考えた週4回の上半身・下半身ベースで提案します。",
      days: [
        buildRecommendedDay(0, ["CHEST", "TRICEPS"], [
          { optionKey: "chestPressMachine", sets: 3, targetWeight: 25, targetReps: 10 },
          { optionKey: "dumbbellPress", sets: 3, targetWeight: 12, targetReps: 10 },
          { optionKey: "tricepsPushdown", sets: 3, targetWeight: 18, targetReps: 12 },
        ]),
        buildRecommendedDay(1, ["BACK", "BICEPS"], [
          { optionKey: "latPulldown", sets: 3, targetWeight: 25, targetReps: 10 },
          { optionKey: "seatedRow", sets: 3, targetWeight: 20, targetReps: 10 },
          { optionKey: "hammerCurl", sets: 3, targetWeight: 6, targetReps: 12 },
        ]),
        buildRecommendedDay(2, ["LEGS"], [
          { optionKey: "legPress", sets: 4, targetWeight: 60, targetReps: 10 },
          { optionKey: "legCurl", sets: 3, targetWeight: 15, targetReps: 12 },
          { optionKey: "calfRaise", sets: 3, targetWeight: 15, targetReps: 15 },
        ]),
        buildRecommendedDay(3, ["SHOULDERS", "CHEST"], [
          { optionKey: "dumbbellShoulderPress", sets: 3, targetWeight: 8, targetReps: 10 },
          { optionKey: "sideRaise", sets: 3, targetWeight: 4, targetReps: 15 },
          { optionKey: "pushUp", sets: 3, targetWeight: 0, targetReps: 12 },
        ]),
      ],
    }
  }

  return {
    level,
    sessionsPerWeek: 3,
    summary: "まずは習慣化を優先して、全身を無理なく回せる週3回プランを提案します。",
    days: [
      buildRecommendedDay(0, ["CHEST", "BACK"], [
        { optionKey: "chestPressMachine", sets: 3, targetWeight: 20, targetReps: 10 },
        { optionKey: "latPulldown", sets: 3, targetWeight: 20, targetReps: 10 },
        { optionKey: "pushUp", sets: 2, targetWeight: 0, targetReps: 10 },
      ]),
      buildRecommendedDay(1, ["LEGS", "SHOULDERS"], [
        { optionKey: "legPress", sets: 3, targetWeight: 40, targetReps: 10 },
        { optionKey: "legCurl", sets: 2, targetWeight: 10, targetReps: 12 },
        { optionKey: "sideRaise", sets: 2, targetWeight: 2, targetReps: 15 },
      ]),
      buildRecommendedDay(2, ["BACK", "BICEPS", "TRICEPS"], [
        { optionKey: "seatedRow", sets: 3, targetWeight: 15, targetReps: 10 },
        { optionKey: "dumbbellCurl", sets: 2, targetWeight: 4, targetReps: 12 },
        { optionKey: "tricepsPushdown", sets: 2, targetWeight: 12, targetReps: 12 },
      ]),
    ],
  }
}

export function convertRecommendedPlanToRoutines(plan: RecommendedWeeklyPlan): Routine[] {
  return plan.days.map((day, index) => ({
    id: `recommended-routine-${Date.now()}-${index}`,
    customName: `おすすめ ${day.label}`,
    targetParts: day.focus,
    exercises: day.exercises,
  }))
}