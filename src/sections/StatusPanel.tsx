import { motion } from "framer-motion"
import { IconSword, IconShield, IconStar } from "@/icons"
import { useTranslation } from "react-i18next"
import type { Big3OneRMRecords, Big3Records } from "@/sections/TrainingPage"
import type { WeeklyProgressSummary } from "@/utils/weeklyProgress"
import type { MonthlyCharacterProgressSummary } from "@/utils/monthlyCharacterProgress"

interface Stat {
  icon: React.ReactNode
  label: string
  value: number
  estimatedMax?: number
  color?: string
}

interface StatusPanelProps {
  stats: Record<string, number>
  big3Records: Big3Records
  big3OneRMRecords: Big3OneRMRecords
  motivationMessage?: string
  weeklyProgress: WeeklyProgressSummary
  monthlyCharacterProgress?: MonthlyCharacterProgressSummary
  onOpenGoalSettings?: () => void
}

export default function StatusPanel({ stats: _stats, big3Records, big3OneRMRecords, motivationMessage, weeklyProgress, monthlyCharacterProgress, onOpenGoalSettings }: StatusPanelProps) {
  const { t } = useTranslation()
  const safeMonthlyCharacterProgress = monthlyCharacterProgress ?? {
    monthlyXP: 0,
    monthlyLevel: 1,
    monthResetDate: "",
    breakdown: { trainingXP: 0, bonusXP: 0, multiplierApplied: 1 },
    currentLevelXpFloor: 0,
    nextLevelXp: null,
    xpIntoLevel: 0,
    xpForNextLevel: 0,
    xpRemainingToNextLevel: 0,
    progressPercent: 0,
  }
  const streakGlow = weeklyProgress.currentStreak >= 8 ? "shadow-[0_0_36px_rgba(255,120,0,0.55)]" : weeklyProgress.currentStreak >= 4 ? "shadow-[0_0_28px_rgba(255,166,35,0.45)]" : "shadow-[0_0_18px_rgba(245,166,35,0.28)]"
  const progressPct = Math.min(100, Math.round((weeklyProgress.completedDays / weeklyProgress.weeklyGoal) * 100))
  const weekStart = new Date(`${weeklyProgress.weekStartDate}T00:00:00`)
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    return {
      label: ["月", "火", "水", "木", "金", "土", "日"][index],
      checked: weeklyProgress.completedDateKeys.includes(dateKey),
    }
  })
  const leftStats: Stat[] = [
    { icon: <IconSword className="w-4 h-4" />, label: t("status.bench"), value: big3Records.benchPress, estimatedMax: big3OneRMRecords.benchPress.estimatedMax, color: "#D4A900" },
    { icon: <IconShield className="w-4 h-4" />, label: t("status.deadlift"), value: big3Records.deadlift, estimatedMax: big3OneRMRecords.deadlift.estimatedMax, color: "#FFD400" },
  ]

  const rightStats: Stat[] = [
    { icon: <IconStar className="w-4 h-4" />, label: t("status.squat"), value: big3Records.squat, estimatedMax: big3OneRMRecords.squat.estimatedMax, color: "#D4A900" },
    { icon: <IconStar className="w-4 h-4" />, label: t("status.total"), value: big3Records.benchPress + big3Records.deadlift + big3Records.squat, estimatedMax: big3OneRMRecords.benchPress.estimatedMax + big3OneRMRecords.deadlift.estimatedMax + big3OneRMRecords.squat.estimatedMax, color: "#FFD400" },
  ]

  return (
    <motion.section
      className="bg-[#0a0a0a] space-y-6 px-4 py-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      aria-label={t("home.statusTitle")}
    >
      <div className="space-y-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[#888] text-sm">
              {t("home.statusTitle")}
            </p>
            <h2 className="mt-1 text-white font-bold text-lg">{t("status.big3Title")}</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex h-11 w-11 items-center justify-center text-white">
            <IconStar className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-white space-y-6">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[#888] text-sm">Gorilla Level</p>
                <div className="mt-2 text-white font-bold text-lg">Lv{safeMonthlyCharacterProgress.monthlyLevel}<span className="ml-2 text-[#888] text-sm">/ 20</span></div>
                <div className="mt-1 text-[#ccc]">今月XP {safeMonthlyCharacterProgress.monthlyXP.toLocaleString()}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-right">
                <div className="text-[#888] text-sm">Next</div>
                <div className="mt-1 text-white font-bold text-lg">
                  {safeMonthlyCharacterProgress.nextLevelXp === null ? "MAX" : `あと ${safeMonthlyCharacterProgress.xpRemainingToNextLevel} XP`}
                </div>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#2a2a2a]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F5A623] via-[#FFD400] to-[#FFF07A]" style={{ width: `${safeMonthlyCharacterProgress.progressPercent}%` }} />
            </div>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[#888] text-sm">Weekly Streak</p>
              <div className="mt-2 flex items-center gap-3">
                  <div className={`bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 flex h-14 w-14 items-center justify-center text-3xl ${streakGlow}`}>🔥</div>
                <div>
                  <div className="text-white font-bold text-lg">{weeklyProgress.currentStreak}<span className="ml-1 text-[#888] text-sm">週</span></div>
                  <div className="text-[#ccc]">{weeklyProgress.completedDays}/{weeklyProgress.weeklyGoal} 回達成</div>
                </div>
              </div>
            </div>
            <button type="button" onClick={onOpenGoalSettings} className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2">
              目標設定
            </button>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#2a2a2a]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5A623] via-[#FFD400] to-[#FFF07A]" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[#888] text-sm">
            <span>今週XP {weeklyProgress.weeklyXP}</span>
            <span>倍率 x{weeklyProgress.xpMultiplier}</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day.label} className={`rounded-xl border px-2 py-3 text-center ${day.checked ? "border-[#F5A623] bg-[#F5A623] text-black" : "border-[#2a2a2a] bg-[#1a1a1a] text-[#888]"}`}>
                <div className="text-[#888] text-sm">{day.label}</div>
                <div className="mt-1 text-lg">{day.checked ? "✓" : "·"}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[#888] text-sm">
            フリーズ: {weeklyProgress.streakFreezeAvailable ? "今月分あり" : "使用済み"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...leftStats, ...rightStats].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${stat.color}14`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#888] text-sm">{stat.label}</p>
                  <p className="mt-1 text-white font-bold text-lg leading-none">{stat.value}</p>
                  <p className="mt-2 text-[#ccc]">{t("training.estimatedMax")}: {stat.estimatedMax?.toFixed(1).replace(/\.0$/, "") ?? "0"}kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {motivationMessage && (
          <div className="mt-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-center">
            <p className="text-[#ccc]">{motivationMessage}</p>
          </div>
        )}
      </div>
    </motion.section>
  )
}

