import { motion } from "framer-motion"
import { IconSword, IconShield, IconStar } from "@/icons"
import { useTranslation } from "react-i18next"
import type { Big3OneRMRecords, Big3Records } from "@/sections/TrainingPage"

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
}

export default function StatusPanel({ stats: _stats, big3Records, big3OneRMRecords, motivationMessage }: StatusPanelProps) {
  const { t } = useTranslation()
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

