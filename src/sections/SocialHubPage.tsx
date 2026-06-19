import { useState } from "react"
import { motion } from "framer-motion"
import ProfilePage from "@/sections/ProfilePage"
import SocialPage from "@/sections/SocialPage"
import GuildPage from "@/sections/GuildPage"
import GorillaBattleSection from "@/sections/GorillaBattleSection"
import type { UserProfile } from "@/utils/firestoreSync"
import { appShellClassName, cardClassName, mutedTextClassName } from "@/components/ui"

type SocialSection = "friends" | "guild" | "battle"
type FriendSection = "profile" | "social"

interface SocialHubPageProps {
  profile: UserProfile
  onProfileChange: (profile: UserProfile) => void
  socialBadgeCount?: number
}

export default function SocialHubPage({ profile, onProfileChange, socialBadgeCount = 0 }: SocialHubPageProps) {
  const [activeSection, setActiveSection] = useState<SocialSection>("friends")
  const [activeFriendSection, setActiveFriendSection] = useState<FriendSection>("social")

  return (
    <div className={`${appShellClassName} px-4 py-6`}>
      <motion.section
        className={cardClassName}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">SOCIAL</div>
            <h1 className="mt-2 text-2xl font-black text-white">フレンド・ギルド・対決</h1>
            <p className={`mt-2 leading-6 ${mutedTextClassName}`}>
              フレンド交流、ギルド連携、そしてゴリラ対決まで、このタブでまとめて管理できます。
            </p>
          </div>
          {socialBadgeCount > 0 ? (
            <div className="rounded-[12px] border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#FFE7B0]">通知</div>
              <div className="mt-1 text-2xl font-black text-[#F5A623]">{socialBadgeCount > 99 ? "99+" : socialBadgeCount}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex rounded-[12px] border border-[#2a2a2a] bg-[#111111] p-1">
          <SectionButton
            active={activeSection === "friends"}
            label="フレンド"
            badge={socialBadgeCount}
            onClick={() => setActiveSection("friends")}
          />
          <SectionButton
            active={activeSection === "guild"}
            label="ギルド"
            onClick={() => setActiveSection("guild")}
          />
          <SectionButton
            active={activeSection === "battle"}
            label="対決"
            badge={socialBadgeCount}
            onClick={() => setActiveSection("battle")}
          />
        </div>

        {activeSection === "friends" ? (
          <div className="mt-4 flex rounded-[12px] border border-[#2a2a2a] bg-[#111111] p-1">
            <SectionButton
              active={activeFriendSection === "social"}
              label="フレンド一覧"
              compact
              onClick={() => setActiveFriendSection("social")}
            />
            <SectionButton
              active={activeFriendSection === "profile"}
              label="プロフィール"
              compact
              onClick={() => setActiveFriendSection("profile")}
            />
          </div>
        ) : null}
      </motion.section>

      <div className="mt-6">
        {activeSection === "guild" ? (
          <GuildPage profile={profile} />
        ) : activeSection === "battle" ? (
          <GorillaBattleSection profile={profile} />
        ) : activeFriendSection === "profile" ? (
          <ProfilePage profile={profile} onProfileChange={onProfileChange} />
        ) : (
          <SocialPage profile={profile} />
        )}
      </div>
    </div>
  )
}

interface SectionButtonProps {
  active: boolean
  label: string
  onClick: () => void
  badge?: number
  compact?: boolean
}

function SectionButton({ active, label, onClick, badge, compact = false }: SectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex-1 rounded-[8px] px-4 font-black transition",
        compact ? "py-2 text-sm" : "py-3 text-sm",
        active
          ? "bg-[#F5A623] text-[#0a0a0a]"
          : "text-[#888888] hover:bg-[#1a1a1a] hover:text-white",
      ].join(" ")}
    >
      {label}
      {badge && badge > 0 ? (
        <span className={`absolute ${compact ? "-right-1 -top-1" : "right-2 top-2"} flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#0a0a0a]`}>
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  )
}