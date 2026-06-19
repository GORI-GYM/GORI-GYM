export type GorillaEmotion = "HAPPY" | "PROUD" | "NORMAL" | "LONELY" | "SAD" | "ANGRY"

export interface GorillaEmotionState {
  emotion: GorillaEmotion
  lastTrainingAt: string | null
  lastEmotionUpdatedAt: string
  skippedDays: number
}

export const GORILLA_EMOTION_STORAGE_KEY = "gym-quest-gorilla-emotion"

const DAY_MS = 24 * 60 * 60 * 1000

const GORILLA_LINES: Record<GorillaEmotion, readonly string[]> = {
  HAPPY: [
    "ナイストレーニング！💪お前やるじゃん！",
    "その調子だ！ゴリラ界でも噂になってるぞ！",
    "ウホッ！今日は筋肉が喜んでる！",
    "今の一発、完全に主人公ムーブだったぞ！",
    "最高だ！その汗、全部強さに変わってる！",
    "見たかこの笑顔！お前の努力で俺までアガる！",
  ],
  PROUD: [
    "○週連続達成…お前、本物だな。",
    "一緒にいると俺も強くなれる気がする。",
    "継続できるやつが最後に勝つ。お前はその側だ。",
    "その積み上げ、もう才能を超えてるぞ。",
    "今日も続いてるな。その覚悟、好きだぜ。",
    "お前のストリーク、もう伝説の匂いがする。",
  ],
  NORMAL: [
    "よう、今日もジム行くか？",
    "俺の筋肉が疼いてるぜ。",
    "まだまだ伸びる。今日は何を鍛える？",
    "準備はいいか？鉄が待ってるぞ。",
    "少しでも動けば、昨日の自分を超えられる。",
    "俺はいつでも付き合う。さあ行こうぜ。",
  ],
  LONELY: [
    "今日は来ないのか…？まあいいけど…",
    "ちょっと寂しいぞ…",
    "ジムの空気、今日は静かすぎるな。",
    "お前がいないと、なんか調子が出ない。",
    "一回休みか…でも顔くらい見せろよ。",
  ],
  SAD: [
    "おい…俺のこと忘れてないよな？",
    "筋肉が…しぼんできた気がする…",
    "待ってたんだぞ。ずっとな…",
    "このままだと、俺まで弱くなっちまう。",
    "前みたいにまた一緒に追い込もうぜ…",
    "静かな日が続くと、心まで軽くなるんだよ…悪い意味で。",
  ],
  ANGRY: [
    "おい！！いつまでサボってんだ！！",
    "俺の筋肉返せ！！",
    "…もういい。お前なんか知らない。",
    "その言い訳、ダンベルより軽いぞ！",
    "怒ってるんじゃない。失望してるんだ…いや、やっぱ怒ってる！",
    "今すぐ来い！この沈黙、ぶち壊せ！！",
  ],
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getSkippedDays(lastTrainingAt: string | null, now = new Date()) {
  if (!lastTrainingAt) {
    return 3
  }

  const lastDate = new Date(lastTrainingAt)
  if (Number.isNaN(lastDate.getTime())) {
    return 3
  }

  const diff = startOfDay(now).getTime() - startOfDay(lastDate).getTime()
  return Math.max(0, Math.floor(diff / DAY_MS))
}

export function resolveGorillaEmotion(lastTrainingAt: string | null, currentStreak: number, now = new Date()): GorillaEmotionState {
  const skippedDays = getSkippedDays(lastTrainingAt, now)
  let emotion: GorillaEmotion = "NORMAL"

  if (skippedDays === 0) {
    emotion = "HAPPY"
  } else if (skippedDays >= 3) {
    emotion = "ANGRY"
  } else if (skippedDays === 2) {
    emotion = "SAD"
  } else if (skippedDays === 1) {
    emotion = currentStreak >= 2 ? "PROUD" : "LONELY"
  } else if (currentStreak >= 2) {
    emotion = "PROUD"
  }

  return {
    emotion,
    lastTrainingAt,
    lastEmotionUpdatedAt: now.toISOString(),
    skippedDays,
  }
}

export function getRandomGorillaLine(emotion: GorillaEmotion) {
  const lines = GORILLA_LINES[emotion]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function getGorillaEmotionLabel(emotion: GorillaEmotion) {
  switch (emotion) {
    case "HAPPY":
      return "絶好調"
    case "PROUD":
      return "誇らしい"
    case "NORMAL":
      return "通常"
    case "LONELY":
      return "さみしい"
    case "SAD":
      return "しょんぼり"
    case "ANGRY":
      return "激怒"
  }
}

export function getStoredGorillaEmotionState(): GorillaEmotionState {
  if (typeof window === "undefined") {
    return resolveGorillaEmotion(null, 0)
  }

  const stored = window.localStorage.getItem(GORILLA_EMOTION_STORAGE_KEY)
  if (!stored) {
    return resolveGorillaEmotion(null, 0)
  }

  try {
    const parsed = JSON.parse(stored) as Partial<GorillaEmotionState>
    return {
      emotion: parsed.emotion ?? "ANGRY",
      lastTrainingAt: typeof parsed.lastTrainingAt === "string" ? parsed.lastTrainingAt : null,
      lastEmotionUpdatedAt: typeof parsed.lastEmotionUpdatedAt === "string" ? parsed.lastEmotionUpdatedAt : new Date().toISOString(),
      skippedDays: typeof parsed.skippedDays === "number" ? parsed.skippedDays : getSkippedDays(typeof parsed.lastTrainingAt === "string" ? parsed.lastTrainingAt : null),
    }
  } catch {
    return resolveGorillaEmotion(null, 0)
  }
}

export function persistGorillaEmotionState(state: GorillaEmotionState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(GORILLA_EMOTION_STORAGE_KEY, JSON.stringify(state))
}