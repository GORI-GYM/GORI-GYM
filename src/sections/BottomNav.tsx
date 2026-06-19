// BottomNav 窶・RPG-style bottom navigation bar
import { IconCastle, IconBag, IconBook, IconHelmet, IconTrophy, IconUsers } from "@/icons"
import { useTranslation } from "react-i18next"

type NavTab = "home" | "routine" | "training" | "character" | "social" | "ranking" | "achievements" | "auth"

interface BottomNavProps {
  activeTab?: NavTab
  onTabChange?: (tab: NavTab) => void
  socialBadgeCount?: number
}

export default function BottomNav({ activeTab = "home", onTabChange, socialBadgeCount = 0 }: BottomNavProps) {
  const { t } = useTranslation()
  const tabs: { id: NavTab; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <IconCastle className="w-7 h-7" />, label: t("nav.home") },
    { id: "routine", icon: <IconBag className="w-6 h-6" />, label: t("nav.routine") },
    { id: "training", icon: <IconBook className="w-6 h-6" />, label: t("nav.training") },
    { id: "character", icon: <IconHelmet className="w-6 h-6" />, label: t("nav.character") },
    { id: "social", icon: <IconUsers className="w-6 h-6" />, label: "SOCIAL" },
    { id: "ranking", icon: <IconTrophy className="w-6 h-6" />, label: "RANKING" },
    { id: "achievements", icon: <IconTrophy className="w-6 h-6" />, label: t("nav.achievements") },
  ]
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-[430px] items-stretch border-t border-[rgba(17,17,17,0.12)] bg-white shadow-[0_-8px_24px_rgba(17,17,17,0.08)] transition-colors duration-200 dark:border-[var(--color-dark-border)] dark:bg-[var(--color-dark-bg)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
      aria-label={t("nav.mainNavigation")}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={[
              "flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-100",
              "min-h-[60px] touch-manipulation",
              isActive
                ? "border-t-2 border-[var(--color-gold)] bg-[var(--color-accent-soft)] text-[var(--color-ink)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-gold)]"
                : "border-t-2 border-transparent text-[#7A7A7A] hover:bg-[#FFFBEA] hover:text-[var(--color-fg)] dark:text-[#A3A3A3] dark:hover:bg-[var(--color-dark-surface)] dark:hover:text-[var(--color-dark-text)]",
            ].join(" ")}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={`relative ${isActive ? "text-[var(--color-gold-dark)] dark:text-[var(--color-gold)]" : "text-[#7A7A7A] dark:text-[#A3A3A3]"}`}>
              {tab.icon}
              {tab.id === "social" && socialBadgeCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#F5A623] px-1 text-[10px] font-black text-[#0a0a0a]">
                  {socialBadgeCount > 9 ? "9+" : socialBadgeCount}
                </span>
              ) : null}
            </span>
            <span
              className={[
                "text-[10px] font-semibold leading-none",
                isActive ? "text-[var(--color-gold-dark)] dark:text-[var(--color-gold)]" : "text-[#7A7A7A] dark:text-[#A3A3A3]",
              ].join(" ")}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

