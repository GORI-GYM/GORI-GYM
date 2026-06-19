import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { calculateBig3Records, type Big3Records, type TrainingEntry } from "@/sections/TrainingPage"

type AchievementCategory = "TRAINING" | "STRENGTH" | "STREAK" | "MASTERY" | "LEGENDARY"
type AchievementRarity = "bronze" | "silver" | "gold" | "diamond"

interface AchievementReward {
  xp: number
  item?: string
}

interface AchievementData {
  id: string
  category: AchievementCategory
  name: string
  description: string
  fullDescription: string
  progressLabel: string
  current: number
  target: number
  unlocked: boolean
  rarity: AchievementRarity
  points: number
  reward: AchievementReward
  earnedDate?: string
}

interface MilestoneAchievement {
  id: string
  icon: string
  target: number
  current: number
  unlocked: boolean
}

const achievements: AchievementData[] = [
  {
    id: "first-step",
    category: "TRAINING",
    name: "First Step",
    description: "Complete 1 workout.",
    fullDescription: "Every legend begins with a single rep. Complete your first workout to claim your place in the guild records.",
    progressLabel: "1/1 workouts",
    current: 1,
    target: 1,
    unlocked: true,
    rarity: "bronze",
    points: 10,
    reward: { xp: 50, item: "Novice Medal" },
    earnedDate: "EARNED APR 03, 2026",
  },
  {
    id: "dedicated",
    category: "TRAINING",
    name: "Dedicated",
    description: "Complete 25 workouts.",
    fullDescription: "Consistency forges champions. Reach twenty-five completed workouts to prove your discipline is more than a passing spark.",
    progressLabel: "25/25 workouts",
    current: 25,
    target: 25,
    unlocked: true,
    rarity: "silver",
    points: 50,
    reward: { xp: 150, item: "Guild Banner" },
    earnedDate: "EARNED MAY 11, 2026",
  },
  {
    id: "warrior",
    category: "TRAINING",
    name: "Warrior",
    description: "Complete 100 workouts.",
    fullDescription: "Only seasoned fighters endure the long road. Complete one hundred workouts to earn the title of Warrior.",
    progressLabel: "63/100 workouts",
    current: 63,
    target: 100,
    unlocked: false,
    rarity: "gold",
    points: 200,
    reward: { xp: 400, item: "Warrior Crest" },
  },
  {
    id: "legend",
    category: "TRAINING",
    name: "Legend",
    description: "Complete 500 workouts.",
    fullDescription: "The trophy room reserves its brightest pedestal for those who never stop showing up. Reach five hundred workouts to become a living legend.",
    progressLabel: "163/500 workouts",
    current: 163,
    target: 500,
    unlocked: false,
    rarity: "diamond",
    points: 1000,
    reward: { xp: 1500, item: "Legend Crown" },
  },
  {
    id: "heavy-lifter",
    category: "STRENGTH",
    name: "Heavy Lifter",
    description: "Lift 10,000kg total.",
    fullDescription: "The iron remembers every plate you move. Accumulate ten thousand kilograms lifted to earn your first strength trophy.",
    progressLabel: "10,000/10,000 kg",
    current: 10000,
    target: 10000,
    unlocked: true,
    rarity: "bronze",
    points: 25,
    reward: { xp: 100, item: "Iron Grip Gloves" },
    earnedDate: "EARNED APR 28, 2026",
  },
  {
    id: "iron-giant",
    category: "STRENGTH",
    name: "Iron Giant",
    description: "Lift 50,000kg total.",
    fullDescription: "Your strength now echoes through the training hall. Reach fifty thousand kilograms lifted to stand among the iron giants.",
    progressLabel: "50,000/50,000 kg",
    current: 50000,
    target: 50000,
    unlocked: true,
    rarity: "silver",
    points: 100,
    reward: { xp: 250, item: "Titan Belt" },
    earnedDate: "EARNED JUN 02, 2026",
  },
  {
    id: "atlas",
    category: "STRENGTH",
    name: "Atlas",
    description: "Lift 100,000kg total.",
    fullDescription: "Atlas bears the heavens; you bear the iron. Reach one hundred thousand kilograms lifted to ascend beyond mortal limits.",
    progressLabel: "52,340/100,000 kg",
    current: 52340,
    target: 100000,
    unlocked: false,
    rarity: "gold",
    points: 500,
    reward: { xp: 800, item: "Atlas Pauldrons" },
  },
  {
    id: "getting-started",
    category: "STREAK",
    name: "Getting Started",
    description: "Reach a 3-day streak.",
    fullDescription: "Momentum begins with a spark. Keep your training streak alive for three days to light the first flame.",
    progressLabel: "3/3 days",
    current: 3,
    target: 3,
    unlocked: true,
    rarity: "bronze",
    points: 15,
    reward: { xp: 75, item: "Spark Ember" },
    earnedDate: "EARNED APR 05, 2026",
  },
  {
    id: "on-fire",
    category: "STREAK",
    name: "On Fire",
    description: "Reach a 7-day streak.",
    fullDescription: "Seven days of relentless effort turns a spark into a blaze. Keep the streak alive and let the guild see your fire.",
    progressLabel: "7/7 days",
    current: 7,
    target: 7,
    unlocked: true,
    rarity: "bronze",
    points: 30,
    reward: { xp: 120, item: "Flame Sigil" },
    earnedDate: "EARNED APR 12, 2026",
  },
  {
    id: "unstoppable",
    category: "STREAK",
    name: "Unstoppable",
    description: "Reach a 14-day streak.",
    fullDescription: "Two full weeks without breaking stride marks you as a warrior of uncommon resolve. The hall records your name in silver.",
    progressLabel: "14/14 days",
    current: 14,
    target: 14,
    unlocked: true,
    rarity: "silver",
    points: 75,
    reward: { xp: 220, item: "Streak Charm" },
    earnedDate: "EARNED JUN 14, 2026",
  },
  {
    id: "immortal",
    category: "STREAK",
    name: "Immortal",
    description: "Reach a 30-day streak.",
    fullDescription: "Thirty days of unwavering discipline separates heroes from hopefuls. Keep the flame alive to claim immortality.",
    progressLabel: "14/30 days",
    current: 14,
    target: 30,
    unlocked: false,
    rarity: "gold",
    points: 200,
    reward: { xp: 450, item: "Immortal Torch" },
  },
  {
    id: "eternal-flame",
    category: "STREAK",
    name: "Eternal Flame",
    description: "Reach a 100-day streak.",
    fullDescription: "A hundred days of discipline becomes myth. Sustain your streak long enough and the trophy room itself will glow in your honor.",
    progressLabel: "14/100 days",
    current: 14,
    target: 100,
    unlocked: false,
    rarity: "diamond",
    points: 1000,
    reward: { xp: 1800, item: "Phoenix Lantern" },
  },
  {
    id: "chest-apprentice",
    category: "MASTERY",
    name: "Chest Apprentice",
    description: "Reach Chest LVL 5.",
    fullDescription: "Your chest training has moved beyond the basics. Reach level five in chest mastery to earn your apprentice badge.",
    progressLabel: "5/5 levels",
    current: 5,
    target: 5,
    unlocked: true,
    rarity: "bronze",
    points: 20,
    reward: { xp: 90, item: "Apprentice Seal" },
    earnedDate: "EARNED MAY 02, 2026",
  },
  {
    id: "arm-scholar",
    category: "MASTERY",
    name: "Arm Scholar",
    description: "Reach Arms LVL 5.",
    fullDescription: "Study the craft of curls, presses, and control. Reach level five in arm mastery to earn the scholar's mark.",
    progressLabel: "5/5 levels",
    current: 5,
    target: 5,
    unlocked: true,
    rarity: "bronze",
    points: 20,
    reward: { xp: 90, item: "Scholar Wraps" },
    earnedDate: "EARNED MAY 08, 2026",
  },
  {
    id: "chest-master",
    category: "MASTERY",
    name: "Chest Master",
    description: "Reach Chest LVL 10.",
    fullDescription: "Mastery demands patience and repeated conquest. Push your chest training to level ten to earn the master's crest.",
    progressLabel: "8/10 levels",
    current: 8,
    target: 10,
    unlocked: false,
    rarity: "silver",
    points: 100,
    reward: { xp: 260, item: "Master Crest" },
  },
  {
    id: "full-body-master",
    category: "MASTERY",
    name: "Full Body Master",
    description: "Reach LVL 10 in all muscle groups.",
    fullDescription: "True mastery is balanced power. Raise every muscle group to level ten and claim one of the rarest honors in the realm.",
    progressLabel: "0/6 groups",
    current: 0,
    target: 6,
    unlocked: false,
    rarity: "diamond",
    points: 2000,
    reward: { xp: 3000, item: "Masterwork Armor" },
  },
  {
    id: "chosen-one",
    category: "LEGENDARY",
    name: "The Chosen One",
    description: "Reach Level 20.",
    fullDescription: "The guild whispers of a warrior destined for greatness. Reach level twenty and fulfill the prophecy.",
    progressLabel: "12/20 levels",
    current: 12,
    target: 20,
    unlocked: false,
    rarity: "diamond",
    points: 5000,
    reward: { xp: 5000, item: "Chosen Mantle" },
  },
  {
    id: "mythic-warrior",
    category: "LEGENDARY",
    name: "Mythic Warrior",
    description: "Unlock all achievements.",
    fullDescription: "Only one who conquers every challenge may wear the mythic title. Unlock every achievement in the trophy room to complete your saga.",
    progressLabel: "8/24 achievements",
    current: 8,
    target: 24,
    unlocked: false,
    rarity: "diamond",
    points: 10000,
    reward: { xp: 10000, item: "Mythic Relic" },
  },
]

const categoryOrder: AchievementCategory[] = ["TRAINING", "STRENGTH", "STREAK", "MASTERY", "LEGENDARY"]

const categoryMeta: Record<AchievementCategory, { subtitle: string; accent: string }> = {
  TRAINING: { subtitle: "Workout count milestones and discipline badges.", accent: "#D4A900" },
  STRENGTH: { subtitle: "Total iron moved across your journey.", accent: "#FFD400" },
  STREAK: { subtitle: "Consecutive day flames that reward consistency.", accent: "#FFE066" },
  MASTERY: { subtitle: "Muscle group specialization and balanced growth.", accent: "#D4A900" },
  LEGENDARY: { subtitle: "Rare feats reserved for realm-defining heroes.", accent: "#FFF07A" },
}

const rarityMeta: Record<AchievementRarity, { border: string; glow: string; label: string; muted: string }> = {
  bronze: { border: "#D4A900", glow: "rgba(212,169,0,0.12)", label: "BRONZE", muted: "#8B7355" },
  silver: { border: "#FFD400", glow: "rgba(255,212,0,0.14)", label: "SILVER", muted: "#8B7355" },
  gold: { border: "#FFB800", glow: "rgba(255,184,0,0.16)", label: "GOLD", muted: "#8B7355" },
  diamond: { border: "#FFE066", glow: "rgba(255,224,102,0.18)", label: "DIAMOND", muted: "#8B7355" },
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-200" />
      <h2 className="px-2 text-sm font-semibold tracking-wide text-slate-800">{title}</h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

function AchievementIcon({ achievement }: { achievement: AchievementData }) {
  const color = achievement.unlocked ? rarityMeta[achievement.rarity].border : "#8B7355"

  switch (achievement.id) {
    case "first-step":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M10 24L14 10H20L24 24H10Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
          <path d="M17 8V26" stroke={color} strokeWidth="1.8" />
          <path d="M12 18H22" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "dedicated":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="18" height="14" rx="2" fill={color} opacity="0.18" stroke={color} strokeWidth="1.8" />
          <path d="M12 10V7H22V10" stroke={color} strokeWidth="1.8" />
          <path d="M13 17H21" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "warrior":
    case "legend":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M11 8H23V18C23 21.3 20.3 24 17 24C13.7 24 11 21.3 11 18V8Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
          <path d="M8 10H11V15C11 15 8 15 8 12V10Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.8" />
          <path d="M23 10H26V12C26 15 23 15 23 15V10Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.8" />
          <path d="M14 24V28M20 24V28M11 28H23" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "heavy-lifter":
    case "iron-giant":
    case "atlas":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <rect x="6" y="14" width="4" height="8" fill={color} opacity="0.25" stroke={color} strokeWidth="1.6" />
          <rect x="24" y="14" width="4" height="8" fill={color} opacity="0.25" stroke={color} strokeWidth="1.6" />
          <rect x="11" y="12" width="3" height="12" fill={color} opacity="0.18" stroke={color} strokeWidth="1.6" />
          <rect x="20" y="12" width="3" height="12" fill={color} opacity="0.18" stroke={color} strokeWidth="1.6" />
          <path d="M14 17H20" stroke={color} strokeWidth="2" />
        </svg>
      )
    case "getting-started":
    case "on-fire":
    case "unstoppable":
    case "immortal":
    case "eternal-flame":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M17 6C17 6 23 13 23 18C23 18 20 16 19 14C19 14 21 20 16 24C16 24 17 21 15 19C15 19 12 22 12 25C12 28 14 30 17 31C20 30 22 28 22 25C22 25 24 27 24 29C24 29 28 26 28 21C28 16 23 11 17 6Z" fill={color} opacity="0.22" stroke={color} strokeWidth="1.4" />
          <path d="M17 18C17 18 19 21 19 24C19 25.5 18.2 26.8 17 27.5C15.8 26.8 15 25.5 15 24C15 21 17 18 17 18Z" fill={color} />
        </svg>
      )
    case "chest-apprentice":
    case "chest-master":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M10 11H24V16L21 24H13L10 16V11Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
          <path d="M17 11V24" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "arm-scholar":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M10 21C10 17 13 14 16 14H19V18H16C14.5 18 13 19.5 13 21V24H10V21Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
          <path d="M24 21C24 17 21 14 18 14H15V18H18C19.5 18 21 19.5 21 21V24H24V21Z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "full-body-master":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <circle cx="17" cy="8" r="3" fill={color} opacity="0.25" stroke={color} strokeWidth="1.6" />
          <path d="M17 11V24M11 15L17 18L23 15M13 28L17 24L21 28" stroke={color} strokeWidth="1.8" />
        </svg>
      )
    case "chosen-one":
    case "mythic-warrior":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M17 5L20 13H29L22 18L24.5 27L17 22L9.5 27L12 18L5 13H14L17 5Z" fill={color} opacity="0.22" stroke={color} strokeWidth="1.6" />
        </svg>
      )
    default:
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <circle cx="17" cy="17" r="10" fill={color} opacity="0.2" stroke={color} strokeWidth="1.8" />
        </svg>
      )
  }
}

function AchievementCard({
  achievement,
  expanded,
  onToggle,
  index,
}: {
  achievement: AchievementData
  expanded: boolean
  onToggle: () => void
  index: number
}) {
  const { t } = useTranslation()
  const progress = Math.min(100, Math.round((achievement.current / achievement.target) * 100))
  const rarity = rarityMeta[achievement.rarity]
  const isDiamond = achievement.rarity === "diamond"

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className="w-full overflow-hidden text-left transition-all"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      whileTap={{ scale: 0.995 }}
      style={{
        border: `1px solid ${achievement.unlocked ? rarity.border : "#E7D7A2"}`,
        boxShadow: achievement.unlocked ? "0 12px 30px rgba(212,169,0,0.08)" : "0 8px 20px rgba(139,115,85,0.12)",
        background: "#FFFFFF",
        filter: "none",
        borderRadius: "20px",
      }}
    >
      <div className="relative px-3 py-3">
        {isDiamond && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(120deg, transparent 0%, rgba(255,212,0,0.08) 35%, transparent 70%)",
              transform: "translateX(-35%)",
            }}
          />
        )}

        <div className="relative flex items-start gap-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
            style={{
              border: `1px solid ${achievement.unlocked ? rarity.border : "#E7D7A2"}`,
              background: achievement.unlocked ? rarity.glow : "#FFFBEA",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
              color: achievement.unlocked ? rarity.border : "#B89B5E",
            }}
          >
            <AchievementIcon achievement={achievement} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold text-slate-800">{t(`achievements.achievements.${achievement.id}.name`)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: achievement.unlocked ? rarity.border : rarity.muted }}
                  >
                    {t(`achievements.rarities.${achievement.rarity}`)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {achievement.unlocked ? t("common.unlocked") : t("common.locked")}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{t("common.points")}</div>
                <div className="text-base font-semibold" style={{ color: achievement.unlocked ? rarity.border : "#94A3B8" }}>
                  {achievement.points}
                </div>
              </div>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-slate-600">{t(`achievements.achievements.${achievement.id}.description`)}</p>

            <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.55, delay: 0.12 + index * 0.03 }}
                style={{
                  background: achievement.unlocked
                    ? `linear-gradient(90deg, ${rarity.border} 0%, #FFF07A 100%)`
                    : "linear-gradient(90deg, #E7D7A2 0%, #F5E6C8 100%)",
                }}
              />
            </div>

            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{achievement.progressLabel}</span>
              <span className="text-xs font-medium text-slate-500">{progress}%</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                {t("common.reward")}: {achievement.reward.xp} XP{achievement.reward.item ? ` + ${t(`achievements.achievements.${achievement.id}.rewardItem`)}` : ""}
              </span>
              <span className="text-xs font-medium text-[#D4A017]">
                {expanded ? t("common.hideDetails") : t("common.viewDetails")}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex gap-3">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      border: `1px solid ${achievement.unlocked ? rarity.border : "#E7D7A2"}`,
                      background: achievement.unlocked ? rarity.glow : "#FFFBEA",
                      color: achievement.unlocked ? rarity.border : "#B89B5E",
                    }}
                  >
                    <div className="scale-125">
                      <AchievementIcon achievement={achievement} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-700">{t(`achievements.achievements.${achievement.id}.fullDescription`)}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{t("common.progressDetail")}</div>
                        <div className="mt-2 text-xs text-slate-700">{t(`achievements.achievements.${achievement.id}.progressLabel`)}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{t("common.rewardBreakdown")}</div>
                        <div className="mt-2 text-xs text-slate-700">
                          {achievement.reward.xp} XP{achievement.reward.item ? ` + ${t(`achievements.achievements.${achievement.id}.rewardItem`)}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {achievement.unlocked ? t(`achievements.achievements.${achievement.id}.earnedDate`) : t("common.dateEarnedUnknown")}
                      </span>
                      <span className="text-xs font-medium" style={{ color: achievement.unlocked ? rarity.border : "#B89B5E" }}>
                        {achievement.unlocked ? t("common.trophyClaimed") : t("common.stillHunting")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

function getEntryDate(entry: TrainingEntry) {
  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (entry.dateLabel) {
    case "today":
      return baseDate
    case "yesterday":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1)
    case "daysAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0))
    case "weekAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7)
  }
}

function getUniqueTrainingDays(entries: TrainingEntry[]) {
  return new Set(entries.map((entry) => getEntryDate(entry).toISOString().slice(0, 10))).size
}

function hasExercise(entries: TrainingEntry[], names: string[]) {
  const normalizedNames = names.map((name) => name.trim().toLowerCase())
  return entries.some((entry) => normalizedNames.includes(entry.exerciseName.trim().toLowerCase()))
}

function getMilestoneAchievements(entries: TrainingEntry[], big3Records: Big3Records): MilestoneAchievement[] {
  const trainingDays = getUniqueTrainingDays(entries)
  const big3Total = big3Records.benchPress + big3Records.deadlift + big3Records.squat

  return [
    {
      id: "training-days-10",
      icon: "10D",
      target: 10,
      current: trainingDays,
      unlocked: trainingDays >= 10,
    },
    {
      id: "training-days-30",
      icon: "30D",
      target: 30,
      current: trainingDays,
      unlocked: trainingDays >= 30,
    },
    {
      id: "big3-300",
      icon: "300",
      target: 300,
      current: big3Total,
      unlocked: big3Total >= 300,
    },
    {
      id: "first-bench-press",
      icon: "BP",
      target: 1,
      current: hasExercise(entries, ["Bench Press", "ベンチプレス"]) ? 1 : 0,
      unlocked: hasExercise(entries, ["Bench Press", "ベンチプレス"]),
    },
    {
      id: "first-squat",
      icon: "SQ",
      target: 1,
      current: hasExercise(entries, ["Squat", "スクワット"]) ? 1 : 0,
      unlocked: hasExercise(entries, ["Squat", "スクワット"]),
    },
    {
      id: "first-deadlift",
      icon: "DL",
      target: 1,
      current: hasExercise(entries, ["Deadlift", "デッドリフト"]) ? 1 : 0,
      unlocked: hasExercise(entries, ["Deadlift", "デッドリフト"]),
    },
  ]
}

function MilestoneCard({ achievement, index }: { achievement: MilestoneAchievement; index: number }) {
  const { t } = useTranslation()
  const progress = achievement.target === 1 ? achievement.current * 100 : Math.min(100, Math.round((achievement.current / achievement.target) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className={`rounded-[22px] border p-4 transition-all ${
        achievement.unlocked
          ? "border-[#FFE066] bg-[linear-gradient(135deg,#FFF8D6,#FFF1A8)] shadow-[0_18px_40px_rgba(212,169,0,0.16)]"
          : "border-slate-200 bg-slate-100 opacity-80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-black tracking-[0.12em] ${
            achievement.unlocked ? "bg-[#D4A900] text-white shadow-[0_12px_24px_rgba(212,169,0,0.28)]" : "bg-slate-200 text-slate-500"
          }`}
        >
          {achievement.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`text-base font-bold ${achievement.unlocked ? "text-[#0f172a]" : "text-slate-500"}`}>
                {t(`achievements.milestones.${achievement.id}.name`)}
              </h3>
              <p className={`mt-1 text-sm ${achievement.unlocked ? "text-[#334155]" : "text-slate-400"}`}>
                {t(`achievements.milestones.${achievement.id}.description`)}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
              achievement.unlocked ? "bg-white text-[#D4A900]" : "bg-slate-200 text-slate-500"
            }`}>
              {achievement.unlocked ? t("common.unlocked") : t("common.locked")}
            </span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className={`h-full rounded-full ${achievement.unlocked ? "bg-[linear-gradient(90deg,#D4A900,#FFE066)]" : "bg-slate-300"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={`mt-2 text-xs font-medium ${achievement.unlocked ? "text-[#D4A900]" : "text-slate-500"}`}>
            {t(`achievements.milestones.${achievement.id}.progress`, { current: achievement.current, target: achievement.target })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AchievementsPage({
  trainingEntries = [],
  big3Records,
}: {
  trainingEntries?: TrainingEntry[]
  big3Records?: Big3Records
}) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>("TRAINING")
  const [expandedId, setExpandedId] = useState<string | null>("first-step")
  const resolvedBig3Records = useMemo(() => big3Records ?? calculateBig3Records(trainingEntries), [big3Records, trainingEntries])
  const milestoneAchievements = useMemo(() => getMilestoneAchievements(trainingEntries, resolvedBig3Records), [resolvedBig3Records, trainingEntries])

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length
  const totalCount = 24
  const totalPoints = achievements.reduce((sum, achievement) => (
    achievement.unlocked ? sum + achievement.points : sum
  ), 0)
  const completion = Math.round((unlockedCount / totalCount) * 100)

  const visibleAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.category === activeCategory),
    [activeCategory],
  )

  return (
    <section className="min-h-full bg-[#FFFBEA] px-4 pt-4 pb-24 transition-colors duration-200 dark:bg-[#0B0B0B]">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <div className="overflow-hidden rounded-[28px] border border-[#FFE066] bg-white shadow-[0_18px_40px_rgba(212,169,0,0.08)] dark:border-[#D4A900]/20 dark:bg-[#171717]">
          <div
            className="px-5 py-5"
            style={{
              background: "linear-gradient(180deg, #FFF8D6 0%, #FFF1A8 100%)",
            }}
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4A017]">{t("achievements.trophyRoom")}</div>
            <h1 className="text-3xl font-bold text-slate-800">{t("achievements.trophyRoom")}</h1>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-500 dark:text-[#CBD5E1]">{t("achievements.achievementsCount", { unlocked: unlockedCount, total: totalCount })}</span>
                  <span className="text-sm font-semibold text-[#D4A017]">{completion}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70">
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    style={{ background: "linear-gradient(90deg, #D4A900 0%, #FFD400 55%, #FFF07A 100%)" }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#FFE066] bg-white/80 px-4 py-4 shadow-sm dark:border-[#D4A900]/20 dark:bg-[#111111]">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-[#94A3B8]">{t("achievements.totalAchievementPoints")}</div>
                <div className="mt-2 text-2xl font-bold text-slate-800 dark:text-[#F8FAFC]">{totalPoints.toLocaleString()} PTS</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        className="mb-5"
      >
        <SectionHeader title={t("achievements.achievementCategories")} />
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-2">
            {categoryOrder.map((category) => {
              const isActive = category === activeCategory
              const meta = categoryMeta[category]

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className="shrink-0 rounded-full px-4 py-2 transition-all"
                  style={{
                    border: `1px solid ${isActive ? meta.accent : "#CBD5E1"}`,
                    boxShadow: isActive ? "0 10px 24px rgba(212,169,0,0.12)" : "none",
                    background: isActive ? "#FFF1A8" : "#FFFFFF",
                  }}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: isActive ? meta.accent : "#475569" }}>
                    {t(`achievements.categories.${category}`)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-[#CBD5E1]">{t(`achievements.categorySubtitles.${activeCategory}`)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
        className="mb-5"
      >
        <SectionHeader title={t("achievements.milestoneTitle")} />
        <p className="mb-3 text-sm text-slate-500 dark:text-[#CBD5E1]">{t("achievements.milestoneSubtitle")}</p>
        <div className="grid gap-3">
          {milestoneAchievements.map((achievement, index) => (
            <MilestoneCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16 }}
      >
        <SectionHeader title={t("achievements.trophies", { category: t(`achievements.categories.${activeCategory}`) })} />
        <div className="space-y-3">
          {visibleAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              expanded={expandedId === achievement.id}
              onToggle={() => setExpandedId((current) => current === achievement.id ? null : achievement.id)}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
