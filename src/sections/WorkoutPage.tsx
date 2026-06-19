import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { IconChevronRight, IconFire, IconPlus, IconStar, IconSword } from "@/icons"
import { useTranslation } from "react-i18next"

type MuscleGroup = "CHEST" | "BACK" | "SHOULDERS" | "ARMS" | "LEGS" | "CORE"

interface ExerciseSet {
  weight: number
  reps: number
}

interface WorkoutExercise {
  id: number
  name: string
  muscleGroup: MuscleGroup
  sets: ExerciseSet[]
}

interface WorkoutPageProps {
  workoutsThisWeek: number
  currentStreak: number
  onReturnToGuild: () => void
  onWorkoutStateChange?: (active: boolean) => void
}

const muscleGroups: MuscleGroup[] = ["CHEST", "BACK", "SHOULDERS", "ARMS", "LEGS", "CORE"]

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function WorkoutPage({
  workoutsThisWeek,
  currentStreak,
  onReturnToGuild,
  onWorkoutStateChange,
}: WorkoutPageProps) {
  const { t, i18n } = useTranslation()
  const [phase, setPhase] = useState<"start" | "active" | "complete">("start")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [exerciseName, setExerciseName] = useState("")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup>("CHEST")
  const [weightInput, setWeightInput] = useState("")
  const [repsInput, setRepsInput] = useState("")
  const [pendingSets, setPendingSets] = useState<ExerciseSet[]>([])
  const exerciseSuggestions = [
    t("workout.suggestions.benchPress"),
    t("workout.suggestions.inclineBenchPress"),
    t("workout.suggestions.dumbbellPress"),
    t("workout.suggestions.dumbbellFly"),
    t("workout.suggestions.cableCrossover"),
    t("workout.suggestions.deadlift"),
    t("workout.suggestions.barbellRow"),
    t("workout.suggestions.latPulldown"),
    t("workout.suggestions.pullUp"),
    t("workout.suggestions.seatedRow"),
    t("workout.suggestions.overheadPress"),
    t("workout.suggestions.lateralRaise"),
    t("workout.suggestions.facePull"),
    t("workout.suggestions.bicepCurl"),
    t("workout.suggestions.hammerCurl"),
    t("workout.suggestions.tricepExtension"),
    t("workout.suggestions.tricepsPushdown"),
    t("workout.suggestions.squat"),
    t("workout.suggestions.frontSquat"),
    t("workout.suggestions.legPress"),
    t("workout.suggestions.legCurl"),
    t("workout.suggestions.legExtension"),
    t("workout.suggestions.romanianDeadlift"),
    t("workout.suggestions.lunges"),
    t("workout.suggestions.plank"),
    t("workout.suggestions.crunch"),
    t("workout.suggestions.hangingLegRaise"),
  ]
  const formatToday = () =>
    new Intl.DateTimeFormat(i18n.language === "ja" ? "ja-JP" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date())

  useEffect(() => {
    onWorkoutStateChange?.(phase === "active")
  }, [onWorkoutStateChange, phase])

  useEffect(() => {
    if (phase !== "active") {
      return
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [phase])

  const filteredSuggestions = useMemo(() => {
    const query = exerciseName.trim().toLowerCase()

    if (!query) {
      return exerciseSuggestions
    }

    return exerciseSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(query),
    )
  }, [exerciseName])

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const totalReps = exercises.reduce(
    (sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + set.reps, 0),
    0,
  )
  const totalWeight = exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.reduce((setSum, set) => setSum + set.weight * set.reps, 0),
    0,
  )
  const xpEarned = totalSets * 10 + Math.floor(elapsedSeconds / 60) * 5

  const resetExerciseForm = () => {
    setExerciseName("")
    setSelectedMuscleGroup("CHEST")
    setWeightInput("")
    setRepsInput("")
    setPendingSets([])
  }

  const handleBeginQuest = () => {
    setPhase("active")
    setElapsedSeconds(0)
    setExercises([])
    setShowExerciseForm(false)
    resetExerciseForm()
  }

  const handleAddSet = () => {
    const weight = Number(weightInput)
    const reps = Number(repsInput)

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || reps <= 0) {
      return
    }

    setPendingSets((current) => [...current, { weight, reps }])
    setWeightInput("")
    setRepsInput("")
  }

  const handleDoneExercise = () => {
    const trimmedName = exerciseName.trim()

    if (!trimmedName || pendingSets.length === 0) {
      return
    }

    setExercises((current) => [
      ...current,
      {
        id: Date.now(),
        name: trimmedName,
        muscleGroup: selectedMuscleGroup,
        sets: pendingSets,
      },
    ])
    setShowExerciseForm(false)
    resetExerciseForm()
  }

  const handleCompleteQuest = () => {
    if (exercises.length === 0) {
      return
    }

    setShowExerciseForm(false)
    setPhase("complete")
  }

  const handleReturnToGuild = () => {
    setPhase("start")
    setElapsedSeconds(0)
    setExercises([])
    setShowExerciseForm(false)
    resetExerciseForm()
    onReturnToGuild()
  }

  return (
    <section className="parchment-bg min-h-full px-4 pt-4 pb-24">
      {phase === "start" ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="pixel-border overflow-hidden">
            <div className="stone-bg px-4 py-5 text-parchment">
              <div className="mb-2 pixel-xs font-pixel text-gold">{t("workout.recordingLabel")}</div>
              <h1 className="pixel-lg font-pixel text-parchment">{t("workout.trainingQuest")}</h1>
              <p className="mt-3 text-sm text-parchment opacity-85">{formatToday()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("workout.thisWeek")}</div>
              <div className="mt-2 pixel-lg font-pixel text-ink">{workoutsThisWeek}</div>
              <div className="mt-1 text-xs text-ink-light">{t("workout.workoutsLogged")}</div>
            </div>
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("common.streak")}</div>
              <div className="mt-2 flex items-center gap-2">
                <IconFire className="flame-icon h-8 w-8" />
                <span className="pixel-lg font-pixel text-ink">{currentStreak}</span>
              </div>
              <div className="mt-1 text-xs text-ink-light">{t("workout.daysUnbroken")}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBeginQuest}
            className="w-full pixel-border-gold bg-gold px-4 py-5 font-pixel pixel-md text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
          >
            {t("workout.beginQuest")}
          </button>
        </motion.div>
      ) : null}

      {phase === "active" ? (
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="pixel-border overflow-hidden">
            <div className="stone-bg px-4 py-4 text-parchment">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="pixel-xs font-pixel text-gold">{t("workout.activeWorkout")}</span>
                <span className="pixel-xs font-pixel text-parchment opacity-80">{formatToday()}</span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="pixel-xs font-pixel text-parchment opacity-70">{t("workout.elapsedTime")}</div>
                  <div className="mt-2 pixel-2xl font-pixel text-gold">{formatElapsedTime(elapsedSeconds)}</div>
                </div>
                <div className="text-right">
                  <div className="pixel-xs font-pixel text-parchment opacity-70">{t("common.exercises")}</div>
                  <div className="mt-2 pixel-lg font-pixel text-parchment">{exercises.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pixel-border bg-parchment px-3 py-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="pixel-sm font-pixel text-ink">{t("workout.exerciseLog")}</h2>
              <span className="pixel-xs font-pixel text-ink opacity-70">{totalSets} {t("common.sets")}</span>
            </div>

            {exercises.length === 0 ? (
              <div className="pixel-border-inset parchment-dark-bg px-3 py-4 text-center text-sm text-ink-light">
                {t("workout.noExercises")}
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="pixel-border-inset parchment-dark-bg px-3 py-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="pixel-sm font-pixel text-ink">{exercise.name}</div>
                        <div className="mt-1 pixel-xs font-pixel text-ink opacity-70">{t(`workout.muscleGroups.${exercise.muscleGroup}`)}</div>
                      </div>
                      <div className="pixel-xs font-pixel text-gold">{exercise.sets.length} {t("common.sets")}</div>
                    </div>
                    <div className="space-y-1 text-sm text-ink">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={`${exercise.id}-${setIndex}`} className="flex items-center justify-between gap-2">
                          <span>{t("common.sets")} {setIndex + 1}</span>
                          <span>{set.weight}kg x {set.reps}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pixel-xs font-pixel text-ink opacity-70">
                      {t("workout.trackedSummary", { sets: exercise.sets.length })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowExerciseForm((current) => !current)}
            className="w-full pixel-border bg-parchment-dark px-4 py-4 font-pixel pixel-sm text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
          >
            {showExerciseForm ? t("workout.closeForm") : t("workout.addExercise")}
          </button>

          {showExerciseForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25 }}
              className="pixel-border bg-parchment px-3 py-4"
            >
              <div className="mb-4 flex items-center gap-2">
                <IconPlus className="h-4 w-4 text-gold" />
                <h2 className="pixel-sm font-pixel text-ink">{t("workout.exerciseForm")}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block pixel-xs font-pixel text-ink">{t("workout.exerciseName")}</label>
                  <input
                    value={exerciseName}
                    onChange={(event) => setExerciseName(event.target.value)}
                    list="exercise-suggestions"
                    placeholder={t("workout.exerciseNamePlaceholder")}
                    className="w-full pixel-border-inset parchment-dark-bg px-3 py-3 text-sm text-ink outline-none"
                  />
                  <datalist id="exercise-suggestions">
                    {filteredSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div className="mb-2 block pixel-xs font-pixel text-ink">{t("workout.muscleGroup")}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {muscleGroups.map((group) => {
                      const selected = group === selectedMuscleGroup

                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => setSelectedMuscleGroup(group)}
                          className={`px-3 py-3 font-pixel pixel-xs transition-transform active:translate-y-px ${
                            selected ? "pixel-border-gold bg-gold text-ink" : "pixel-border bg-parchment-dark text-ink"
                          }`}
                        >
                          {t(`workout.muscleGroups.${group}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block pixel-xs font-pixel text-ink">{t("workout.weightKg")}</label>
                    <input
                      value={weightInput}
                      onChange={(event) => setWeightInput(event.target.value)}
                      inputMode="decimal"
                      placeholder="80"
                      className="w-full pixel-border-inset parchment-dark-bg px-3 py-3 text-sm text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block pixel-xs font-pixel text-ink">{t("workout.reps")}</label>
                    <input
                      value={repsInput}
                      onChange={(event) => setRepsInput(event.target.value)}
                      inputMode="numeric"
                      placeholder="10"
                      className="w-full pixel-border-inset parchment-dark-bg px-3 py-3 text-sm text-ink outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddSet}
                  className="w-full pixel-border-gold bg-gold px-4 py-3 font-pixel pixel-sm text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
                >
                  {t("workout.addSet")}
                </button>

                <div className="pixel-border-inset parchment-dark-bg px-3 py-3">
                  <div className="mb-2 pixel-xs font-pixel text-ink opacity-70">{t("workout.setsRecorded")}</div>
                  {pendingSets.length === 0 ? (
                    <div className="text-sm text-ink-light">{t("workout.noSets")}</div>
                  ) : (
                    <div className="space-y-2 text-sm text-ink">
                      {pendingSets.map((set, index) => (
                        <div key={`${set.weight}-${set.reps}-${index}`} className="flex items-center justify-between gap-2">
                          <span>{t("common.sets")} {index + 1}</span>
                          <span>{set.weight}kg x {set.reps}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDoneExercise}
                  className="w-full pixel-border bg-parchment-dark px-4 py-3 font-pixel pixel-sm text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
                >
                  {t("workout.done")}
                </button>
              </div>
            </motion.div>
          ) : null}

          <button
            type="button"
            onClick={handleCompleteQuest}
            disabled={exercises.length === 0}
            className="w-full pixel-border-gold px-4 py-4 font-pixel pixel-sm text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: exercises.length === 0 ? "#D4BC88" : "#FFB800" }}
          >
            {t("workout.completeQuest")}
          </button>
        </motion.div>
      ) : null}

      {phase === "complete" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="pixel-border overflow-hidden">
            <div className="stone-bg px-4 py-5 text-center text-parchment">
              <div className="mb-3 flex justify-center text-gold">
                <IconStar className="h-8 w-8" />
              </div>
              <div className="pixel-xs font-pixel text-gold">{t("workout.victoryFanfare")}</div>
              <h1 className="mt-2 pixel-xl font-pixel text-parchment">{t("workout.questComplete")}</h1>
              <p className="mt-3 text-sm text-parchment opacity-85">
                {t("workout.questCompleteDescription")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("workout.totalTime")}</div>
              <div className="mt-2 pixel-sm font-pixel text-ink">{formatElapsedTime(elapsedSeconds)}</div>
            </div>
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("common.exercises")}</div>
              <div className="mt-2 pixel-sm font-pixel text-ink">{exercises.length}</div>
            </div>
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("workout.totalSets")}</div>
              <div className="mt-2 pixel-sm font-pixel text-ink">{totalSets}</div>
            </div>
            <div className="pixel-border-inset parchment-dark-bg px-3 py-4">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("workout.totalReps")}</div>
              <div className="mt-2 pixel-sm font-pixel text-ink">{totalReps}</div>
            </div>
          </div>

          <div className="pixel-border bg-parchment px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <IconSword className="h-4 w-4 text-gold" />
              <h2 className="pixel-sm font-pixel text-ink">{t("workout.rewardSummary")}</h2>
            </div>
            <div className="space-y-2 text-sm text-ink">
              <div className="flex items-center justify-between gap-2">
                <span>{t("workout.totalWeightMoved")}</span>
                <span>{totalWeight} kg</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>{t("workout.setXp")}</span>
                <span>{totalSets * 10} XP</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>{t("workout.timeBonus")}</span>
                <span>{Math.floor(elapsedSeconds / 60) * 5} XP</span>
              </div>
            </div>
            <div className="mt-4 pixel-border-gold bg-gold px-3 py-4 text-center">
              <div className="pixel-xs font-pixel text-ink opacity-70">{t("common.xpEarned")}</div>
              <div className="mt-2 pixel-xl font-pixel text-ink">{xpEarned} XP</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReturnToGuild}
            className="w-full pixel-border-gold bg-gold px-4 py-4 font-pixel pixel-sm text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px"
          >
            <span className="inline-flex items-center gap-2">
              {t("workout.returnToGuild")}
              <IconChevronRight className="h-4 w-4" />
            </span>
          </button>
        </motion.div>
      ) : null}
    </section>
  )
}
