import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { IconBook, IconChevronRight } from "@/icons"
import { exerciseBodyPartLabels, exerciseDatabase, type ExerciseGuideEntry } from "@/utils/exerciseDatabase"
import type { MissionBodyPart } from "@/utils/dailyMission"

interface ExerciseGuidePageProps {
  onBackHome?: () => void
}

const bodyPartFilters: Array<{ key: "all" | MissionBodyPart; label: string }> = [
  { key: "all", label: "すべて" },
  { key: "chest", label: "胸" },
  { key: "back", label: "背中" },
  { key: "legs", label: "脚" },
  { key: "shoulders", label: "肩" },
  { key: "arms", label: "腕" },
]

const difficultyStyles = {
  初心者: "border-emerald-300 bg-emerald-100 text-emerald-700",
  中級: "border-amber-300 bg-amber-100 text-amber-700",
  上級: "border-rose-300 bg-rose-100 text-rose-700",
} as const

const equipmentIcons: Record<ExerciseGuideEntry["equipment"], string> = {
  バーベル: "🏋️",
  ダンベル: "🔩",
  マシン: "🦾",
  自重: "🤸",
}

export default function ExerciseGuidePage({ onBackHome }: ExerciseGuidePageProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<"all" | MissionBodyPart>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedExerciseName, setExpandedExerciseName] = useState<string | null>(null)

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return exerciseDatabase.filter((exercise) => {
      const matchesBodyPart = selectedBodyPart === "all" || exercise.bodyPart === selectedBodyPart
      const matchesSearch =
        normalizedSearch.length === 0 ||
        exercise.name.toLowerCase().includes(normalizedSearch) ||
        exercise.description.toLowerCase().includes(normalizedSearch) ||
        exercise.targetMuscles.primary.some((muscle) => muscle.toLowerCase().includes(normalizedSearch))
      return matchesBodyPart && matchesSearch
    })
  }, [searchTerm, selectedBodyPart])

  return (
    <section className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
      <div className="rounded-[2rem] border border-[#F5A623]/30 bg-[linear-gradient(135deg,rgba(245,166,35,0.18),rgba(255,255,255,0.98))] p-5 shadow-[0_24px_60px_rgba(245,166,35,0.18)] dark:bg-[linear-gradient(135deg,rgba(245,166,35,0.18),rgba(10,10,10,0.96))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#B77900]">Beginner Guide</div>
            <h2 className="mt-2 text-2xl font-black text-[#0a0a0a] dark:text-white">初心者ガイド📖</h2>
            <p className="mt-2 text-sm leading-6 text-[#4A4A4A] dark:text-[#D6D6D6]">
              種目のやり方・よくあるミス・初心者向け重量目安をまとめました。
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0a] text-[#F5A623]">
            <IconBook className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {bodyPartFilters.map((filter) => {
            const active = filter.key === selectedBodyPart
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedBodyPart(filter.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  active ? "bg-[#F5A623] text-[#0a0a0a]" : "border border-[#F5A623]/30 bg-white text-[#8A5A00] dark:bg-[#111111] dark:text-[#FFE082]"
                }`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="種目名・部位・筋肉で検索"
            className="w-full rounded-2xl border border-[#F5A623]/30 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none focus:border-[#F5A623] dark:bg-[#111111] dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredExercises.map((exercise) => {
          const expanded = expandedExerciseName === exercise.name
          return (
            <motion.article
              key={exercise.name}
              layout
              className="overflow-hidden rounded-[1.75rem] border border-[#F5A623]/25 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-[#171717]"
            >
              <button
                type="button"
                onClick={() => setExpandedExerciseName(expanded ? null : exercise.name)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{equipmentIcons[exercise.equipment]}</span>
                    <h3 className="text-base font-black text-[#0a0a0a] dark:text-white">{exercise.name}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${difficultyStyles[exercise.difficulty]}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8A5A00] dark:text-[#FFE082]">
                    <span className="rounded-full bg-[#FFF8E7] px-2.5 py-1 dark:bg-[#2A2110]">{exerciseBodyPartLabels[exercise.bodyPart]}</span>
                    <span className="rounded-full bg-[#FFF8E7] px-2.5 py-1 dark:bg-[#2A2110]">{exercise.equipment}</span>
                    <span className="rounded-full bg-[#FFF8E7] px-2.5 py-1 dark:bg-[#2A2110]">推奨 {exercise.suggestedSets} / {exercise.suggestedReps}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#4A4A4A] dark:text-[#D6D6D6]">{exercise.description}</p>
                </div>
                <IconChevronRight className={`mt-1 h-4 w-4 text-[#B77900] transition ${expanded ? "rotate-90" : ""}`} />
              </button>

              {expanded ? (
                <div className="border-t border-[#F5A623]/20 bg-[#FFFDF6] p-4 dark:bg-[#111111]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 dark:bg-[#171717]">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B77900]">主動筋</div>
                      <div className="mt-2 text-sm text-[#0a0a0a] dark:text-white">{exercise.targetMuscles.primary.join(" / ")}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 dark:bg-[#171717]">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B77900]">補助筋</div>
                      <div className="mt-2 text-sm text-[#0a0a0a] dark:text-white">{exercise.targetMuscles.secondary.join(" / ") || "なし"}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-[#171717]">
                    <div className="text-sm font-black text-[#0a0a0a] dark:text-white">フォームのコツ</div>
                    <ul className="mt-3 space-y-2 text-sm text-[#4A4A4A] dark:text-[#D6D6D6]">
                      {exercise.formTips.map((tip) => (
                        <li key={tip}>💡 {tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 rounded-2xl bg-white p-4 dark:bg-[#171717]">
                    <div className="text-sm font-black text-[#0a0a0a] dark:text-white">よくある間違い</div>
                    <ul className="mt-3 space-y-2 text-sm text-[#4A4A4A] dark:text-[#D6D6D6]">
                      {exercise.commonMistakes.map((mistake) => (
                        <li key={mistake}>⚠️ {mistake}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#0a0a0a] p-4 text-white">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFD27A]">初心者男性目安</div>
                      <div className="mt-2 text-xl font-black">{exercise.beginnerWeightMale > 0 ? `${exercise.beginnerWeightMale}kg` : "自重"}</div>
                    </div>
                    <div className="rounded-2xl bg-[#F5A623] p-4 text-[#0a0a0a]">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6A4300]">初心者女性目安</div>
                      <div className="mt-2 text-xl font-black">{exercise.beginnerWeightFemale > 0 ? `${exercise.beginnerWeightFemale}kg` : "自重"}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.article>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onBackHome}
        className="rounded-2xl border border-[#F5A623]/30 bg-white px-4 py-3 text-sm font-bold text-[#8A5A00] dark:bg-[#171717] dark:text-[#FFE082]"
      >
        HOMEへ戻る
      </button>
    </section>
  )
}