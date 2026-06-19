// WorkoutLog 窶・Entry point card for recording workouts
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { IconArrowDown, IconArrowUp, IconChevronRight, IconEqual, IconSparkGym } from "@/icons"
import { useTranslation } from "react-i18next"
import { XP_PER_VOLUME_UNIT, type TrainingEntry } from "@/sections/TrainingPage"
import EmptyState from "@/components/EmptyState"

interface TodayTrainingSummary {
  date: string
  exerciseCount: number
  setCount: number
  totalWeight: number
}

interface WorkoutLogProps {
  onClick?: () => void
  onCtaClick?: () => void
  todaySummary?: TodayTrainingSummary | null
  trainingEntries?: TrainingEntry[]
  onDateSelect?: (dateKey: string) => void
  selectedDateKey?: string | null
}

function formatSummaryDate(date: string, locale: string) {
  if (!date) {
    return ""
  }

  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed)
}

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? `${weight}` : weight.toFixed(1)
}

function getEntryDate(entry: TrainingEntry) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  switch (entry.dateLabel) {
    case "today":
      return date
    case "yesterday":
      date.setDate(date.getDate() - 1)
      return date
    case "daysAgo":
      date.setDate(date.getDate() - (entry.daysAgo ?? 0))
      return date
    case "weekAgo":
      date.setDate(date.getDate() - 7)
      return date
  }
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEntryXP(entry: TrainingEntry) {
  return Math.round(entry.sets.reduce((total, set) => total + set.weight * (set.reps ?? 0), 0) * XP_PER_VOLUME_UNIT)
}

function getMonthlySummary(entries: TrainingEntry[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentMonthStart = getStartOfMonth(today)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const summarize = (start: Date, end: Date) => {
    const filtered = entries.filter((entry) => {
      const entryDate = getEntryDate(entry)
      return entryDate >= start && entryDate < end
    })

    return {
      workoutCount: filtered.length,
      setCount: filtered.reduce((total, entry) => total + entry.sets.length, 0),
      xp: filtered.reduce((total, entry) => total + getEntryXP(entry), 0),
    }
  }

  const current = summarize(currentMonthStart, nextMonthStart)
  const previous = summarize(previousMonthStart, currentMonthStart)

  return {
    current,
    previous,
    deltas: {
      workoutCount: current.workoutCount - previous.workoutCount,
      setCount: current.setCount - previous.setCount,
      xp: current.xp - previous.xp,
    },
  }
}

function ComparisonPill({ delta }: { delta: number }) {
  const { t } = useTranslation()

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1A8] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#D4A900]">
        <IconArrowUp className="h-3.5 w-3.5" />
        {t("home.monthlyComparisonIncrease", { value: Math.abs(delta) })}
      </span>
    )
  }

  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e2e8f0] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#64748b]">
        <IconArrowDown className="h-3.5 w-3.5" />
        {t("home.monthlyComparisonDecrease", { value: Math.abs(delta) })}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8D6] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#FFE066]">
      <IconEqual className="h-3.5 w-3.5" />
      {t("home.monthlyComparisonSame")}
    </span>
  )
}

export default function WorkoutLog({ onClick, onCtaClick, todaySummary, trainingEntries = [], onDateSelect, selectedDateKey = null }: WorkoutLogProps) {
  const { t, i18n } = useTranslation()
  const summaryDate = todaySummary ? formatSummaryDate(todaySummary.date, i18n.language) : ""
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthLabel = new Intl.DateTimeFormat(i18n.language === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
  }).format(currentMonth)
  const trainingDateKeys = new Set(
    trainingEntries.map((entry) => {
      const entryDate = getEntryDate(entry)
      return entryDate.toISOString().slice(0, 10)
    }),
  )
  const calendarStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const startDay = calendarStart.getDay()
  const offset = (startDay + 6) % 7
  calendarStart.setDate(calendarStart.getDate() - offset)
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart)
    date.setDate(calendarStart.getDate() + index)
    const dateKey = date.toISOString().slice(0, 10)
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
    const isToday = dateKey === today.toISOString().slice(0, 10)
    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      hasTraining: trainingDateKeys.has(dateKey),
    }
  })
  const weekdayLabels = i18n.language === "ja"
    ? ["月", "火", "水", "木", "金", "土", "日"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const monthlySummary = useMemo(() => getMonthlySummary(trainingEntries), [trainingEntries])
  const hasTrainingEntries = trainingEntries.length > 0

  return (
    <motion.section
      className="bg-[#FFFBEA] px-5 pb-6 pt-4 transition-colors duration-200 dark:bg-[#0B0B0B]"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div
        className="flex items-center gap-4 rounded-[1.75rem] bg-white px-4 py-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-transform duration-150 hover:-translate-y-0.5 dark:bg-[#171717]"
        role="button"
        tabIndex={0}
        aria-label={t("home.workoutLogAria")}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onClick?.()
          }
        }}
      >
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#D4A900,#FFE066)] shadow-[0_16px_32px_rgba(37,99,235,0.28)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 9H7V15H4V9Z" fill="white"/>
            <path d="M17 9H20V15H17V9Z" fill="white"/>
            <path d="M7 11H17V13H7V11Z" fill="white"/>
            <path d="M2 8H4V16H2V8Z" fill="white" fillOpacity="0.8"/>
            <path d="M20 8H22V16H20V8Z" fill="white" fillOpacity="0.8"/>
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black tracking-[0.02em] text-[#0f172a] dark:text-[#F8FAFC]">{t("home.workoutLogTitle")}</h2>
          <p className="mt-1 text-sm text-[#64748b] dark:text-[#CBD5E1]">{t("home.workoutLogDescription")}</p>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onCtaClick?.()
          }}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#D4A900] text-white shadow-[0_14px_28px_rgba(37,99,235,0.28)]"
          aria-label={t("home.startTodayTraining")}
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 rounded-[1.75rem] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-colors duration-200 dark:bg-[#171717]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF8D6] text-[#D4A900]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 10H20" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-[#1e293b] dark:text-[#F8FAFC]">{monthLabel}</h3>
              <p className="mt-1 text-sm text-[#64748b] dark:text-[#CBD5E1]">{t("home.workoutLogDescription")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFF1A8] bg-[#f8fbff] text-[#D4A900] transition hover:bg-[#FFF8D6] dark:border-[#D4A900]/25 dark:bg-[#111111] dark:text-[#FFE066]"
              aria-label="Previous month"
            >
              <span className="text-lg leading-none">窶ｹ</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#FFF1A8] bg-[#f8fbff] text-[#D4A900] transition hover:bg-[#FFF8D6] dark:border-[#D4A900]/25 dark:bg-[#111111] dark:text-[#FFE066]"
              aria-label="Next month"
            >
              <span className="text-lg leading-none">窶ｺ</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-center text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#64748b] dark:text-[#CBD5E1]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2">
          {calendarDays.map((day) => (
            <button
              type="button"
              key={day.dateKey}
              onClick={() => onDateSelect?.(day.dateKey)}
              aria-label={t("home.calendarDateAria", { date: day.dateKey })}
              className={`relative flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                day.isCurrentMonth
                  ? day.hasTraining
                    ? "border-[#bfdbfe] bg-blue-100 text-[#1e293b] dark:border-[#FFD400] dark:bg-[#171717] dark:text-[#F8FAFC]"
                    : "border-[#e2e8f0] bg-white text-[#1e293b] dark:border-[#1f2937] dark:bg-[#111111] dark:text-[#F8FAFC]"
                  : day.hasTraining
                    ? "border-[#FFF1A8] bg-[#FFF8D6] text-[#475569] dark:border-[#D4A900]/20 dark:bg-[#171717] dark:text-[#CBD5E1]"
                    : "border-transparent bg-[#f8fafc] text-[#94a3b8] dark:bg-[#111111] dark:text-[#64748B]"
              } ${day.isToday ? "ring-2 ring-[#D4A900] ring-offset-1 ring-offset-white dark:ring-offset-[#171717]" : ""} ${selectedDateKey === day.dateKey ? "ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-white dark:ring-offset-[#171717]" : ""}`}
            >
              <span>{day.dayNumber}</span>
            </button>
          ))}
        </div>

        {!hasTrainingEntries ? (
          <div className="mt-5">
            <EmptyState
              icon={<IconSparkGym className="h-10 w-10" />}
              title="まだワークアウトログがありません"
              description="今日のトレーニングを始めると、カレンダーや月間サマリーに記録が反映されます。まずは1回記録してみましょう。"
              actionLabel="今日のトレーニングを始める"
              onAction={onCtaClick}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-4 rounded-[1.75rem] bg-[linear-gradient(135deg,#FFF8D6,#FFF1A8)] p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] dark:bg-[#171717]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#D4A900]">{t("home.monthlySummaryTitle")}</div>
              <h3 className="mt-1 text-base font-black text-[#0f172a] dark:text-[#F8FAFC]">
                {t("home.monthlySummaryHeadline", {
                  workouts: monthlySummary.current.workoutCount,
                  sets: monthlySummary.current.setCount,
                  xp: monthlySummary.current.xp,
                })}
              </h3>
            </div>
            <div className="rounded-2xl bg-white/70 px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[#111111]">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.lastMonthLabel")}</div>
              <div className="mt-1 text-[0.78rem] font-bold text-[#1e293b] dark:text-[#F8FAFC]">
                {t("home.monthlySummaryCompact", {
                  workouts: monthlySummary.previous.workoutCount,
                  sets: monthlySummary.previous.setCount,
                  xp: monthlySummary.previous.xp,
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <div className="rounded-[1.1rem] bg-white/80 p-3 dark:bg-[#111111]">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.monthlyWorkoutsLabel")}</div>
              <div className="mt-1 text-lg font-black text-[#0f172a] dark:text-[#F8FAFC]">{monthlySummary.current.workoutCount}</div>
              <div className="mt-2"><ComparisonPill delta={monthlySummary.deltas.workoutCount} /></div>
            </div>
            <div className="rounded-[1.1rem] bg-white/80 p-3 dark:bg-[#111111]">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.monthlySetsLabel")}</div>
              <div className="mt-1 text-lg font-black text-[#0f172a] dark:text-[#F8FAFC]">{monthlySummary.current.setCount}</div>
              <div className="mt-2"><ComparisonPill delta={monthlySummary.deltas.setCount} /></div>
            </div>
            <div className="rounded-[1.1rem] bg-white/80 p-3 dark:bg-[#111111]">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.monthlyXpLabel")}</div>
              <div className="mt-1 text-lg font-black text-[#0f172a] dark:text-[#F8FAFC]">{monthlySummary.current.xp} XP</div>
              <div className="mt-2"><ComparisonPill delta={monthlySummary.deltas.xp} /></div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#0f172a] dark:text-[#F8FAFC]">{t("home.todayStatsTitle")}</h3>
          <button type="button" className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A900]">
            {t("home.viewAll")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)] dark:bg-[#171717]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF8D6] text-[#D4A900]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 4L14.472 9.008L20 9.816L16 13.712L16.944 19.216L12 16.616L7.056 19.216L8 13.712L4 9.816L9.528 9.008L12 4Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC]">{todaySummary ? Math.max(540, todaySummary.setCount * 45) : 540}</div>
            <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.xpEarnedStat")}</div>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)] dark:bg-[#171717]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF8D6] text-[#D4A900]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3C13.5 6 17 7.5 17 11C17 13.761 14.761 16 12 16C9.239 16 7 13.761 7 11C7 8.5 8.5 6.5 10 5C10.5 7 11.5 8 12 8.5C12.5 7.5 12.8 5.8 12 3Z" fill="currentColor"/>
                <path d="M10 17H14C14 18.657 13.105 20 12 20C10.895 20 10 18.657 10 17Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC]">{todaySummary ? Math.max(612, Math.round(todaySummary.totalWeight / 8)) : 612}</div>
            <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.caloriesStat")}</div>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)] dark:bg-[#171717]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF8D6] text-[#D4A900]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-xl font-black text-[#0f172a] dark:text-[#F8FAFC]">{todaySummary ? Math.max(68, todaySummary.exerciseCount * 12) : 68}</div>
            <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.minutesStat")}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.06)] dark:bg-[#171717]">
          {todaySummary ? (
            <div className="space-y-1 text-sm text-[#334155] dark:text-[#CBD5E1]">
              <div className="font-semibold text-[#0f172a] dark:text-[#F8FAFC]">{summaryDate}</div>
              <div>{t("home.todaySummaryExercises", { count: todaySummary.exerciseCount })}</div>
              <div>{t("home.todaySummarySets", { count: todaySummary.setCount })}</div>
              <div>{t("home.todaySummaryWeight", { weight: formatWeight(todaySummary.totalWeight) })}</div>
            </div>
          ) : (
            <p className="text-sm text-[#64748b] dark:text-[#CBD5E1]">{t("home.noTrainingToday")}</p>
          )}
        </div>
      </div>
    </motion.section>
  )
}
