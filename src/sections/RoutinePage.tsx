import { useMemo, useState } from "react"
import { AnimatePresence, Reorder, motion } from "framer-motion"
import { IconChevronRight, IconPlus } from "@/icons"
import EmptyState from "@/components/EmptyState"
import { useTranslation } from "react-i18next"
import { createExercise, exerciseOptions, flatExerciseOptions, getExerciseWeightStep, routineBodyParts, type Routine, type RoutineBodyPart } from "@/sections/routineData"

interface RoutinePageProps {
  routines: Routine[]
  onRoutinesChange: React.Dispatch<React.SetStateAction<Routine[]>>
  onStartRoutine: (routine: Routine) => void
}

const bodyPartAccent: Record<RoutineBodyPart, { bg: string; text: string; border: string }> = {
  CHEST: { bg: "#FFF1A8", text: "#1D4ED8", border: "#FFF07A" },
  BACK: { bg: "#E0F2FE", text: "#0369A1", border: "#7DD3FC" },
  SHOULDERS: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  BICEPS: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  TRICEPS: { bg: "#FCE7F3", text: "#BE185D", border: "#F9A8D4" },
  LEGS: { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" },
}

export default function RoutinePage({ routines, onRoutinesChange, onStartRoutine }: RoutinePageProps) {
  const { t } = useTranslation()
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedExercisePanels, setExpandedExercisePanels] = useState<Record<string, string | null>>({})
  const [exercisePickerOpen, setExercisePickerOpen] = useState<Record<string, boolean>>({})
  const [exerciseSearch, setExerciseSearch] = useState<Record<string, string>>({})

  const editingRoutine = useMemo(
    () => routines.find((routine) => routine.id === editingRoutineId) ?? null,
    [editingRoutineId, routines],
  )

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

  const getRoutineName = (routine: Routine) => (
    routine.customName.trim() || (routine.nameKey ? t(`routine.${routine.nameKey}`) : "")
  )

  const getExerciseName = (nameKey: string) => t(`training.suggestions.${nameKey}`)

  const formatExerciseMeta = (sets: number, reps: number, weight: number) => (
    `${sets}${t("common.sets")} ・ ${reps} reps ・ ${weight}kg`
  )

  const openRoutineEditor = (routineId: string) => {
    setEditingRoutineId(routineId)
    setIsCreating(false)
  }

  const updateRoutine = (routineId: string, updater: (routine: Routine) => Routine) => {
    onRoutinesChange((current) => current.map((routine) => routine.id === routineId ? updater(routine) : routine))
  }

  const normalizeExerciseWeights = (weights: number[] | undefined, sets: number, fallbackWeight: number): number[] =>
    Array.from({ length: sets }, (_, index) => {
      const candidate = weights?.[index]
      return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallbackWeight
    })

  const adjustWeightByStep = (weight: number, delta: number, step: number) =>
    Math.max(0, weight + delta * step)

  const updateExerciseSets = (routineId: string, exerciseId: string, nextSets: number) => {
    const clampedSets = Math.min(10, Math.max(1, nextSets))
    updateRoutine(routineId, (routine) => ({
      ...routine,
      exercises: routine.exercises.map((item) => item.id === exerciseId ? {
        ...item,
        sets: clampedSets,
        weights: normalizeExerciseWeights(item.weights, clampedSets, item.targetWeight),
      } : item),
    }))
  }

  const updateExerciseWeights = (routineId: string, exerciseId: string, updater: (weights: number[]) => number[]) => {
    updateRoutine(routineId, (routine) => ({
      ...routine,
      exercises: routine.exercises.map((item) => {
        if (item.id !== exerciseId) {
          return item
        }
        const nextWeights = normalizeExerciseWeights(item.weights, item.sets, item.targetWeight)
        return { ...item, weights: updater(nextWeights) }
      }),
    }))
  }

  const createRoutineId = () => {
    const existingIds = new Set(routines.map((routine) => routine.id))
    let candidate = `routine-${Date.now()}`

    while (existingIds.has(candidate)) {
      candidate = `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }

    return candidate
  }

  const handleCreateRoutine = () => {
    const newRoutine: Routine = {
      id: createRoutineId(),
      customName: "",
      targetParts: [],
      exercises: [createExercise("benchPress")],
    }
    onRoutinesChange((current) => [newRoutine, ...current])
    setEditingRoutineId(newRoutine.id)
    setIsCreating(true)
  }

  const closeEditor = () => {
    setEditingRoutineId(null)
    setIsCreating(false)
  }

  const handleSave = () => {
    closeEditor()
  }

  const handleDeleteRoutine = (routineId: string) => {
    onRoutinesChange((current) => current.filter((routine) => routine.id !== routineId))
    closeEditor()
  }

  const toggleExercisePanel = (exerciseId: string, groupKey: string) => {
    setExpandedExercisePanels((current) => ({
      ...current,
      [exerciseId]: current[exerciseId] === groupKey ? null : groupKey,
    }))
  }

  const toggleExercisePicker = (exerciseId: string) => {
    setExercisePickerOpen((current) => ({
      ...current,
      [exerciseId]: !current[exerciseId],
    }))
  }

  const getFilteredExerciseOptions = (exerciseId: string) => {
    const query = exerciseSearch[exerciseId]?.trim().toLowerCase() ?? ""
    if (!query) return groupedExerciseOptions
    return groupedExerciseOptions
      .map((group) => ({
        ...group,
        translatedExercises: group.translatedExercises.filter((option) =>
          [option.label, option.en, option.ja].some((value) => value.toLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.translatedExercises.length > 0)
  }

  return (
    <section className="min-h-full bg-[#FFFBEA] px-4 pt-4 pb-28 text-[#1E293B] transition-colors duration-200 dark:bg-[#0B0B0B] dark:text-[#F8FAFC]">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_12px_32px_rgba(37,99,235,0.12)] ring-1 ring-[#FFF1A8] dark:bg-[#171717] dark:ring-[#D4A900]/20">
          <div className="bg-gradient-to-r from-[#D4A900] to-[#FFD400] px-5 py-5 text-white">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">{t("nav.routine")}</div>
            <h1 className="text-2xl font-bold">{t("routine.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-50">
              {t("routine.editRoutine")} ﾂｷ {t("routine.exercises")} ﾂｷ {t("routine.start")}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {routines.length === 0 ? (
          <EmptyState
            icon={<IconPlus className="h-10 w-10" />}
            title="ルーティンを作成して始めよう！"
            description="よく使う種目をまとめておくと、次のトレーニングをすぐに開始できます。まずは1つ作って、自分だけの流れを作りましょう。"
            actionLabel="ルーティンを作成"
            onAction={handleCreateRoutine}
          />
        ) : null}
        {routines.map((routine, index) => (
          <motion.article
            key={routine.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-[#E2E8F0] dark:bg-[#171717] dark:ring-[#D4A900]/20"
          >
            <button
              type="button"
              onClick={() => openRoutineEditor(routine.id)}
              className="w-full text-left"
            >
              <div className="bg-gradient-to-r from-[#FFF8D6] via-[#FFFBEA] to-white px-5 py-5 dark:from-[#1F1A00] dark:via-[#171717] dark:to-[#171717]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#D4A900]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A900]">
                        Routine
                      </span>
                      <span className="text-xs font-medium text-[#64748B] dark:text-[#CBD5E1]">
                        {routine.exercises.length} {t("common.exercises")}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{getRoutineName(routine)}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {routine.targetParts.map((part) => {
                        const accent = bodyPartAccent[part]
                        return (
                          <span
                            key={`${routine.id}-${part}`}
                            className="rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{ background: accent.bg, color: accent.text, borderColor: accent.border }}
                          >
                            {t(`training.${part.toLowerCase()}`)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/90 px-3 py-2 text-right shadow-sm ring-1 ring-[#FDE68A] dark:bg-[#111111] dark:ring-[#D4A900]/20">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748B] dark:text-[#CBD5E1]">
                      Preview
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#D4A900]">
                      {routine.exercises.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 ring-1 ring-[#E2E8F0] dark:bg-[#111111] dark:ring-[#D4A900]/20">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748B] dark:text-[#CBD5E1]">
                      {t("common.exercises")}
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {routine.exercises.length}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 ring-1 ring-[#E2E8F0] dark:bg-[#111111] dark:ring-[#D4A900]/20">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748B] dark:text-[#CBD5E1]">
                      {t("routine.targetParts")}
                    </div>
                    <div className="mt-1 text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {routine.targetParts.length}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl bg-[#F8FAFC] p-3 ring-1 ring-[#E2E8F0] dark:bg-[#111111] dark:ring-[#D4A900]/20">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {t("routine.exercises")}
                    </div>
                    <div className="text-[11px] font-medium text-[#64748B] dark:text-[#CBD5E1]">
                      {Math.min(routine.exercises.length, 4)} / {routine.exercises.length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {routine.exercises.slice(0, 4).map((exercise, exerciseIndex) => {
                      const accent = bodyPartAccent[exercise.bodyPart]
                      return (
                        <div
                          key={exercise.id}
                          className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] ring-1 ring-[#E2E8F0] dark:bg-[#0f172a] dark:ring-[#1e3a8a]/30"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                            style={{ background: accent.bg, color: accent.text }}
                          >
                            {exerciseIndex + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-semibold text-[#1E293B] dark:text-[#F8FAFC]">
                                {getExerciseName(exercise.nameKey)}
                              </div>
                              <span
                                className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                                style={{ background: accent.bg, color: accent.text, borderColor: accent.border }}
                              >
                                {t(`training.${exercise.bodyPart.toLowerCase()}`)}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] leading-relaxed text-[#64748B] dark:text-[#CBD5E1]">
                              {formatExerciseMeta(exercise.sets, exercise.targetReps, exercise.targetWeight)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {routine.exercises.length > 4 ? (
                      <div className="rounded-2xl border border-dashed border-[#CBD5E1] px-3 py-2 text-center text-[11px] font-medium text-[#64748B] dark:border-[#334155] dark:text-[#CBD5E1]">
                        +{routine.exercises.length - 4} more exercises
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] px-5 py-4 dark:border-[#262626]">
              <button
                type="button"
                onClick={() => openRoutineEditor(routine.id)}
                className="w-full rounded-2xl border border-[#BFDBFE] bg-white px-4 py-3 text-sm font-semibold text-[#D4A900] transition hover:bg-[#FFF8D6]"
              >
                {t("routine.editRoutine")}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onStartRoutine(routine)
                }}
                className="w-full rounded-2xl bg-[#D4A900] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8]"
              >
                {t("routine.start")}
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4">
        <button
          type="button"
          onClick={handleCreateRoutine}
          className="w-full rounded-2xl bg-[#D4A900] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:bg-[#1D4ED8]"
        >
          <span className="inline-flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            + {t("routine.createNew")}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {editingRoutine ? (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 px-4 pb-24 pt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditor}
          >
            <motion.div
            className="w-full max-w-[398px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] ring-1 ring-[#FFF1A8] dark:bg-[#171717] dark:ring-[#D4A900]/20"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#D4A900] to-[#FFD400] px-5 py-4 text-white">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <IconChevronRight className="h-4 w-4 rotate-180 text-white" />
                    <h2 className="text-base font-semibold">
                      {isCreating ? t("routine.createNew") : t("routine.editRoutine")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1E293B]">{t("routine.routineName")}</label>
                  <input
                    value={editingRoutine.customName}
                    onChange={(event) => updateRoutine(editingRoutine.id, (routine) => ({ ...routine, customName: event.target.value }))}
                    placeholder={t("routine.routineName")}
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FFD400] focus:ring-4 focus:ring-[#FFF1A8]"
                  />
                </div>

                <div>
                  <div className="mb-2 block text-sm font-semibold text-[#1E293B]">{t("routine.targetParts")}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {routineBodyParts.map((part) => {
                      const selected = editingRoutine.targetParts.includes(part)
                      return (
                        <button
                          key={`${editingRoutine.id}-${part}`}
                          type="button"
                          onClick={() => updateRoutine(editingRoutine.id, (routine) => ({
                            ...routine,
                            targetParts: selected
                              ? routine.targetParts.filter((item) => item !== part)
                              : [...routine.targetParts, part],
                          }))}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                            selected
                              ? "border-[#D4A900] bg-[#FFF8D6] text-[#D4A900]"
                              : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#FFF07A] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          {t(`training.${part.toLowerCase()}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1E293B]">{t("routine.exercises")}</span>
                    <button
                      type="button"
                      onClick={() => updateRoutine(editingRoutine.id, (routine) => ({
                        ...routine,
                        exercises: [...routine.exercises, createExercise("benchPress")],
                      }))}
                      className="rounded-xl bg-[#D4A900] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8]"
                    >
                      {t("routine.addExercise")}
                    </button>
                  </div>

                  <Reorder.Group
                    axis="y"
                    values={editingRoutine.exercises}
                    onReorder={(nextExercises) => updateRoutine(editingRoutine.id, (routine) => ({ ...routine, exercises: nextExercises }))}
                    className="space-y-3"
                  >
                    {editingRoutine.exercises.map((exercise, index) => (
                      <Reorder.Item
                        key={exercise.id}
                        value={exercise}
                        className="list-none rounded-3xl bg-[#F8FAFC] px-4 py-4 ring-1 ring-[#E2E8F0]"
                      >
                        {(() => {
                          const selectedExercise = flatExerciseOptions.find((option) => option.key === exercise.nameKey)
                          const expandedGroupKey = expandedExercisePanels[exercise.id] ?? exercise.bodyPart
                          const filteredExerciseOptions = getFilteredExerciseOptions(exercise.id)
                          return (
                            <>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#64748B]">#{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => updateRoutine(editingRoutine.id, (routine) => ({
                              ...routine,
                              exercises: routine.exercises.filter((item) => item.id !== exercise.id),
                            }))}
                            className="rounded-xl border border-[#FECACA] bg-white px-3 py-1.5 text-xs font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2]"
                          >
                            {t("routine.delete")}
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-3">
                            <button
                              type="button"
                              onClick={() => toggleExercisePicker(exercise.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-3 py-3 text-left ring-1 ring-[#E2E8F0] transition hover:bg-[#FFF8D6]"
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
                                  {t(`training.${exercise.bodyPart.toLowerCase()}`)}
                                </div>
                                <div className="truncate text-sm font-semibold text-[#1E293B]">
                                  {t(`training.suggestions.${exercise.nameKey}`)}
                                </div>
                              </div>
                              <IconChevronRight
                                className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform ${
                                  exercisePickerOpen[exercise.id] ? "rotate-90" : ""
                                }`}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {exercisePickerOpen[exercise.id] ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                                    <input
                                      value={exerciseSearch[exercise.id] ?? ""}
                                      onChange={(event) => setExerciseSearch((current) => ({
                                        ...current,
                                        [exercise.id]: event.target.value,
                                      }))}
                                      placeholder={t("training.exerciseName")}
                                      className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FFD400] focus:ring-4 focus:ring-[#FFF1A8]"
                                    />
                                    {filteredExerciseOptions.map((group) => (
                                      <div key={group.key} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
                                        <button
                                          type="button"
                                          onClick={() => toggleExercisePanel(exercise.id, group.key)}
                                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-[#FFF8D6]"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A017]">
                                              {group.label}
                                            </div>
                                            <div className="mt-0.5 text-xs font-medium text-[#475569]">
                                              {group.key === selectedExercise?.bodyPart
                                                ? t(`training.suggestions.${exercise.nameKey}`)
                                                : `${group.translatedExercises.length} ${t("common.exercises")}`}
                                            </div>
                                          </div>
                                          <IconChevronRight
                                            className={`h-3.5 w-3.5 shrink-0 text-[#64748B] transition-transform ${
                                              expandedGroupKey === group.key ? "rotate-90" : ""
                                            }`}
                                          />
                                        </button>

                                        <AnimatePresence initial={false}>
                                          {expandedGroupKey === group.key ? (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.18 }}
                                              className="overflow-hidden border-t border-[#E2E8F0] bg-white"
                                            >
                                              <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                                                {group.translatedExercises.map((option) => {
                                                  const active = exercise.nameKey === option.id
                                                  return (
                                                    <button
                                                      key={option.id}
                                                      type="button"
                                                      onClick={() => {
                                                        updateRoutine(editingRoutine.id, (routine) => ({
                                                          ...routine,
                                                          exercises: routine.exercises.map((item) => {
                                                            if (item.id !== exercise.id) {
                                                              return item
                                                            }
                                                            const selectedOption = flatExerciseOptions.find((candidate) => candidate.key === option.id) ?? flatExerciseOptions[0]
                                                            return { ...item, nameKey: selectedOption.key, bodyPart: selectedOption.bodyPart, weightStep: getExerciseWeightStep(selectedOption.key) }
                                                          }),
                                                        }))
                                                        setExerciseSearch((current) => ({ ...current, [exercise.id]: "" }))
                                                        setExercisePickerOpen((current) => ({ ...current, [exercise.id]: false }))
                                                      }}
                                                      className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                                        active
                                                          ? "border-[#D4A900] bg-[#FFF8D6] text-[#D4A900]"
                                                          : "border-[#FFF1A8] bg-white text-[#334155] hover:border-[#FFF07A] hover:bg-[#F8FAFC]"
                                                      }`}
                                                    >
                                                      {t(`training.suggestions.${option.id}`)}
                                                    </button>
                                                  )
                                                })}
                                              </div>
                                            </motion.div>
                                          ) : null}
                                        </AnimatePresence>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="mb-2 block text-xs font-semibold text-[#64748B]">{t("routine.sets")}</label>
                              <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#BFDBFE] bg-[#FFF8D6] px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => updateExerciseSets(editingRoutine.id, exercise.id, exercise.sets - 1)}
                                  disabled={exercise.sets <= 1}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFF07A] bg-white text-lg font-semibold leading-none text-[#D4A900] shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                                  aria-label={`${t("routine.sets")} -`}
                                >
                                  -
                                </button>
                                <span className="min-w-8 text-center text-base font-semibold text-[#1E293B]">{exercise.sets}</span>
                                <button
                                  type="button"
                                  onClick={() => updateExerciseSets(editingRoutine.id, exercise.id, exercise.sets + 1)}
                                  disabled={exercise.sets >= 10}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFF07A] bg-white text-lg font-semibold leading-none text-[#D4A900] shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                                  aria-label={`${t("routine.sets")} +`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold text-[#64748B]">{t("routine.targetWeight")}</label>
                              <input
                                value={exercise.targetWeight}
                                onChange={(event) => updateRoutine(editingRoutine.id, (routine) => ({
                                  ...routine,
                                  exercises: routine.exercises.map((item) => item.id === exercise.id ? {
                                    ...item,
                                    targetWeight: Number(event.target.value) || 0,
                                    weights: normalizeExerciseWeights(item.weights, item.sets, Number(event.target.value) || 0),
                                  } : item),
                                }))}
                                inputMode="decimal"
                                className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FFD400] focus:ring-4 focus:ring-[#FFF1A8]"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold text-[#64748B]">{t("routine.targetReps")}</label>
                              <input
                                value={exercise.targetReps}
                                onChange={(event) => updateRoutine(editingRoutine.id, (routine) => ({
                                  ...routine,
                                  exercises: routine.exercises.map((item) => item.id === exercise.id ? { ...item, targetReps: Number(event.target.value) || 0 } : item),
                                }))}
                                inputMode="numeric"
                                className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#1E293B] outline-none transition focus:border-[#FFD400] focus:ring-4 focus:ring-[#FFF1A8]"
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[#BFDBFE] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(37,99,235,0.08)]">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-[#1E3A8A]">{t("routine.targetWeight")}</div>
                                <div className="text-xs text-[#64748B]">Setごとの重量を調整</div>
                              </div>
                              <span className="rounded-full bg-[#FFF8D6] px-3 py-1 text-xs font-semibold text-[#D4A900]">
                                {exercise.sets} sets
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {normalizeExerciseWeights(exercise.weights, exercise.sets, exercise.targetWeight).map((weight, setIndex) => (
                                <div
                                  key={`${exercise.id}-weight-${setIndex}`}
                                  className="flex items-center gap-3 rounded-2xl border border-[#FFF1A8] bg-[#F8FBFF] px-3 py-2.5"
                                >
                                  <div className="w-12 shrink-0 text-[11px] font-semibold leading-tight text-[#64748B]">
                                    {t("training.set")} {setIndex + 1}
                                  </div>
                                  <div className="ml-auto flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => updateExerciseWeights(editingRoutine.id, exercise.id, (weights) =>
                                        weights.map((item, index) => index === setIndex ? adjustWeightByStep(item, -1, exercise.weightStep) : item),
                                      )}
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#FFF07A] bg-white text-base font-semibold leading-none text-[#D4A900] shadow-sm transition hover:bg-[#FFF8D6]"
                                      aria-label={`${t("training.set")} ${setIndex + 1} -`}
                                    >
                                      -
                                    </button>
                                    <input
                                      value={weight}
                                      onChange={(event) => updateExerciseWeights(editingRoutine.id, exercise.id, (weights) =>
                                        weights.map((item, index) => index === setIndex ? Number(event.target.value) || 0 : item),
                                      )}
                                      inputMode="decimal"
                                      aria-label={`${t("training.set")} ${setIndex + 1} ${t("routine.targetWeight")}`}
                                      className="w-20 rounded-xl border border-[#BFDBFE] bg-white px-2 py-2 text-center text-sm font-semibold text-[#1E293B] outline-none transition focus:border-[#FFD400] focus:ring-4 focus:ring-[#FFF1A8]"
                                    />
                                    <span className="shrink-0 text-xs font-semibold text-[#64748B]">kg</span>
                                    <button
                                      type="button"
                                      onClick={() => updateExerciseWeights(editingRoutine.id, exercise.id, (weights) =>
                                        weights.map((item, index) => index === setIndex ? adjustWeightByStep(item, 1, exercise.weightStep) : item),
                                      )}
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#FFF07A] bg-white text-base font-semibold leading-none text-[#D4A900] shadow-sm transition hover:bg-[#FFF8D6]"
                                      aria-label={`${t("training.set")} ${setIndex + 1} +`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                            </>
                          )
                        })()}
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
                  >
                    {t("common.close")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoutine(editingRoutine.id)}
                    className="w-full rounded-2xl border border-[#FECACA] bg-white px-4 py-3 text-sm font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2]"
                  >
                    {t("routine.delete")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full rounded-2xl bg-[#D4A900] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                  >
                    {t("routine.save")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
