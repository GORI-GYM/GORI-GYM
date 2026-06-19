import { motion } from "framer-motion"
import { IconSword, IconShield, IconStar } from "@/icons"
import { useTranslation } from "react-i18next"
import type { Big3OneRMRecords, Big3Records } from "@/sections/TrainingPage"
import type { WeeklyProgressSummary } from "@/utils/weeklyProgress"

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
  onOpenGoalSettings?: () => void
}

export default function StatusPanel({ stats: _stats, big3Records, big3OneRMRecords, motivationMessage, weeklyProgress, onOpenGoalSettings }: StatusPanelProps) {
  const { t } = useTranslation()
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
      className="rounded-3xl bg-[#FFFBEA] px-4 py-4 transition-colors duration-200 dark:bg-[#0B0B0B]"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      aria-label={t("home.statusTitle")}
    >
      <div className="rounded-3xl bg-[#FFFFFF] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-colors duration-200 dark:bg-[#171717]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#64748B] dark:text-[#CBD5E1]">
              {t("home.statusTitle")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#1E293B] dark:text-[#F8FAFC]">{t("status.big3Title")}</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A900] to-[#FFD400] text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
            <IconStar className="h-5 w-5" />
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-[#F5A623]/30 bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#2A1B00] p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFD27A]">Weekly Streak</p>
              <div className="mt-2 flex items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5A623] text-3xl ${streakGlow}`}>🔥</div>
                <div>
                  <div className="text-3xl font-black">{weeklyProgress.currentStreak}<span className="ml-1 text-sm font-semibold text-[#FFD27A]">週</span></div>
                  <div className="text-sm text-[#FDE7B0]">{weeklyProgress.completedDays}/{weeklyProgress.weeklyGoal} 回達成</div>
                </div>
              </div>
            </div>
            <button type="button" onClick={onOpenGoalSettings} className="rounded-2xl border border-[#F5A623]/40 bg-white/10 px-3 py-2 text-xs font-bold text-[#FFF4D1] transition hover:bg-white/20">
              目標設定
            </button>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F5A623] via-[#FFD400] to-[#FFF07A]" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#FDE7B0]">
            <span>今週XP {weeklyProgress.weeklyXP}</span>
            <span>倍率 x{weeklyProgress.xpMultiplier}</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day.label} className={`rounded-2xl border px-2 py-3 text-center ${day.checked ? "border-[#FFD400] bg-[#F5A623] text-[#0a0a0a]" : "border-white/10 bg-white/5 text-[#FFF4D1]"}`}>
                <div className="text-[11px] font-semibold">{day.label}</div>
                <div className="mt-1 text-lg">{day.checked ? "✓" : "·"}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-[#FDE7B0]">
            フリーズ: {weeklyProgress.streakFreezeAvailable ? "今月分あり" : "使用済み"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...leftStats, ...rightStats].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#FFF1A8] bg-[#FFFFFF] px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-colors duration-200 dark:border-[#D4A900]/20 dark:bg-[#111111]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${stat.color}14`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#64748B] dark:text-[#CBD5E1]">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold leading-none text-[#1E293B] dark:text-[#F8FAFC]">{stat.value}</p>
                  <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-[#FFE066]">{t("training.estimatedMax")}: {stat.estimatedMax?.toFixed(1).replace(/\.0$/, "") ?? "0"}kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {motivationMessage && (
          <div className="mt-4 rounded-2xl border border-[#FFF1A8] bg-[#FFF8D6] px-4 py-3 text-center transition-colors duration-200 dark:border-[#D4A900]/20 dark:bg-[#111111]">
            <p className="text-sm text-[#64748B] dark:text-[#CBD5E1]">{motivationMessage}</p>
          </div>
        )}
      </div>
    </motion.section>
  )
}

