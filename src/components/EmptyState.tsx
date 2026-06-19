import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`rounded-[28px] border border-[#F5A623]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,249,232,0.98)_100%)] p-6 text-center shadow-[0_18px_40px_rgba(245,166,35,0.12)] dark:border-[#F5A623]/15 dark:bg-[#121212] ${className}`}>
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#F5A623]/30 bg-[radial-gradient(circle_at_top,#FFF1A8_0%,#F5A623_100%)] text-[#0A0A0A] shadow-[0_12px_30px_rgba(245,166,35,0.28)]">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black tracking-[0.02em] text-[#0A0A0A] dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-[#F5A623] px-5 py-3 text-sm font-bold text-[#0A0A0A] transition hover:brightness-105 dark:text-[#0A0A0A]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}