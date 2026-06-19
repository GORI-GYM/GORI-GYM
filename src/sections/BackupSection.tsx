import { useRef } from "react"
import { useTranslation } from "react-i18next"

const BACKUP_FILE_VERSION = 1
const BACKUP_FILE_PREFIX = "gym-quest-backup"
const STORAGE_KEY_PREFIXES = ["gym-quest", "gym-quest:"]

interface BackupPayload {
  version: number
  exportedAt: string
  app: string
  keys: Record<string, string>
}

interface BackupSectionProps {
  onImportComplete?: () => void
}

function getBackupStorageEntries() {
  if (typeof window === "undefined") {
    return {}
  }

  const entries: Record<string, string> = {}

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key || !STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      continue
    }

    const value = window.localStorage.getItem(key)
    if (value !== null) {
      entries[key] = value
    }
  }

  return entries
}

function buildBackupFileName() {
  const now = new Date()
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("")

  return `${BACKUP_FILE_PREFIX}-${timestamp}.json`
}

function downloadBackupFile(payload: BackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = buildBackupFileName()
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function isBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<BackupPayload>
  return (
    candidate.version === BACKUP_FILE_VERSION
    && typeof candidate.exportedAt === "string"
    && typeof candidate.app === "string"
    && !!candidate.keys
    && typeof candidate.keys === "object"
    && !Array.isArray(candidate.keys)
  )
}

export default function BackupSection({ onImportComplete }: BackupSectionProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleExport = () => {
    const keys = getBackupStorageEntries()
    const payload: BackupPayload = {
      version: BACKUP_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      app: "gym-quest",
      keys,
    }

    downloadBackupFile(payload)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    const shouldOverwrite = window.confirm(t("character.backup.confirmMessage"))
    if (!shouldOverwrite) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown

      if (!isBackupPayload(parsed) || parsed.app !== "gym-quest") {
        window.alert(t("character.backup.invalidFile"))
        return
      }

      Object.entries(parsed.keys).forEach(([key, value]) => {
        if (STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          window.localStorage.setItem(key, value)
        }
      })

      onImportComplete?.()
      window.alert(t("character.backup.importSuccess"))
    } catch {
      window.alert(t("character.backup.importFailed"))
    }
  }

  return (
    <section className="px-4 pt-5 pb-8">
      <div className="rounded-[28px] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(255,249,232,0.98)_0%,rgba(255,255,255,0.96)_48%,rgba(255,242,204,0.98)_100%)] p-5 shadow-[0_18px_40px_rgba(245,166,35,0.14)] dark:border-[#F5A623]/20 dark:bg-[linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(10,10,10,0.98)_100%)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B7791F] dark:text-[#F8D27A]">
              {t("character.backup.eyebrow")}
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              {t("character.backup.title")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("character.backup.description")}
            </p>
          </div>
          <div className="rounded-2xl border border-[#F5A623]/30 bg-[#0A0A0A] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F8D27A] dark:bg-[#F5A623] dark:text-[#111111]">
            JSON
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center rounded-2xl border border-[#F5A623]/40 bg-[#111111] px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(10,10,10,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1A1A1A] dark:border-[#F5A623]/50"
          >
            📥 {t("character.backup.export")}
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center justify-center rounded-2xl border border-[#F5A623]/40 bg-[#F5A623] px-4 py-4 text-sm font-semibold text-[#111111] shadow-[0_12px_24px_rgba(245,166,35,0.22)] transition hover:-translate-y-0.5 hover:bg-[#FFB83D]"
          >
            📤 {t("character.backup.import")}
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {t("character.backup.warning")}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
        />
      </div>
    </section>
  )
}