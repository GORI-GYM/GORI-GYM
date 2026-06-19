import gorillaImage from "./gorilla.png"
import gorillaLv1Image from "./gorilla_lv1.png"
import gorillaLv2Image from "./gorilla_lv2.png"
import gorillaLv3Image from "./gorilla_lv3.png"
import gorillaLv4Image from "./gorilla_lv4.png"
import gorillaLv5Image from "./gorilla_lv5.png"

export type CharacterId = "gorilla"

export interface CharacterOption {
  id: CharacterId
  image: string
  labelKey: string
  subtitleKey: string
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  { id: "gorilla", image: gorillaImage, labelKey: "character.animals.gorilla", subtitleKey: "character.animalsSubtitle.gorilla" },
]

export const CHARACTER_IMAGE_MAP: Record<CharacterId, string> = {
  gorilla: gorillaImage,
}

export const CHARACTER_GROWTH_MAP: Record<CharacterId, [string, string, string, string, string]> = {
  gorilla: [gorillaLv1Image, gorillaLv2Image, gorillaLv3Image, gorillaLv4Image, gorillaLv5Image],
}

export function getCharacterGrowthImage(characterId: CharacterId, level: number) {
  const normalizedLevel = Math.max(1, Math.min(20, Math.floor(level)))
  const growthIndex = Math.min(4, Math.floor((normalizedLevel - 1) / 4))
  return CHARACTER_GROWTH_MAP[characterId][growthIndex]
}