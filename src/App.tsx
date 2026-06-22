import { useMemo, useState } from "react"

type TabId = "home" | "plan" | "circle" | "profile"
type CheckInStatus = "done" | "planned" | "rest"

interface RoutineDay {
  day: string
  focus: string
  duration: string
  workout: string[]
}

interface CircleMember {
  id: number
  name: string
  status: CheckInStatus
  note: string
}

const routineDays: RoutineDay[] = [
  {
    day: "月曜",
    focus: "全身A",
    duration: "35分",
    workout: ["レッグプレス 3セット", "チェストプレス 3セット", "ラットプルダウン 3セット"],
  },
  {
    day: "水曜",
    focus: "全身B",
    duration: "35分",
    workout: ["ゴブレットスクワット 3セット", "ダンベルプレス 3セット", "シーテッドロー 3セット"],
  },
  {
    day: "土曜",
    focus: "全身C",
    duration: "30分",
    workout: ["ブルガリアンスクワット 2セット", "ショルダープレス 3セット", "プランク 2セット"],
  },
]

const circleMembers: CircleMember[] = [
  { id: 1, name: "Ami", status: "done", note: "出勤前に20分だけ完了" },
  { id: 2, name: "Kento", status: "planned", note: "夜にジム行く予定" },
  { id: 3, name: "Yui", status: "rest", note: "今日は休養日に変更" },
]

const statusLabel: Record<CheckInStatus, string> = {
  done: "完了",
  planned: "予定あり",
  rest: "休養日",
}

const statusStyle: Record<CheckInStatus, string> = {
  done: "bg-emerald-500/18 text-emerald-300 border-emerald-400/30",
  planned: "bg-sky-500/18 text-sky-300 border-sky-400/30",
  rest: "bg-white/8 text-white/72 border-white/10",
}

function getTodayIndex() {
  const day = new Date().getDay()
  if (day === 1) return 0
  if (day === 3) return 1
  if (day === 6) return 2
  return 0
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home")
  const [, setCompletedSets] = useState(0)
  const [checkIn, setCheckIn] = useState<CheckInStatus>("planned")

  const todayRoutine = routineDays[getTodayIndex()]
  const totalSets = todayRoutine.workout.length * 3
  const weeklyGoal = 3
  const completedWorkouts = checkIn === "done" ? 1 : 0

  const homeStats = useMemo(
    () => [
      { label: "今週の目標", value: `${completedWorkouts}/${weeklyGoal}回` },
      { label: "今日やること", value: `${todayRoutine.workout.length}種目 / ${todayRoutine.duration}` },
      { label: "仲間の完了", value: `${circleMembers.filter((member) => member.status === "done").length}/3人` },
    ],
    [completedWorkouts, todayRoutine.duration, todayRoutine.workout.length],
  )

  const completeWorkout = () => {
    setCompletedSets(totalSets)
    setCheckIn("done")
  }

  const renderHome = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="text-sm font-medium text-white/60">今日のルーティン</div>
        <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-white">{todayRoutine.focus}</h1>
        <p className="mt-2 text-sm leading-6 text-white/68">
          初心者向けに迷わず始められるよう、今日は {todayRoutine.duration} の全身メニューだけに絞っています。
        </p>
        <div className="mt-5 rounded-2xl bg-white/5 p-4">
          <div className="text-sm font-medium text-white/70">今日やること</div>
          <ul className="mt-3 space-y-2">
            {todayRoutine.workout.map((item) => (
              <li key={item} className="rounded-2xl bg-black/18 px-4 py-3 text-sm text-white/84">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className="flex-1 rounded-2xl bg-[#F5A623] px-4 py-4 text-base font-semibold text-[#111111]"
          >
            今日のメニューを見る
          </button>
          <button
            type="button"
            onClick={completeWorkout}
            className="flex-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-4 text-base font-semibold text-white"
          >
            今日は完了した
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {homeStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">{stat.label}</div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[24px] border border-white/8 bg-white/4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">仲間の状況</h2>
            <p className="mt-1 text-sm text-white/62">比較よりも、見守られている感覚を重視しています。</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("circle")}
            className="text-sm font-semibold text-[#F5A623]"
          >
            みる
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {circleMembers.map((member) => (
            <div key={member.id} className="rounded-2xl border border-white/8 bg-[#121212] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{member.name}</div>
                  <div className="mt-1 text-sm text-white/58">{member.note}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[member.status]}`}>
                  {statusLabel[member.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const renderPlan = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">今週のルーティン</h2>
        <p className="mt-2 text-sm leading-6 text-white/64">
          週3回・1回30〜35分で続ける前提です。難しい設定はなくして、来たらそのまま始められる形にしています。
        </p>
      </section>
      {routineDays.map((routine, index) => (
        <section
          key={routine.day}
          className={`rounded-[24px] border p-5 ${index === getTodayIndex() ? "border-[#F5A623]/40 bg-[#17130a]" : "border-white/8 bg-white/4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white/56">{routine.day}</div>
              <h3 className="mt-1 text-xl font-semibold text-white">{routine.focus}</h3>
            </div>
            <div className="rounded-full bg-white/8 px-3 py-1 text-sm text-white/72">{routine.duration}</div>
          </div>
          <ul className="mt-4 space-y-2">
            {routine.workout.map((item) => (
              <li key={item} className="rounded-2xl bg-black/18 px-4 py-3 text-sm text-white/84">
                {item}
              </li>
            ))}
          </ul>
          {index === getTodayIndex() ? (
            <button
              type="button"
              onClick={() => setCompletedSets((current) => Math.min(current + 3, totalSets))}
              className="mt-4 w-full rounded-2xl bg-[#F5A623] px-4 py-3 font-semibold text-[#111111]"
            >
              3セット完了を記録
            </button>
          ) : null}
        </section>
      ))}
    </div>
  )

  const renderCircle = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">小さな仲間グループ</h2>
        <p className="mt-2 text-sm leading-6 text-white/64">
          大きなSNSではなく、3〜6人で淡々と進捗を共有する形です。初心者でも置いていかれにくくなります。
        </p>
      </section>
      <section className="rounded-[24px] border border-white/8 bg-white/4 p-5">
        <div className="text-sm font-medium text-white/56">あなたのチェックイン</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["done", "planned", "rest"] as CheckInStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setCheckIn(status)}
              className={`rounded-2xl border px-4 py-4 text-left ${checkIn === status ? statusStyle[status] : "border-white/8 bg-[#121212] text-white/72"}`}
            >
              <div className="text-sm font-semibold">{statusLabel[status]}</div>
              <div className="mt-1 text-xs opacity-80">
                {status === "done" ? "終わったら仲間に自動共有" : status === "planned" ? "あとでやる意思表示" : "休んでも戻りやすくする"}
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        {circleMembers.map((member) => (
          <div key={member.id} className="rounded-[24px] border border-white/8 bg-[#121212] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">{member.name}</div>
                <div className="mt-2 text-sm leading-6 text-white/62">{member.note}</div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[member.status]}`}>
                {statusLabel[member.status]}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-full bg-white/8 px-4 py-2 text-sm text-white/78">
                いいね
              </button>
              <button type="button" className="rounded-full bg-white/8 px-4 py-2 text-sm text-white/78">
                応援する
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <div className="text-sm font-medium text-white/56">マイページ</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">続けやすさを整える</h2>
      </section>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
          <div className="text-sm text-white/56">目標</div>
          <div className="mt-2 text-xl font-semibold text-white">週3回ジムに行く</div>
          <div className="mt-3 text-sm text-white/64">ハードな目標ではなく、まずは生活に組み込める頻度を固定します。</div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
          <div className="text-sm text-white/56">次回の予定</div>
          <div className="mt-2 text-xl font-semibold text-white">水曜 19:30</div>
          <div className="mt-3 text-sm text-white/64">予約された予定がある方が、初心者は戻りやすくなります。</div>
        </div>
      </section>
      <section className="rounded-[24px] border border-white/8 bg-white/4 p-5">
        <div className="text-sm text-white/56">続けるための設計</div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-white/76">
          <li>・ ホームでは今日やることだけを見せる</li>
          <li>・ 記録は1回のジム時間内で完結する粒度にする</li>
          <li>・ 比較よりも小さな応援を優先する</li>
          <li>・ サボっても戻りやすい文言と導線を使う</li>
        </ul>
      </section>
    </div>
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: "home", label: "ホーム" },
    { id: "plan", label: "ルーティン" },
    { id: "circle", label: "仲間" },
    { id: "profile", label: "マイページ" },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pb-28 pt-6">
        <header className="mb-6">
          <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#F5A623]">GO TRAIN</div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-white">初心者が続けられるジム習慣</h1>
              <p className="mt-2 text-sm leading-6 text-white/62">
                やることを絞り、仲間と淡くつながりながら、週3回を無理なく続けるためのシンプル版です。
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1">
          {activeTab === "home" ? renderHome() : null}
          {activeTab === "plan" ? renderPlan() : null}
          {activeTab === "circle" ? renderCircle() : null}
          {activeTab === "profile" ? renderProfile() : null}
        </div>

        <nav className="sticky bottom-0 z-40 mt-6 border-t border-white/8 bg-[#0a0a0a]/96 px-2 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-[#F5A623] text-[#111111]" : "bg-white/5 text-white/62"}`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </main>
  )
}

export default App