import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getCharacterGrowthImage, type CharacterId } from "@/assets/characters"
import type { Big3OneRMRecords } from "@/sections/TrainingPage"
import BackupSection from "@/sections/BackupSection"
import EmptyState from "@/components/EmptyState"
import { IconGorillaFace } from "@/icons"

type MuscleGroupKey = "chest" | "arms" | "legs" | "back" | "shoulders" | "core"

interface MuscleGroup {
  key: MuscleGroupKey
  name: string
  level: number
  workouts: number
  currentXP: number
  maxXP: number
}

interface CharacterPageProps {
  xp: number
  selectedCharacter: CharacterId
  monthlyCharacterLevel: number
  onBackupImportComplete?: () => void
  bodyPartXP: {
    chest: number
    arms: number
    legs: number
    back: number
    shoulders: number
    core: number
  }
  monthlyHistory: {
    monthKey: string
    monthLabel: string
    level: number
    xp: number
    workoutCount: number
    trainingDays: number
  }[]
  big3OneRMRecords: Big3OneRMRecords
}

const CHARACTER = {
  name: "WARRIOR",
  title: "IRON WARRIOR",
  joinedDaysAgo: 94,
}

const TOTAL_WEIGHT = 52340

function getCharacterClass(groups: MuscleGroup[]) {
  const levels = groups.map((group) => group.level)
  const highestLevel = Math.max(...levels)
  const lowestLevel = Math.min(...levels)

  if (highestLevel - lowestLevel <= 2) {
    return "BALANCED WARRIOR"
  }

  const highestGroup = groups.find((group) => group.level === highestLevel)

  switch (highestGroup?.key) {
    case "chest":
      return "CHEST TITAN"
    case "legs":
      return "LEG COLOSSUS"
    case "arms":
      return "ARM BERSERKER"
    case "back":
      return "BACK GUARDIAN"
    case "shoulders":
      return "SHOULDER SENTINEL"
    case "core":
      return "CORE TEMPEST"
    default:
      return "IRON WARRIOR"
  }
}

function getFavoriteMuscleGroup(groups: MuscleGroup[]) {
  return groups.reduce((favorite, group) => (
    group.workouts > favorite.workouts ? group : favorite
  )).name
}

function getWorkoutsToNextLevel(group: MuscleGroup) {
  const remainingXP = group.maxXP - group.currentXP
  return Math.max(1, Math.ceil(remainingXP / 40))
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-slate-200" />
      <h2 className="px-2 text-sm font-semibold tracking-wide text-slate-800">{title}</h2>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

function MuscleIcon({ group }: { group: MuscleGroupKey }) {
  const commonProps = {
    fill: "currentColor",
    stroke: "currentColor",
    strokeWidth: 1.2,
  }

  switch (group) {
    case "chest":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path {...commonProps} d="M4 5H14V8L12 13H6L4 8V5Z" opacity="0.2" />
          <path {...commonProps} d="M9 5V13" />
        </svg>
      )
    case "arms":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path {...commonProps} d="M4 11C4 8 6 6 8 6H10V9H8C7 9 6 10 6 11V13H4V11Z" opacity="0.2" />
          <path {...commonProps} d="M14 11C14 8 12 6 10 6H8V9H10C11 9 12 10 12 11V13H14V11Z" opacity="0.2" />
        </svg>
      )
    case "legs":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path {...commonProps} d="M6 4H8V14H5V9L6 4Z" opacity="0.2" />
          <path {...commonProps} d="M10 4H12L13 9V14H10V4Z" opacity="0.2" />
        </svg>
      )
    case "back":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path {...commonProps} d="M5 4H13V14H5V4Z" opacity="0.2" />
          <path {...commonProps} d="M7 6H11M7 9H11M7 12H11" />
        </svg>
      )
    case "shoulders":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path {...commonProps} d="M3 8C4 5 6 4 9 4C12 4 14 5 15 8H12C11 7 10 7 9 7C8 7 7 7 6 8H3Z" opacity="0.2" />
        </svg>
      )
    case "core":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <rect {...commonProps} x="6" y="3" width="6" height="12" opacity="0.2" />
          <path {...commonProps} d="M6 7H12M6 11H12" />
        </svg>
      )
  }
}

function StatSummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-800" style={{ color: accent ?? "#1E293B" }}>
        {value}
      </div>
    </div>
  )
}

function MonthlyHistoryCard({
  monthLabel,
  level,
  trainingDays,
  xp,
  isCurrentMonth,
}: {
  monthLabel: string
  level: number
  trainingDays: number
  xp: number
  isCurrentMonth: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-[24px] border border-[#F5A623]/30 bg-gradient-to-br from-[#FFF9E8] via-white to-[#FFF2CC] p-4 shadow-[0_14px_30px_rgba(245,166,35,0.12)] dark:border-[#F5A623]/20 dark:from-[#171717] dark:via-[#111111] dark:to-[#1B1608]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-white">{monthLabel}</div>
          <div className="mt-1 inline-flex items-center rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10 px-2.5 py-1 text-[11px] font-semibold text-[#B7791F] dark:text-[#F8D27A]">
            {isCurrentMonth ? t("character.historyCurrentMonth") : t("character.historyArchived")}
          </div>
        </div>
        <div className="rounded-2xl bg-[#111111] px-3 py-2 text-right text-white shadow-sm dark:bg-[#F5A623] dark:text-[#111111]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em]">{t("character.historyReachedLevel")}</div>
          <div className="mt-1 text-lg font-bold">{t("character.monthlyLevel", { level })}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#F5A623]/20 bg-white/80 px-3 py-3 text-center dark:bg-[#0F0F0F]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B7791F]">{t("character.historyTrainingDays")}</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{trainingDays}</div>
        </div>
        <div className="rounded-2xl border border-[#F5A623]/20 bg-white/80 px-3 py-3 text-center dark:bg-[#0F0F0F]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B7791F]">{t("character.historyXp")}</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{xp}</div>
        </div>
        <div className="rounded-2xl border border-[#F5A623]/20 bg-white/80 px-3 py-3 text-center dark:bg-[#0F0F0F]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B7791F]">{t("character.historyRank")}</div>
          <div className="mt-1 text-lg font-bold text-slate-800 dark:text-white">Lv{level}</div>
        </div>
      </div>
    </div>
  )
}

export default function CharacterPage({
  xp,
  bodyPartXP,
  monthlyHistory,
  monthlyCharacterLevel,
  selectedCharacter,
  big3OneRMRecords,
  onBackupImportComplete,
}: CharacterPageProps) {
  const { t } = useTranslation()
  const muscleGroups: MuscleGroup[] = [
    { key: "chest", name: "CHEST", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.chest / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.chest / 1200)), currentXP: bodyPartXP.chest % 5000, maxXP: 5000 },
    { key: "arms", name: "ARMS", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.arms / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.arms / 1200)), currentXP: bodyPartXP.arms % 5000, maxXP: 5000 },
    { key: "legs", name: "LEGS", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.legs / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.legs / 1200)), currentXP: bodyPartXP.legs % 5000, maxXP: 5000 },
    { key: "back", name: "BACK", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.back / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.back / 1200)), currentXP: bodyPartXP.back % 5000, maxXP: 5000 },
    { key: "shoulders", name: "SHOULDERS", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.shoulders / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.shoulders / 1200)), currentXP: bodyPartXP.shoulders % 5000, maxXP: 5000 },
    { key: "core", name: "CORE", level: Math.min(10, Math.max(1, Math.floor(bodyPartXP.core / 5000) + 1)), workouts: Math.max(1, Math.round(bodyPartXP.core / 1200)), currentXP: bodyPartXP.core % 5000, maxXP: 5000 },
  ]
  const characterClass = getCharacterClass(muscleGroups)
  const oneRMItems = [
    { key: "benchPress", label: t("training.suggestions.benchPress"), value: big3OneRMRecords.benchPress.estimatedMax },
    { key: "squat", label: t("training.suggestions.squat"), value: big3OneRMRecords.squat.estimatedMax },
    { key: "deadlift", label: t("training.suggestions.deadlift"), value: big3OneRMRecords.deadlift.estimatedMax },
  ]
  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const hasGrowthHistory = monthlyHistory.length > 0

  return (
    <div className="min-h-full bg-[#FFFBEA] transition-colors duration-200 dark:bg-[#0B0B0B]">
      <section
        className="relative overflow-hidden px-4 pt-6 pb-6"
        style={{
          background: "linear-gradient(180deg, #FFF8D6 0%, #FFF1A8 100%)",
          minHeight: "340px",
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at top, rgba(255,212,0,0.18), transparent 48%),
              linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,240,122,0.2))
            `,
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4A017]">{t("character.growth")}</div>
            <h1 className="m-0 text-3xl font-bold text-slate-800">
              {t(`character.animals.${selectedCharacter}`)}
            </h1>
            <div className="mt-2 text-sm font-semibold text-[#B8860B]">
              {t(`character.animalsSubtitle.${selectedCharacter}`)}
            </div>
            <div className="mt-2 text-sm text-slate-500">{t("character.monthlyLevel", { level: monthlyCharacterLevel })}</div>
          </div>
          <>
            <div className="rounded-[28px] border border-[#FFE066] bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(212,169,0,0.12)] backdrop-blur-sm dark:border-[#D4A900]/20 dark:bg-[#171717]/90">
              <div className="flex items-center justify-center rounded-[24px] bg-transparent px-4 py-5">
                <img
                  src={getCharacterGrowthImage(selectedCharacter, monthlyCharacterLevel)}
                  alt={t(`character.animals.${selectedCharacter}`)}
                  className="max-h-[320px] w-auto object-contain drop-shadow-[0_18px_30px_rgba(212,169,0,0.18)]"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-[320px]">
              {muscleGroups.slice(0, 4).map((group) => (
                <div
                  key={group.key}
                  className="rounded-2xl border border-[#FFE066] bg-white px-3 py-3 text-center shadow-sm dark:border-[#D4A900]/20 dark:bg-[#111111]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A017]">{t(`character.muscleGroups.${group.key}`)}</div>
                  <div className="mt-1 text-sm font-medium text-slate-600 dark:text-[#CBD5E1]">{t("common.levelShort")} {group.level}</div>
                </div>
              ))}
            </div>
          </>
        </div>
      </section>

      <motion.section
        className="px-4 pt-5 pb-2"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <SectionHeader title={t("character.bodyDevelopment")} />

        <div className="grid gap-3">
          {muscleGroups.map((group, index) => {
            const progress = (group.currentXP / group.maxXP) * 100
            const workoutsToNextLevel = getWorkoutsToNextLevel(group)

            return (
              <motion.article
                key={group.key}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-[#D4A900]/20 dark:bg-[#171717]"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.12 + index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FFE066] bg-[#FFF8D6] text-[#D4A017]">
                    <MuscleIcon group={group.key} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-base font-semibold text-slate-800 dark:text-[#F8FAFC]">{t(`character.muscleGroups.${group.key}`)}</div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-[#CBD5E1]">
                          {t("common.levelShort")} {group.level} / 10
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-[#94A3B8]">{t("character.workoutsLabel")}</div>
                        <div className="text-base font-semibold text-[#D4A017]">{group.workouts}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-[#111111]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #D4A900 0%, #FFD400 55%, #FFF07A 100%)",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + index * 0.06, ease: "easeOut" }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 dark:text-[#CBD5E1]">
                          {group.currentXP}/{group.maxXP} XP
                        </span>
                        <span className="text-xs font-medium text-[#D4A017]">
                          {t("common.moreWorkouts", { count: workoutsToNextLevel })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </motion.section>

      <motion.section
        className="px-4 pt-4 pb-8"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.18 }}
      >
        <SectionHeader title={t("character.historyTitle")} />
        <div className="rounded-[28px] border border-[#F5A623]/25 bg-white/90 p-4 shadow-[0_18px_40px_rgba(245,166,35,0.12)] dark:border-[#F5A623]/15 dark:bg-[#121212]">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-800 dark:text-white">{t("character.historySubtitle")}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("character.historyResetNotice")}</div>
          </div>

          {hasGrowthHistory ? (
            <div className="space-y-3">
              {monthlyHistory.map((entry) => (
                <MonthlyHistoryCard
                  key={entry.monthKey}
                  monthLabel={entry.monthLabel}
                  level={entry.level}
                  trainingDays={entry.trainingDays}
                  xp={entry.xp}
                  isCurrentMonth={entry.monthKey === currentMonthKey}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconGorillaFace className="h-10 w-10" />}
              title="トレーニングしてゴルを育てよう！"
              description="成長履歴は、トレーニングを記録するとここに追加されます。まずは1回ワークアウトして、ゴルの進化を始めましょう。"
            />
          )}
        </div>
      </motion.section>

      <motion.section
        className="px-4 pt-5 pb-2"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.16 }}
      >
        <SectionHeader title={t("character.monthlyHistory")} />

        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!hasGrowthHistory ? (
            <EmptyState
              className="mb-2"
              icon={<IconGorillaFace className="h-10 w-10" />}
              title="まだ成長アーカイブはありません"
              description="月ごとの成長カードは、トレーニングを重ねると自動で並びます。最初の記録を作って、ここを埋めていきましょう。"
            />
          ) : null}
          {hasGrowthHistory ? (
          <div className="flex gap-3 min-w-max">
            {monthlyHistory.map((entry, index) => (
              <motion.article
                key={entry.monthKey}
                className="w-[180px] shrink-0 rounded-[24px] border border-[#FFE066] bg-[linear-gradient(180deg,#ffffff_0%,#FFF8D6_100%)] p-4 shadow-[0_16px_36px_rgba(212,169,0,0.12)] dark:border-[#D4A900]/20 dark:bg-[#171717]"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.18 + index * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8860B]">{entry.monthLabel}</div>
                    <div className="mt-2 text-lg font-bold text-slate-800 dark:text-[#F8FAFC]">{t("character.monthlyLevelShort", { level: entry.level })}</div>
                  </div>
                  <div className="rounded-full bg-[#FFF1A8] px-2 py-1 text-[11px] font-semibold text-[#8A6500]">
                    {entry.workoutCount} {t("character.sessionsShort")}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center rounded-[20px] border border-[#FFE066] bg-white/80 py-2 dark:border-[#D4A900]/20 dark:bg-[#111111]">
                  <img
                    src={getCharacterGrowthImage(selectedCharacter, entry.level)}
                    alt={t(`character.animals.${selectedCharacter}`)}
                    className="h-[120px] w-auto object-contain drop-shadow-[0_12px_20px_rgba(212,169,0,0.16)]"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-[#CBD5E1]">
                  <span>{t("character.monthlyXp")}</span>
                  <span className="font-semibold text-[#D4A017]">{entry.xp.toLocaleString()} XP</span>
                </div>
              </motion.article>
            ))}
          </div>
          ) : null}
        </div>
      </motion.section>

      <motion.section
        className="px-4 pt-5 pb-2"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <SectionHeader title={t("character.oneRMSection")} />
        <div className="grid gap-3">
          {oneRMItems.map((item, index) => (
            <motion.article
              key={item.key}
              className="rounded-[24px] border border-[#FFE066] bg-[linear-gradient(180deg,#ffffff_0%,#FFF8D6_100%)] px-4 py-4 shadow-[0_16px_36px_rgba(212,169,0,0.12)] dark:border-[#D4A900]/20 dark:bg-[#171717]"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.22 + index * 0.05 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8860B]">{t("training.estimatedMax")}</div>
                  <div className="mt-1 text-base font-semibold text-slate-800 dark:text-[#F8FAFC]">{item.label}</div>
                </div>
                <div className="rounded-2xl border border-[#FFD54A] bg-white px-4 py-3 text-right shadow-sm dark:border-[#D4A900]/20 dark:bg-[#111111]">
                  <div className="text-2xl font-bold text-[#8A6500]">{item.value.toFixed(1).replace(/\.0$/, "")}kg</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="px-4 pt-5 pb-2"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <SectionHeader title={t("character.statsSummary")} />

        <div className="grid grid-cols-2 gap-3">
          <StatSummaryCard label={t("character.totalXP")} value={xp.toLocaleString()} accent="var(--color-gold-dark)" />
          <StatSummaryCard label={t("character.totalWeight")} value={`${TOTAL_WEIGHT.toLocaleString()} KG`} accent="var(--color-fire)" />
          <StatSummaryCard label={t("character.favoriteGroup")} value={t(`character.muscleGroups.${getFavoriteMuscleGroup(muscleGroups).toLowerCase()}`)} />
          <StatSummaryCard label={t("character.class")} value={t(`character.classes.${characterClass === "BALANCED WARRIOR" ? "balanced" : characterClass === "CHEST TITAN" ? "chest" : characterClass === "LEG COLOSSUS" ? "legs" : characterClass === "ARM BERSERKER" ? "arms" : characterClass === "BACK GUARDIAN" ? "back" : characterClass === "SHOULDER SENTINEL" ? "shoulders" : characterClass === "CORE TEMPEST" ? "core" : "default"}`)} accent="var(--color-gold-dark)" />
          <StatSummaryCard label={t("character.daysSinceJoining")} value={t("character.days", { count: CHARACTER.joinedDaysAgo })} />
          <StatSummaryCard label={t("character.currentTitle")} value={t("character.characterTitle")} />
        </div>
      </motion.section>

      <BackupSection onImportComplete={onBackupImportComplete} />

    </div>
  )
}
