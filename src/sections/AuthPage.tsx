import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

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

  return "認証に失敗しました。入力内容をご確認ください。"
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
    () => (mode === "signin" ? "GORUアカウントにログイン" : "GORUアカウントを作成"),
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
    <section className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 pb-28 pt-5">
      <div className="overflow-hidden rounded-[2rem] border border-[#F5A623]/30 bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(255,255,255,0.96))] p-6 shadow-[0_24px_60px_rgba(245,166,35,0.18)] dark:bg-[linear-gradient(180deg,rgba(245,166,35,0.18),rgba(10,10,10,0.96))]">
        <div className="mb-5">
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#B77900]">
            Firebase Auth
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#0a0a0a] dark:text-white">
            {heading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#4A4A4A] dark:text-[#D6D6D6]">
            ログインは任意です。未ログインでも現在のオフラインモードのままトレーニング記録を続けられます。
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={submitting || loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#F5A623]/40 bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_32px_rgba(10,10,10,0.28)] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0a0a0a]">G</span>
          Googleでログイン
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#F5A623]/30" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6A1F] dark:text-[#E8C56A]">
            またはメールで続行
          </span>
          <div className="h-px flex-1 bg-[#F5A623]/30" />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#FFF7E8] p-1 dark:bg-[#171717]">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-[1rem] px-4 py-2 text-sm font-bold transition ${mode === "signin" ? "bg-[#F5A623] text-[#0a0a0a] shadow-[0_10px_24px_rgba(245,166,35,0.28)]" : "text-[#6A6A6A] dark:text-[#CFCFCF]"}`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-[1rem] px-4 py-2 text-sm font-bold transition ${mode === "signup" ? "bg-[#F5A623] text-[#0a0a0a] shadow-[0_10px_24px_rgba(245,166,35,0.28)]" : "text-[#6A6A6A] dark:text-[#CFCFCF]"}`}
          >
            新規登録
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleEmailAuth}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2A2A2A] dark:text-[#F5F5F5]">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-[#F5A623]/30 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none ring-0 placeholder:text-[#9A9A9A] focus:border-[#F5A623] dark:bg-[#111111] dark:text-white"
              placeholder="goru@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2A2A2A] dark:text-[#F5F5F5]">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-[#F5A623]/30 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none ring-0 placeholder:text-[#9A9A9A] focus:border-[#F5A623] dark:bg-[#111111] dark:text-white"
              placeholder="6文字以上"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-[#FF8A8A]/40 bg-[#FFF1F1] px-4 py-3 text-sm font-medium text-[#B42318] dark:bg-[#2A1111] dark:text-[#FFB4B4]">
              {errorMessage}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-[#F5A623]/40 bg-[#FFF8E7] px-4 py-3 text-sm font-medium text-[#8A5A00] dark:bg-[#2A2110] dark:text-[#FFD27A]">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || loading || !!user}
            className="w-full rounded-2xl bg-[#F5A623] px-4 py-3 text-sm font-black text-[#0a0a0a] shadow-[0_18px_36px_rgba(245,166,35,0.28)] transition hover:bg-[#ffb53d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "signin" ? "メールでログイン" : "メールで新規登録"}
          </button>
        </form>
      </div>
    </section>
  )
}