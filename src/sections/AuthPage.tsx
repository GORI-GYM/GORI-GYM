import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { appShellClassName, cardClassName, inputClassName, primaryButtonClassName, secondaryButtonClassName, sectionTitleClassName, mutedTextClassName } from "@/components/ui"

type AuthMode = "signin" | "signup"

function getFirebaseErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "認証に失敗しました。時間をおいて再度お試しください。"
  }

  if (error.message.includes("auth/invalid-credential")) {
    return "メールアドレスまたはパスワードが正しくありません。"
  }

  if (error.message.includes("auth/email-already-in-use")) {
    return "このメールアドレスは既に登録されています。"
  }

  if (error.message.includes("auth/weak-password")) {
    return "パスワードは6文字以上で入力してください。"
  }

  if (error.message.includes("auth/popup-closed-by-user")) {
    return "Googleログインがキャンセルされました。"
  }

  return "認証に失敗しました。もう一度お試しください。"
}

export default function AuthPage() {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, user, loading } = useAuth()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const heading = useMemo(
    () => (mode === "signin" ? "GORUアカウントにログイン" : "GORUアカウントを新規作成"),
    [mode],
  )

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password)
        setMessage("ログインしました。")
      } else {
        await signUpWithEmail(email, password)
        setMessage("アカウントを作成しました。")
      }
    } catch (error) {
      setErrorMessage(getFirebaseErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleAuth = async () => {
    setSubmitting(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      await signInWithGoogle()
      setMessage("Googleでログインしました。")
    } catch (error) {
      setErrorMessage(getFirebaseErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className={`mx-auto flex w-full max-w-[430px] flex-col gap-6 px-4 pb-28 pt-5 ${appShellClassName}`}>
      <div className={cardClassName}>
        <div className="mb-5">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#F5A623]">
            Firebase Auth
          </div>
          <h2 className={`mt-2 text-2xl tracking-[-0.03em] ${sectionTitleClassName}`}>
            {heading}
          </h2>
          <p className={`mt-2 leading-6 ${mutedTextClassName}`}>
            ログインすると、トレーニング記録やソーシャル機能を安全に同期できます。
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={submitting || loading}
          className={`flex w-full items-center justify-center gap-3 ${secondaryButtonClassName}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0a0a0a]">G</span>
          Googleでログイン
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#2a2a2a]" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#888888]">
            またはメールで続行
          </span>
          <div className="h-px flex-1 bg-[#2a2a2a]" />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-[12px] border border-[#2a2a2a] bg-[#111111] p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-[8px] px-4 py-2 text-sm font-bold transition ${mode === "signin" ? "bg-[#F5A623] text-[#0a0a0a]" : "text-[#888888]"}`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-[8px] px-4 py-2 text-sm font-bold transition ${mode === "signup" ? "bg-[#F5A623] text-[#0a0a0a]" : "text-[#888888]"}`}
          >
            新規登録
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={inputClassName}
              placeholder="goru@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className={inputClassName}
              placeholder="6文字以上"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-[12px] border border-[#7a2a2a] bg-[#1a1111] px-4 py-3 text-sm font-medium text-[#ffb4b4]">
              {errorMessage}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[12px] border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-sm font-medium text-[#cccccc]">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || loading || !!user}
            className={`w-full ${primaryButtonClassName}`}
          >
            {mode === "signin" ? "メールでログイン" : "メールで新規登録"}
          </button>
        </form>
      </div>
    </section>
  )
}