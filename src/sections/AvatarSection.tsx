import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getCharacterGrowthImage, type CharacterId } from "@/assets/characters"
import gymBackground from "@/assets/gym-background.png"
import { getGorillaEmotionLabel, getRandomGorillaLine, type GorillaEmotion } from "@/utils/gorillaEmotion"

interface AvatarSectionProps {
  level: number
  characterName: string
  selectedCharacter: CharacterId
  monthlyCharacterLevel: number
  gorillaEmotion: GorillaEmotion
  skippedDays: number
  weight: number
  height: number
  gender?: "male" | "female" | "unspecified"
  xp: number
  nextLevelXp: number
  onSaveProfile: React.Dispatch<React.SetStateAction<{ weight: number; height: number; gender: "male" | "female" | "unspecified" }>>
}

export default function AvatarSection({
  level,
  characterName: _characterName,
  selectedCharacter,
  monthlyCharacterLevel,
  gorillaEmotion,
  skippedDays,
  weight,
  height,
  gender,
  xp,
  nextLevelXp,
  onSaveProfile,
}: AvatarSectionProps) {
  const { t } = useTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [draftWeight, setDraftWeight] = useState(String(weight))
  const [draftHeight, setDraftHeight] = useState(String(height))
  const [gorillaLine, setGorillaLine] = useState(() => getRandomGorillaLine(gorillaEmotion))
  const characterImage = useMemo(() => getCharacterGrowthImage(selectedCharacter, monthlyCharacterLevel), [selectedCharacter, monthlyCharacterLevel])

  useEffect(() => {
    setGorillaLine(getRandomGorillaLine(gorillaEmotion))
  }, [gorillaEmotion])

  const gorillaVisualClassName = useMemo(() => {
    switch (gorillaEmotion) {
      case "HAPPY":
      case "PROUD":
        return "scale-[1.06] drop-shadow-[0_0_28px_rgba(245,166,35,0.72)]"
      case "LONELY":
        return "scale-95 brightness-75 saturate-75"
      case "SAD":
        return "scale-90 grayscale-[0.45] brightness-60 saturate-50"
      case "ANGRY":
        return "animate-[gorilla-shake_0.28s_ease-in-out_infinite] scale-[0.98] hue-rotate-[-18deg] saturate-150 brightness-90"
      default:
        return ""
    }
  }, [gorillaEmotion])

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
      gender: gender ?? "unspecified",
    })
    setIsEditOpen(false)
  }

  return (
    <section
      className="relative overflow-hidden bg-[#0a0a0a] space-y-6 px-5 pb-6 pt-5"
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
            <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 flex h-11 w-11 items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2L19 5V11C19 15.418 16.105 19.216 12 20.5C7.895 19.216 5 15.418 5 11V5L12 2Z" fill="white" fillOpacity="0.18"/>
                <path d="M12 4.2L17 6.3V10.8C17 14.1 14.95 17.02 12 18.1C9.05 17.02 7 14.1 7 10.8V6.3L12 4.2Z" stroke="white" strokeWidth="1.6"/>
                <path d="M8.5 11.5H15.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 8V15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[#888] text-sm">
                {t("common.appName")}
              </div>
              <div className="text-[#ccc]">{t("home.heroSubtitle")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 relative flex h-11 w-11 items-center justify-center text-white"
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
              className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 flex h-11 w-11 items-center justify-center text-sm"
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
              className="absolute left-1/2 top-2 z-20 w-[min(210px,calc(100%-2rem))] -translate-x-1/2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-left md:left-auto md:right-2 md:top-0 md:w-[210px] md:translate-x-0"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
            >
              <div className="text-[#888] text-sm">
                Gorilla AI · {getGorillaEmotionLabel(gorillaEmotion)}
              </div>
              <p className="mt-1 text-[#ccc]">
                {gorillaLine}
              </p>
              <div className="mt-2 text-[#888] text-sm">
                {skippedDays === 0 ? "今日は会えてうれしそうだ" : `${skippedDays}日あいてる`}
              </div>
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[0.3rem] border-b border-r border-[#F5A623] bg-white md:left-auto md:right-8 md:translate-x-0 dark:border-[#F5A623]/40 dark:bg-[#171717]" />
            </motion.div>
            <img
              src={characterImage}
              alt=""
              className={`relative z-10 max-h-[156px] w-auto object-contain transition-all duration-500 drop-shadow-[0_18px_30px_rgba(245,166,35,0.22)] ${gorillaVisualClassName}`}
            />
          </div>

          <div className="relative bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
            <div className="text-[#888] text-sm">
              {t("common.levelShort")}
            </div>
            <div className="mt-1 text-white font-bold text-lg leading-none">
              {level}
            </div>
            <p className="mt-3 max-w-[14rem] text-[#ccc]">
              {t("home.heroMessage")}
            </p>
            <div className="mt-5 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
              <div className="mb-3 flex items-center justify-between text-[#888] text-sm">
                <span>{t("home.profileStats")}</span>
                <span>{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-white">
                <div>
                  <div className="text-[#888] text-sm">{t("home.weight")}</div>
                  <div className="mt-1 text-white font-bold text-lg">{weight}<span className="ml-1 text-[#888] text-sm">kg</span></div>
                </div>
                <div>
                  <div className="text-[#888] text-sm">{t("home.height")}</div>
                  <div className="mt-1 text-white font-bold text-lg">{height}<span className="ml-1 text-[#888] text-sm">cm</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {isEditOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6">
          <div
            className="w-full max-w-[280px] bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4"
            style={{
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="mb-3 text-white font-bold text-lg">{t("home.editProfile")}</div>
            <div className="space-y-3">
              <label className="block">
                <div className="mb-1 text-[#888] text-sm">{t("home.weight")}</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={draftWeight}
                  onChange={(event) => setDraftWeight(event.target.value)}
                  className="w-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#ccc] outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-[#888] text-sm">{t("home.height")}</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={draftHeight}
                  onChange={(event) => setDraftHeight(event.target.value)}
                  className="w-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-[#ccc] outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2"
              >
                {t("common.close")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2"
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