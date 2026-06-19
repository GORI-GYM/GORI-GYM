import { useState } from "react"
import { motion } from "framer-motion"
import ProfilePage from "@/sections/ProfilePage"
import SocialPage from "@/sections/SocialPage"
import GuildPage from "@/sections/GuildPage"
import GorillaBattleSection from "@/sections/GorillaBattleSection"
import type { UserProfile } from "@/utils/firestoreSync"

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
    <div className="min-h-full bg-[#0a0a0a] px-4 py-6 text-white">
      <motion.section
        className="rounded-[30px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(255,255,255,0.04))] p-5 shadow-[0_20px_48px_rgba(245,166,35,0.14)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]">SOCIAL</div>
            <h1 className="mt-2 text-2xl font-black text-white">フレンド・ギルド・対決</h1>
            <p className="mt-2 text-sm leading-6 text-white/70">
              フレンド交流、ギルド連携、そしてゴリラ対決まで、このタブでまとめて管理できます。
            </p>
          </div>
          {socialBadgeCount > 0 ? (
            <div className="rounded-2xl border border-[#F5A623]/30 bg-[#F5A623]/12 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#FFE7B0]">通知</div>
              <div className="mt-1 text-2xl font-black text-[#F5A623]">{socialBadgeCount > 99 ? "99+" : socialBadgeCount}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex rounded-[22px] border border-[#F5A623]/20 bg-black/25 p-1">
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
          <div className="mt-4 flex rounded-[20px] border border-[#F5A623]/15 bg-black/20 p-1">
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

      <div className="mt-5">
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
        "relative flex-1 rounded-[18px] px-4 font-black transition",
        compact ? "py-2 text-sm" : "py-3 text-sm",
        active
          ? "bg-[#F5A623] text-[#0a0a0a] shadow-[0_10px_24px_rgba(245,166,35,0.22)]"
          : "text-[#FFE7B0] hover:bg-white/5",
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