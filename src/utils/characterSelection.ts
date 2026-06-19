import type { CharacterId } from "@/assets/characters"

export const SELECTED_CHARACTER_STORAGE_KEY = "gym-quest:selected-character"

export function isCharacterId(value: string | null): value is CharacterId {
  return value === "gorilla"
}