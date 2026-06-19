// TopBar 窶・GORU GYM header with menu and quest log icons
import { IconMenu, IconNote } from "@/icons"
import { useTranslation } from "react-i18next"

interface TopBarProps {
  onMenuClick?: () => void
  theme: "light" | "dark"
  onThemeToggle: () => void
  authActionLabel: string
  onAuthAction: () => void
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path d="M12 2V5M12 19V22M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M2 12H5M19 12H22M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export default function TopBar({ onMenuClick, theme, onThemeToggle, authActionLabel, onAuthAction }: TopBarProps) {
  const { t, i18n } = useTranslation()
  const nextLanguage = i18n.language === "ja" ? "en" : "ja"
  const isDark = theme === "dark"

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgba(17,17,17,0.12)] bg-[rgba(255,255,255,0.94)] px-4 py-3 shadow-[0_12px_32px_rgba(255,212,0,0.12)] backdrop-blur transition-colors duration-200 dark:border-[var(--color-dark-border)] dark:bg-[rgba(11,11,11,0.94)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
    >
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white text-[var(--color-ink)] shadow-[0_10px_24px_rgba(17,17,17,0.08)] transition-colors duration-200 hover:bg-[var(--color-accent-soft)] active:scale-[0.98] dark:border-[rgba(255,212,0,0.28)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)] dark:hover:bg-[#232323]"
        aria-label={t("common.menu")}
      >
        <IconMenu className="w-5 h-5" />
      </button>

      <div className="flex flex-1 flex-col items-center px-3 text-center">
        <div className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold-dark)]">
          Fitness RPG
        </div>
        <h1 className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--color-fg)] dark:text-[var(--color-dark-text)]">
          {t("common.appName")}
        </h1>
        <p className="text-xs font-medium tracking-[0.08em] text-[#5B5B5B] dark:text-[#D4D4D4]">
          {t("common.tagline")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAuthAction}
          className="rounded-2xl border border-[#F5A623]/35 bg-[#FFF8E7] px-3 py-2 text-[0.68rem] font-black tracking-[0.14em] text-[#8A5A00] shadow-[0_10px_24px_rgba(245,166,35,0.16)] transition hover:bg-[#F5A623] hover:text-[#0a0a0a] dark:bg-[#171717] dark:text-[#FFD27A] dark:hover:bg-[#F5A623] dark:hover:text-[#0a0a0a]"
        >
          {authActionLabel}
        </button>
        <button
          type="button"
          onClick={onThemeToggle}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white text-[var(--color-fg)] shadow-[0_10px_24px_rgba(17,17,17,0.08)] transition-colors duration-200 hover:bg-[var(--color-accent-soft)] active:scale-[0.98] dark:border-[rgba(255,212,0,0.28)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)] dark:hover:bg-[#232323]"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon className="h-5 w-5 text-[var(--color-gold)]" /> : <MoonIcon className="h-5 w-5 text-[var(--color-ink)]" />}
        </button>
        <button
          type="button"
          onClick={() => void i18n.changeLanguage(nextLanguage)}
          className="flex h-11 min-w-[3rem] items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white px-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-fg)] shadow-[0_10px_24px_rgba(17,17,17,0.08)] transition-colors duration-200 hover:bg-[var(--color-accent-soft)] active:scale-[0.98] dark:border-[rgba(255,212,0,0.28)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)] dark:hover:bg-[#232323]"
          aria-label={t("common.language")}
        >
          {i18n.language === "ja" ? t("common.en") : t("common.jp")}
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.18)] bg-[var(--color-gold)] text-[var(--color-ink)] shadow-[0_14px_28px_rgba(255,212,0,0.28)] transition-colors duration-200 hover:bg-[var(--color-accent-strong)] active:scale-[0.98]"
          aria-label={t("common.questLog")}
        >
          <IconNote className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

