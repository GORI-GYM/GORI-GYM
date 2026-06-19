import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { DailyMissionDay, DailyMissionHistoryEntry, DailyMissionSettings, MissionBodyPart, MissionExerciseOption } from "@/utils/dailyMission"
import {
  DAILY_MISSION_XP,
  getBodyPartLabel,
  getMissionCompletionCount,
  getMissionDescription,
  getMissionExerciseOptions,
  getMissionHeadline,
  getMissionHistoryStatus,
} from "@/utils/dailyMission"

interface DailyMissionSectionProps {
  day: DailyMissionDay
  history: DailyMissionHistoryEntry[]
  settings: DailyMissionSettings
  onCompleteMission: (missionId: string) => void
  onSaveSettings: (settings: DailyMissionSettings) => void
}

const bodyParts: MissionBodyPart[] = ["chest", "back", "legs", "shoulders", "arms"]

const bodyPartTheme: Record<MissionBodyPart, { accent: string; glow: string; badge: string }> = {
  chest: { accent: "#F5A623", glow: "rgba(245,166,35,0.35)", badge: "from-[#F5A623] to-[#FFD27A]" },
  back: { accent: "#E0A11B", glow: "rgba(224,161,27,0.35)", badge: "from-[#E0A11B] to-[#FFE08A]" },
  legs: { accent: "#D4A017", glow: "rgba(212,160,23,0.35)", badge: "from-[#D4A017] to-[#FFE08A]" },
  shoulders: { accent: "#FFB800", glow: "rgba(255,184,0,0.35)", badge: "from-[#FFB800] to-[#FFF0A8]" },
  arms: { accent: "#C98A00", glow: "rgba(201,138,0,0.35)", badge: "from-[#C98A00] to-[#FFD27A]" },
}

function HistoryBadge({ entry }: { entry: DailyMissionHistoryEntry }) {
  const status = getMissionHistoryStatus(entry)
  const label = entry.dateKey.slice(5)
  const className =
    status === "complete"
      ? "border-[#F5A623] bg-[#F5A623] text-[#0a0a0a]"
      : status === "partial"
        ? "border-[#F5A623]/50 bg-[#FFF4D6] text-[#8A5A00]"
        : status === "rest"
          ? "border-[#2A2A2A] bg-[#171717] text-[#FFD27A]"
          : "border-[#2A2A2A] bg-[#0f0f0f] text-[#8A8A8A]"

  return (
    <div className={`rounded-2xl border px-3 py-2 text-center text-xs font-bold ${className}`}>
      <div>{label}</div>
      <div className="mt-1 text-[10px]">
        {status === "complete" ? "達成" : status === "partial" ? "途中" : status === "rest" ? "休息" : "未達"}
      </div>
    </div>
  )
}

function MissionSettingsModal({
  settings,
  onClose,
  onSave,
}: {
  settings: DailyMissionSettings
  onClose: () => void
  onSave: (settings: DailyMissionSettings) => void
}) {
  const [draft, setDraft] = useState<DailyMissionSettings>(settings)
  const [customName, setCustomName] = useState("")
  const [customBodyPart, setCustomBodyPart] = useState<MissionBodyPart>("chest")

  const handleToggleExercise = (bodyPart: MissionBodyPart, exerciseName: string) => {
    const current = draft.selectedExercisesByBodyPart[bodyPart] ?? []
    const next = current.includes(exerciseName)
      ? current.filter((name) => name !== exerciseName)
      : [...current, exerciseName]

    setDraft((prev) => ({
      ...prev,
      selectedExercisesByBodyPart: {
        ...prev.selectedExercisesByBodyPart,
        [bodyPart]: next,
      },
    }))
  }

  const handleAddCustomExercise = () => {
    const trimmed = customName.trim()
    if (!trimmed) return
    const trainingBodyPart: MissionExerciseOption["trainingBodyPart"] =
      customBodyPart === "chest"
        ? "CHEST"
        : customBodyPart === "back"
          ? "BACK"
          : customBodyPart === "legs"
            ? "LEGS"
            : customBodyPart === "shoulders"
              ? "SHOULDERS"
              : "BICEPS"

    setDraft((prev) => ({
      ...prev,
      customExercises: [...prev.customExercises, { name: trimmed, bodyPart: customBodyPart, trainingBodyPart }],
      selectedExercisesByBodyPart: {
        ...prev.selectedExercisesByBodyPart,
        [customBodyPart]: [...(prev.selectedExercisesByBodyPart[customBodyPart] ?? []), trimmed],
      },
    }))
    setCustomName("")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-8 pt-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[430px] rounded-[2rem] border border-[#F5A623]/30 bg-[#0a0a0a] p-5 text-white shadow-[0_24px_80px_rgba(245,166,35,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black tracking-[0.08em] text-[#FFD27A]">ミッション設定</h3>
          <button type="button" onClick={onClose} className="text-sm text-white/70">閉じる</button>
        </div>

        <div className="space-y-4">
          {bodyParts.map((bodyPart) => {
            const options = getMissionExerciseOptions(draft, bodyPart)
            const selected = draft.selectedExercisesByBodyPart[bodyPart] ?? []
            return (
              <div key={bodyPart} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-bold text-[#FFD27A]">{getBodyPartLabel(bodyPart)}</div>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const active = selected.length === 0 || selected.includes(option.name)
                    return (
                      <button
                        key={`${bodyPart}-${option.name}`}
                        type="button"
                        onClick={() => handleToggleExercise(bodyPart, option.name)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "border-[#F5A623] bg-[#F5A623] text-[#0a0a0a]"
                            : "border-white/15 bg-[#111111] text-white/70"
                        }`}
                      >
                        {option.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="rounded-2xl border border-[#F5A623]/20 bg-[#111111] p-4">
            <div className="mb-3 text-sm font-bold text-[#FFD27A]">自分の種目を追加</div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="例: インクラインダンベルプレス"
                className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-sm text-white outline-none focus:border-[#F5A623]"
              />
              <select
                value={customBodyPart}
                onChange={(event) => setCustomBodyPart(event.target.value as MissionBodyPart)}
                className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-sm text-white outline-none"
              >
                {bodyParts.map((bodyPart) => (
                  <option key={bodyPart} value={bodyPart}>{getBodyPartLabel(bodyPart)}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddCustomExercise}
              className="mt-3 w-full rounded-xl bg-[#F5A623] px-4 py-3 text-sm font-black text-[#0a0a0a]"
            >
              種目を追加
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSave(draft)}
            className="w-full rounded-2xl bg-gradient-to-r from-[#F5A623] to-[#FFD27A] px-4 py-4 text-sm font-black text-[#0a0a0a] shadow-[0_12px_30px_rgba(245,166,35,0.35)]"
          >
            保存する
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DailyMissionSection({
  day,
  history,
  settings,
  onCompleteMission,
  onSaveSettings,
}: DailyMissionSectionProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showCompleteFx, setShowCompleteFx] = useState(false)
  const completionCount = useMemo(() => getMissionCompletionCount(day), [day])
  const theme = bodyPartTheme[day.rotationBodyPart]

  return (
    <>
      <section className="px-4 pb-4 pt-2">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-[#F5A623]/30 bg-[#0a0a0a] p-5 text-white shadow-[0_24px_80px_rgba(245,166,35,0.18)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at top right, rgba(245,166,35,0.22), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          }}
        >
          <div className="absolute right-[-40px] top-[-40px] h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: theme.glow }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFD27A]/80">Today&apos;s Mission</div>
                <h2 className="mt-2 text-2xl font-black tracking-[0.04em] text-white">{getMissionHeadline(day)}</h2>
                <p className="mt-2 text-sm text-white/70">
                  {day.isRestDay ? "休息日でもアプリを開いて、明日の準備と継続を積み上げよう。" : `${completionCount}/${day.missions.length} 達成 ・ 1ミッションごとに +${DAILY_MISSION_XP}XP`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-full border border-[#F5A623]/30 bg-white/5 px-3 py-2 text-xs font-bold text-[#FFD27A]"
              >
                設定
              </button>
            </div>

            {day.isRestDay ? (
              <div className="mt-5 rounded-[1.5rem] border border-[#F5A623]/20 bg-white/5 p-5">
                <div className="text-lg font-black text-[#FFD27A]">今日は休息日！ゴリラも一緒に回復中🦍</div>
                <div className="mt-2 text-sm text-white/70">ストレッチ、水分補給、睡眠で明日のミッションに備えよう。</div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {day.missions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    layout
                    className={`rounded-[1.5rem] border p-4 transition ${
                      mission.completed
                        ? "border-[#F5A623] bg-gradient-to-r from-[#F5A623]/20 to-[#FFD27A]/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#0a0a0a] ${theme.badge}`}>
                          {getBodyPartLabel(mission.bodyPart)}
                        </div>
                        <div className="mt-3 text-base font-black text-white">{mission.exerciseName}</div>
                        <div className="mt-1 text-sm text-white/75">{getMissionDescription(mission)}</div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-[#111111] px-3 py-3 text-xs text-[#FFD27A]">
                          推奨重量: <span className="font-black text-white">{mission.recommendedWeight}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={mission.completed}
                        onClick={() => {
                          onCompleteMission(mission.id)
                          setShowCompleteFx(true)
                          window.setTimeout(() => setShowCompleteFx(false), 1200)
                        }}
                        className={`min-w-[92px] rounded-2xl px-4 py-3 text-sm font-black transition ${
                          mission.completed
                            ? "bg-[#F5A623] text-[#0a0a0a]"
                            : "bg-white text-[#0a0a0a] hover:bg-[#FFD27A]"
                        }`}
                      >
                        {mission.completed ? "✓ 達成" : "達成！"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {day.completedAll && !day.isRestDay ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 rounded-[1.5rem] border border-[#F5A623] bg-gradient-to-r from-[#F5A623] via-[#FFD27A] to-[#FFF4D6] px-5 py-5 text-center text-[#0a0a0a] shadow-[0_18px_40px_rgba(245,166,35,0.35)]"
              >
                <div className="text-[11px] font-black uppercase tracking-[0.35em]">Mission Complete!</div>
                <div className="mt-2 text-2xl font-black">MISSION COMPLETE!</div>
                <div className="mt-2 text-sm font-semibold">今日のミッションをすべて達成した！</div>
              </motion.div>
            ) : null}

            <div className="mt-5">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#FFD27A]/80">7 Days History</div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {history.slice(0, 7).map((entry) => (
                  <HistoryBadge key={entry.dateKey} entry={entry} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showSettings ? (
          <MissionSettingsModal
            settings={settings}
            onClose={() => setShowSettings(false)}
            onSave={(nextSettings) => {
              onSaveSettings(nextSettings)
              setShowSettings(false)
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showCompleteFx ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            className="pointer-events-none fixed inset-x-0 top-24 z-50 mx-auto w-fit rounded-full border border-[#F5A623] bg-[#0a0a0a] px-5 py-3 text-sm font-black text-[#FFD27A] shadow-[0_18px_40px_rgba(245,166,35,0.35)]"
          >
            +{DAILY_MISSION_XP}XP
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}