// XPBar 窶・Level and experience points display
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { LEVEL_THRESHOLDS, MAX_LEVEL, XP_PER_LEVEL } from "@/sections/TrainingPage"

interface XPBarProps {
  level: number
  xp: number
}

function getLevelBounds(level: number) {
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const nextLevelXP = level >= MAX_LEVEL ? currentLevelXP + XP_PER_LEVEL : (LEVEL_THRESHOLDS[level] ?? currentLevelXP + XP_PER_LEVEL)
  return { currentLevelXP, nextLevelXP }
}

export default function XPBar({ level, xp }: XPBarProps) {
  const { t } = useTranslation()
  const { currentLevelXP, nextLevelXP } = getLevelBounds(level)
  const currentXP = xp - currentLevelXP
  const maxXP = nextLevelXP - currentLevelXP
  const pct = Math.min(100, Math.max(0, Math.round((currentXP / maxXP) * 100)))

  return (
    <section className="bg-[var(--color-bg)] px-5 pb-2 pt-1 transition-colors duration-200 dark:bg-[var(--color-dark-bg)]" aria-label={t("home.levelXpAria")}>
      <div className="rounded-[1.75rem] bg-[var(--color-surface)] px-4 py-4 shadow-[0_18px_40px_rgba(255,212,0,0.14)] transition-colors duration-200 dark:bg-[var(--color-dark-surface)]">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-gold-dark)]">{t("home.xpProgress")}</div>
            <div className="mt-1 text-sm font-semibold text-[var(--color-fg)] dark:text-[var(--color-dark-text)]">{t("common.levelShort")} {level}</div>
          </div>
          <span className="text-xs font-semibold text-[#5B5B5B] dark:text-[#D4D4D4]">
            {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
        <div
          className="h-4 overflow-hidden rounded-full bg-[var(--color-accent-soft)] dark:bg-[#111111]"
          role="progressbar"
          aria-valuenow={currentXP}
          aria-valuemin={0}
          aria-valuemax={maxXP}
          aria-label={t("common.xpAria", { current: currentXP, max: maxXP })}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #111111 0%, #FFD400 52%, #FFF07A 100%)",
              boxShadow: "0 0 18px rgba(255,212,0,0.55)",
              width: `${pct}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
    </section>
  )
}

