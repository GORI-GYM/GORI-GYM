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
  { key: "biceps", label: "上腕二頭筋" },
  { key: "triceps", label: "上腕三頭筋" },
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
    <section className="mx-auto flex w-full max-w-[430px] flex-col gap-4 bg-[#0a0a0a] px-4 pb-28 pt-5">
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[#888] text-sm">Beginner Guide</div>
            <h2 className="mt-2 text-white font-bold text-lg">初心者ガイド📖</h2>
            <p className="mt-2 text-[#ccc]">
              種目のやり方・よくあるミス・初心者向け重量目安をまとめました。
            </p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex h-12 w-12 items-center justify-center text-[#F5A623]">
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
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  active ? "bg-[#F5A623] text-black font-bold" : "border border-[#F5A623] text-[#F5A623]"
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
            className="w-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#ccc] outline-none"
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
              className="overflow-hidden bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]"
            >
              <button
                type="button"
                onClick={() => setExpandedExerciseName(expanded ? null : exercise.name)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{equipmentIcons[exercise.equipment]}</span>
                    <h3 className="text-white font-bold text-lg">{exercise.name}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${difficultyStyles[exercise.difficulty]}`}>
                      {exercise.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[#888] text-sm">
                    <span className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">{exerciseBodyPartLabels[exercise.bodyPart]}</span>
                    <span className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">{exercise.equipment}</span>
                    <span className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">推奨 {exercise.suggestedSets} / {exercise.suggestedReps}</span>
                  </div>
                  <p className="mt-3 text-[#ccc]">{exercise.description}</p>
                </div>
                <IconChevronRight className={`mt-1 h-4 w-4 text-[#B77900] transition ${expanded ? "rotate-90" : ""}`} />
              </button>

              {expanded ? (
                <div className="border-t border-[#2a2a2a] bg-[#0a0a0a] p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                      <div className="text-[#888] text-sm">主動筋</div>
                      <div className="mt-2 text-[#ccc]">{exercise.targetMuscles.primary.join(" / ")}</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                      <div className="text-[#888] text-sm">補助筋</div>
                      <div className="mt-2 text-[#ccc]">{exercise.targetMuscles.secondary.join(" / ") || "なし"}</div>
                    </div>
                  </div>

                  <div className="mt-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                    <div className="text-white font-bold text-lg">フォームのコツ</div>
                    <ul className="mt-3 space-y-2 text-[#ccc]">
                      {exercise.formTips.map((tip) => (
                        <li key={tip}>💡 {tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
                    <div className="text-white font-bold text-lg">よくある間違い</div>
                    <ul className="mt-3 space-y-2 text-[#ccc]">
                      {exercise.commonMistakes.map((mistake) => (
                        <li key={mistake}>⚠️ {mistake}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-white">
                      <div className="text-[#888] text-sm">初心者男性目安</div>
                      <div className="mt-2 text-white font-bold text-lg">{exercise.beginnerWeightMale > 0 ? `${exercise.beginnerWeightMale}kg` : "自重"}</div>
                    </div>
                    <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">
                      <div className="text-[#888] text-sm">初心者女性目安</div>
                      <div className="mt-2 text-black font-bold text-lg">{exercise.beginnerWeightFemale > 0 ? `${exercise.beginnerWeightFemale}kg` : "自重"}</div>
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
        className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2"
      >
        HOMEへ戻る
      </button>
    </section>
  )
}