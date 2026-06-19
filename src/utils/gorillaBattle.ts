import type { TrainingEntry } from "@/sections/TrainingPage"

export interface GorillaBattleStats {
  punch: number
  speed: number
  defense: number
  stamina: number
  spirit: number
  total: number
}

export interface GorillaBattleRound {
  key: keyof Omit<GorillaBattleStats, "total">
  label: string
  challengerValue: number
  opponentValue: number
  winner: "challenger" | "opponent" | "draw"
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return {
    startKey: start.toISOString().slice(0, 10),
    endKey: end.toISOString().slice(0, 10),
  }
}

function getEntryDateKey(entry: TrainingEntry) {
  if (entry.dateKey) {
    return entry.dateKey
  }

  const now = new Date()
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (entry.dateLabel) {
    case "today":
      return baseDate.toISOString().slice(0, 10)
    case "yesterday":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 1).toISOString().slice(0, 10)
    case "daysAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - (entry.daysAgo ?? 0)).toISOString().slice(0, 10)
    case "weekAgo":
      return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - 7).toISOString().slice(0, 10)
  }
}

function getEntryVolume(entry: TrainingEntry) {
  return entry.sets.reduce((sum, set) => sum + set.weight * (set.reps ?? 0), 0)
}

function isCurrentMonthEntry(entry: TrainingEntry, startKey: string, endKey: string) {
  const dateKey = getEntryDateKey(entry)
  return dateKey >= startKey && dateKey < endKey
}

export function calculateGorillaBattleStats(entries: TrainingEntry[], currentStreak = 0): GorillaBattleStats {
  const { startKey, endKey } = getMonthRange()
  const monthlyEntries = entries.filter((entry) => isCurrentMonthEntry(entry, startKey, endKey))

  const chestVolume = monthlyEntries
    .filter((entry) => entry.bodyPart === "CHEST")
    .reduce((sum, entry) => sum + getEntryVolume(entry), 0)

  const legsVolume = monthlyEntries
    .filter((entry) => entry.bodyPart === "LEGS")
    .reduce((sum, entry) => sum + getEntryVolume(entry), 0)

  const backVolume = monthlyEntries
    .filter((entry) => entry.bodyPart === "BACK")
    .reduce((sum, entry) => sum + getEntryVolume(entry), 0)

  const armVolume = monthlyEntries
    .filter((entry) => entry.bodyPart === "BICEPS" || entry.bodyPart === "TRICEPS")
    .reduce((sum, entry) => sum + getEntryVolume(entry), 0)

  const trainingDays = new Set(monthlyEntries.map((entry) => getEntryDateKey(entry))).size

  const punch = Math.floor((chestVolume + armVolume * 0.25) / 100)
  const speed = Math.floor(legsVolume / 100)
  const defense = Math.floor(backVolume / 100)
  const stamina = trainingDays * 10
  const spirit = currentStreak * 20
  const total = punch + speed + defense + stamina + spirit

  return {
    punch,
    speed,
    defense,
    stamina,
    spirit,
    total,
  }
}

export function buildBattleRounds(challengerStats: GorillaBattleStats, opponentStats: GorillaBattleStats): GorillaBattleRound[] {
  const rounds: Array<{ key: keyof Omit<GorillaBattleStats, "total">; label: string }> = [
    { key: "punch", label: "パンチ力" },
    { key: "speed", label: "スピード" },
    { key: "defense", label: "防御力" },
    { key: "stamina", label: "スタミナ" },
    { key: "spirit", label: "気合い" },
  ]

  return rounds.map(({ key, label }) => ({
    key,
    label,
    challengerValue: challengerStats[key],
    opponentValue: opponentStats[key],
    winner:
      challengerStats[key] === opponentStats[key]
        ? "draw"
        : challengerStats[key] > opponentStats[key]
          ? "challenger"
          : "opponent",
  }))
}

export function getBattleResult(challengerStats: GorillaBattleStats, opponentStats: GorillaBattleStats) {
  if (challengerStats.total === opponentStats.total) {
    return "draw" as const
  }

  return challengerStats.total > opponentStats.total ? "challenger" as const : "opponent" as const
}