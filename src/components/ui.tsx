import type { ReactNode } from "react"

export const appShellClassName = "min-h-full bg-[#0a0a0a] text-[#cccccc]"
export const sectionStackClassName = "space-y-6"
export const sectionTitleClassName = "text-white font-bold"
export const bodyTextClassName = "text-[#cccccc]"
export const mutedTextClassName = "text-sm text-[#888888]"
export const cardClassName = "rounded-[12px] border border-[#2a2a2a] bg-[#1a1a1a] p-4 shadow-none"
export const cardSoftClassName = "rounded-[12px] border border-[#2a2a2a] bg-[#111111] p-4 shadow-none"
export const primaryButtonClassName = "rounded-[8px] bg-[#F5A623] px-3 py-2 text-sm font-bold text-[#0a0a0a] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
export const secondaryButtonClassName = "rounded-[8px] border border-[#F5A623] bg-transparent px-3 py-2 text-sm font-bold text-[#F5A623] transition hover:bg-[#F5A623]/10 disabled:cursor-not-allowed disabled:opacity-60"
export const inputClassName = "w-full rounded-[8px] border border-[#2a2a2a] bg-[#111111] px-3 py-3 text-sm text-white outline-none placeholder:text-[#666666] focus:border-[#F5A623]"
export const chipClassName = "rounded-full border border-[#2a2a2a] bg-[#111111] px-2.5 py-1 text-[11px] font-semibold text-[#cccccc]"
export const badgeClassName = "rounded-full border border-[#2a2a2a] bg-[#111111] px-2 py-1 text-[10px] font-bold text-[#F5A623]"
export const pagePaddingClassName = "px-4 py-6"
export const panelTitleClassName = "text-xs font-semibold uppercase tracking-[0.24em] text-[#F5A623]"
export const metricValueClassName = "text-2xl font-black text-white"
export const listCardClassName = "rounded-[12px] border border-[#2a2a2a] bg-[#111111] p-4"

export function AppSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${cardClassName} ${className}`.trim()}>{children}</section>
}

export function GorillaSpeechBubble({
  icon,
  title,
  message,
  meta,
  className = "",
}: {
  icon?: ReactNode
  title?: string
  message: ReactNode
  meta?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`.trim()}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#111111] text-[#F5A623]">
        {icon ?? <span className="text-sm">🦍</span>}
      </div>
      <div className="relative flex-1 rounded-[12px] border border-[#2a2a2a] bg-[#1a1a1a] p-4">
        <span className="absolute left-[-6px] top-4 h-3 w-3 rotate-45 border-b border-l border-[#2a2a2a] bg-[#1a1a1a]" />
        {title ? <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5A623]">{title}</div> : null}
        <div className={title ? "mt-2 text-sm font-medium leading-6 text-white" : "text-sm font-medium leading-6 text-white"}>{message}</div>
        {meta ? <div className="mt-2 text-sm text-[#888888]">{meta}</div> : null}
      </div>
    </div>
  )
}