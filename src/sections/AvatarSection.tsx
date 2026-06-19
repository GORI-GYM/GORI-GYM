import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getCharacterGrowthImage, type CharacterId } from "@/assets/characters"
import gymBackground from "@/assets/gym-background.png"

interface AvatarSectionProps {
  level: number
  characterName: string
  selectedCharacter: CharacterId
  monthlyCharacterLevel: number
  todayTrainingStatus: "praise" | "taunt"
  weight: number
  height: number
  xp: number
  nextLevelXp: number
  onSaveProfile: (profile: { weight: number; height: number }) => void
}

const GORILLA_PRAISE_LINES = [
  "ナイスワーク！",
  "今日も追い込んだな！",
  "その調子だ！",
  "いい記録だ、胸を張れ！",
  "積み上げが効いてるぞ！",
  "ゴリラも拍手だ！",
] as const

const GORILLA_TAUNT_LINES = [
  "今日はまだ記録がないぞ？",
  "サボりか？",
  "ジム行こうぜ！",
  "その腕、飾りじゃないだろ？",
  "今日の1セット、まだ待ってるぞ！",
  "ゴリラより先に動け！",
] as const

function getRandomLine(lines: readonly string[]) {
  return lines[Math.floor(Math.random() * lines.length)]
}

export default function AvatarSection({
  level,
  characterName: _characterName,
  selectedCharacter,
  monthlyCharacterLevel,
  todayTrainingStatus,
  weight,
  height,
  xp,
  nextLevelXp,
  onSaveProfile,
}: AvatarSectionProps) {
  const { t } = useTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [draftWeight, setDraftWeight] = useState(String(weight))
  const [draftHeight, setDraftHeight] = useState(String(height))
  const [gorillaLine, setGorillaLine] = useState(() =>
    getRandomLine(todayTrainingStatus === "praise" ? GORILLA_PRAISE_LINES : GORILLA_TAUNT_LINES),
  )
  const characterImage = useMemo(() => getCharacterGrowthImage(selectedCharacter, monthlyCharacterLevel), [selectedCharacter, monthlyCharacterLevel])

  useEffect(() => {
    setGorillaLine(getRandomLine(todayTrainingStatus === "praise" ? GORILLA_PRAISE_LINES : GORILLA_TAUNT_LINES))
  }, [todayTrainingStatus])

  const openEditModal = () => {
    setDraftWeight(String(weight))
    setDraftHeight(String(height))
    setIsEditOpen(true)
  }

  const handleSave = () => {
    const nextWeight = Number(draftWeight)
    const nextHeight = Number(draftHeight)

    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextHeight)) {
      return
    }

    onSaveProfile({
      weight: Math.max(0, Math.round(nextWeight)),
      height: Math.max(0, Math.round(nextHeight)),
    })
    setIsEditOpen(false)
  }

  return (
    <section
      className="relative overflow-hidden rounded-b-[2rem] bg-[#FFFBEA] px-5 pb-6 pt-5 transition-colors duration-200 dark:bg-[#0B0B0B]"
      style={{
        minHeight: "320px",
      }}
      aria-label={t("home.characterAria")}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(245,166,35,0.18), transparent 34%), radial-gradient(circle at top right, rgba(255,215,64,0.22), transparent 28%), linear-gradient(180deg, #fffdf5 0%, #fff4d6 100%)",
        }}
      />
      <motion.div
        className="relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5A623] shadow-[0_14px_30px_rgba(245,166,35,0.28)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2L19 5V11C19 15.418 16.105 19.216 12 20.5C7.895 19.216 5 15.418 5 11V5L12 2Z" fill="white" fillOpacity="0.18"/>
                <path d="M12 4.2L17 6.3V10.8C17 14.1 14.95 17.02 12 18.1C9.05 17.02 7 14.1 7 10.8V6.3L12 4.2Z" stroke="white" strokeWidth="1.6"/>
                <path d="M8.5 11.5H15.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 8V15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#F5A623]">
                {t("common.appName")}
              </div>
              <div className="text-sm font-medium text-[#3A3A3A] dark:text-[#CBD5E1]">{t("home.heroSubtitle")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111111] shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:bg-[#171717] dark:text-[#F8FAFC]"
              aria-label={t("home.notifications")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 4C9.791 4 8 5.791 8 8V9.2C8 10.18 7.682 11.133 7.094 11.917L6 13.375V15H18V13.375L16.906 11.917C16.318 11.133 16 10.18 16 9.2V8C16 5.791 14.209 4 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M10 18C10.458 18.611 11.187 19 12 19C12.813 19 13.542 18.611 14 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#F5A623] ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={openEditModal}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F5A623,#FFE066)] text-sm font-bold text-[#111111] shadow-[0_12px_24px_rgba(245,166,35,0.22)]"
              aria-label={t("home.editProfile")}
            >
              {level}
            </button>
          </div>
        </div>

        <div className="grid items-end gap-2 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex min-h-[220px] items-end justify-center overflow-hidden rounded-[2rem] bg-transparent px-2 pt-14 md:pt-4">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${gymBackground})` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.42)_0%,rgba(17,17,17,0.68)_100%)]"
              aria-hidden="true"
            />
            <motion.div
              className="absolute left-1/2 top-2 z-20 w-[min(210px,calc(100%-2rem))] -translate-x-1/2 rounded-[1.25rem] border border-[#F5A623] bg-white px-3 py-2 text-left shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:left-auto md:right-2 md:top-0 md:w-[210px] md:translate-x-0 dark:border-[#F5A623]/40 dark:bg-[#171717]"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
            >
              <div className="text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-[#F5A623]">
                Gorilla AI
              </div>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-[#111111] dark:text-[#F8FAFC]">
                {gorillaLine}
              </p>
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[0.3rem] border-b border-r border-[#F5A623] bg-white md:left-auto md:right-8 md:translate-x-0 dark:border-[#F5A623]/40 dark:bg-[#171717]" />
            </motion.div>
            <img
              src={characterImage}
              alt=""
              className="relative z-10 max-h-[156px] w-auto object-contain drop-shadow-[0_18px_30px_rgba(245,166,35,0.22)]"
            />
          </div>

          <div className="relative rounded-[2rem] bg-white/88 p-5 shadow-[0_24px_48px_rgba(0,0,0,0.12)] backdrop-blur dark:bg-[#171717]">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5A623]">
              {t("common.levelShort")}
            </div>
            <div className="mt-1 text-5xl font-black leading-none tracking-[-0.04em] text-[#111111] dark:text-[#F8FAFC]">
              {level}
            </div>
            <p className="mt-3 max-w-[14rem] text-sm font-semibold uppercase tracking-[0.18em] text-[#334155] dark:text-[#CBD5E1]">
              {t("home.heroMessage")}
            </p>
            <div className="mt-5 rounded-[1.5rem] bg-[#FFF8D6] p-4 dark:bg-[#111111]">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b] dark:text-[#CBD5E1]">
                <span>{t("home.profileStats")}</span>
                <span>{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[#111111] dark:text-[#F8FAFC]">
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.weight")}</div>
                  <div className="mt-1 text-lg font-bold">{weight}<span className="ml-1 text-sm text-[#64748b] dark:text-[#CBD5E1]">kg</span></div>
                </div>
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#64748b] dark:text-[#CBD5E1]">{t("home.height")}</div>
                  <div className="mt-1 text-lg font-bold">{height}<span className="ml-1 text-sm text-[#64748b] dark:text-[#CBD5E1]">cm</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {isEditOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6">
          <div
            className="w-full max-w-[280px] rounded-[1.75rem] bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.24)]"
            style={{
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#F5A623]">{t("home.editProfile")}</div>
            <div className="space-y-3">
              <label className="block">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{t("home.weight")}</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={draftWeight}
                  onChange={(event) => setDraftWeight(event.target.value)}
                  className="w-full rounded-2xl border border-[#FDE7B0] bg-[#FFFBEA] px-3 py-3 text-sm font-semibold text-[#111111] outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{t("home.height")}</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={draftHeight}
                  onChange={(event) => setDraftHeight(event.target.value)}
                  className="w-full rounded-2xl border border-[#FDE7B0] bg-[#FFFBEA] px-3 py-3 text-sm font-semibold text-[#111111] outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-full bg-[#e2e8f0] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#334155]"
              >
                {t("common.close")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-[#F5A623] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_24px_rgba(245,166,35,0.28)]"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}