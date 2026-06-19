export type GuildWarStatus = "pending" | "active" | "completed"

export interface GuildWarContribution {
  uid: string
  displayName: string
  xp: number
}

export interface GuildWarProgress {
  totalXP: number
  contributions: GuildWarContribution[]
}

export interface GuildWarWeekRange {
  weekStart: string
  weekEnd: string
}

export function getWeekRange(baseDate = new Date()): GuildWarWeekRange {
  const date = new Date(baseDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)

  return {
    weekStart: toDateKey(start),
    weekEnd: toDateKey(end),
  }
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function isDateWithinRange(dateKey: string, startKey: string, endKey: string) {
  return dateKey >= startKey && dateKey <= endKey
}

export function calculateGuildWarWinner(
  guild1Id: string,
  guild2Id: string,
  guild1TotalXP: number,
  guild2TotalXP: number,
) {
  if (guild1TotalXP === guild2TotalXP) {
    return null
  }

  return guild1TotalXP > guild2TotalXP ? guild1Id : guild2Id
}

export function getGuildWarProgressRatio(leftXP: number, rightXP: number) {
  const total = Math.max(leftXP + rightXP, 1)
  return {
    left: Math.max(0, Math.min(100, (leftXP / total) * 100)),
    right: Math.max(0, Math.min(100, (rightXP / total) * 100)),
  }
}

export function isGuildWarWeekFinished(baseDate = new Date()) {
  const date = new Date(baseDate)
  const day = date.getDay()
  return day === 0
}