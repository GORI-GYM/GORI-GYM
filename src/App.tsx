import { useEffect, useMemo, useState } from "react"

const ROUTINES_STORAGE_KEY = "go-train:routines"
const LAST_RECORDS_STORAGE_KEY = "go-train:last-records"
const HISTORY_STORAGE_KEY = "go-train:history"

type TabId = "home" | "record" | "history" | "friends"
type CheckInStatus = "done" | "planned" | "rest"

interface RoutineExercise {
  name: string
  weight: string
  reps: string
  sets: number
}

interface RoutineDay {
  id: string
  label: string
  focus: string
  exercises: RoutineExercise[]
}

interface SetRecord {
  weight: string
  reps: string
}

interface ExerciseRecord {
  name: string
  sets: SetRecord[]
  done: boolean
}

interface HistoryEntry {
  id: number
  savedAt: string
  routineLabel: string
  exercises: ExerciseRecord[]
}

interface Friend {
  id: number
  name: string
  status: CheckInStatus
  routineLabel: string
}

const statusLabel: Record<CheckInStatus, string> = {
  done: "完了",
  planned: "あとでやる",
  rest: "休み",
}

const statusStyle: Record<CheckInStatus, string> = {
  done: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  planned: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  rest: "border-violet-400/25 bg-violet-500/12 text-violet-200",
}

const initialRoutines: RoutineDay[] = [
  {
    id: "a",
    label: "月曜",
    focus: "全身A",
    exercises: [
      { name: "レッグプレス", weight: "40", reps: "10", sets: 3 },
      { name: "チェストプレス", weight: "25", reps: "10", sets: 3 },
      { name: "ラットプルダウン", weight: "25", reps: "10", sets: 3 },
    ],
  },
  {
    id: "b",
    label: "水曜",
    focus: "全身B",
    exercises: [
      { name: "ゴブレットスクワット", weight: "12", reps: "10", sets: 3 },
      { name: "ダンベルプレス", weight: "10", reps: "10", sets: 3 },
      { name: "シーテッドロー", weight: "25", reps: "10", sets: 3 },
    ],
  },
  {
    id: "c",
    label: "土曜",
    focus: "全身C",
    exercises: [
      { name: "ブルガリアンスクワット", weight: "10", reps: "10", sets: 3 },
      { name: "ショルダープレス", weight: "8", reps: "10", sets: 3 },
      { name: "プランク", weight: "-", reps: "30秒", sets: 2 },
    ],
  },
]

const initialFriends: Friend[] = [
  { id: 1, name: "Ami", status: "done", routineLabel: "全身A" },
  { id: 2, name: "Kento", status: "planned", routineLabel: "全身B" },
  { id: 3, name: "Yui", status: "rest", routineLabel: "全身C" },
]

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getTodayRoutineIndex() {
  const day = new Date().getDay()
  if (day === 1) return 0
  if (day === 3) return 1
  if (day === 6) return 2
  return 0
}

function buildRecordsFromRoutine(routine: RoutineDay, previous?: ExerciseRecord[]) {
  return routine.exercises.map((exercise, exerciseIndex) => {
    const previousExercise = previous?.[exerciseIndex]
    return {
      name: exercise.name,
      done: false,
      sets: Array.from({ length: previousExercise?.sets.length ?? exercise.sets }, (_, setIndex) => {
        const previousSet = previousExercise?.sets[setIndex]
        return previousSet ?? { weight: exercise.weight, reps: exercise.reps }
      }),
    }
  })
}

function formatDateLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home")
  const [routines] = useState<RoutineDay[]>(() => loadJson(ROUTINES_STORAGE_KEY, initialRoutines))
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadJson(HISTORY_STORAGE_KEY, []))
  const [lastRecords, setLastRecords] = useState<Record<string, ExerciseRecord[]>>(() =>
    loadJson<Record<string, ExerciseRecord[]>>(LAST_RECORDS_STORAGE_KEY, {}),
  )
  const [friends] = useState<Friend[]>(initialFriends)
  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[getTodayRoutineIndex()]?.id ?? routines[0].id)
  const [recordsByRoutine, setRecordsByRoutine] = useState<Record<string, ExerciseRecord[]>>(() =>
    Object.fromEntries(
      routines.map((routine) => [
        routine.id,
        buildRecordsFromRoutine(
          routine,
          loadJson<Record<string, ExerciseRecord[]>>(LAST_RECORDS_STORAGE_KEY, {})[routine.id],
        ),
      ]),
    ),
  )
  const [saveMessage, setSaveMessage] = useState("")

  const selectedRoutine = routines.find((routine) => routine.id === selectedRoutineId) ?? routines[0]
  const todayRecords = recordsByRoutine[selectedRoutine.id] ?? buildRecordsFromRoutine(selectedRoutine, lastRecords[selectedRoutine.id])
  const completedCount = todayRecords.filter((record) => record.done).length

  useEffect(() => {
    saveJson(ROUTINES_STORAGE_KEY, routines)
  }, [routines])

  useEffect(() => {
    saveJson(HISTORY_STORAGE_KEY, history)
  }, [history])

  useEffect(() => {
    saveJson(LAST_RECORDS_STORAGE_KEY, lastRecords)
  }, [lastRecords])

  useEffect(() => {
    if (!saveMessage) return
    const timer = window.setTimeout(() => setSaveMessage(""), 2400)
    return () => window.clearTimeout(timer)
  }, [saveMessage])

  const groupedHistory = useMemo(
    () =>
      history.reduce<Record<string, HistoryEntry[]>>((groups, entry) => {
        const key = formatDateLabel(entry.savedAt)
        if (!groups[key]) groups[key] = []
        groups[key].push(entry)
        return groups
      }, {}),
    [history],
  )

  const startRoutine = (routineId: string) => {
    const routine = routines.find((item) => item.id === routineId)
    if (!routine) return
    setSelectedRoutineId(routineId)
    setRecordsByRoutine((current) => ({
      ...current,
      [routineId]: buildRecordsFromRoutine(routine, lastRecords[routineId]),
    }))
    setActiveTab("record")
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetRecord, value: string) => {
    setRecordsByRoutine((current) => ({
      ...current,
      [selectedRoutine.id]: (current[selectedRoutine.id] ?? todayRecords).map((record, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex
          ? {
              ...record,
              sets: record.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : record,
      ),
    }))
  }

  const updateDone = (exerciseIndex: number) => {
    setRecordsByRoutine((current) => ({
      ...current,
      [selectedRoutine.id]: (current[selectedRoutine.id] ?? todayRecords).map((record, currentExerciseIndex) =>
        currentExerciseIndex === exerciseIndex ? { ...record, done: !record.done } : record,
      ),
    }))
  }

  const saveWorkout = () => {
    const nextLastRecords = {
      ...lastRecords,
      [selectedRoutine.id]: todayRecords.map((record) => ({
        ...record,
        done: false,
        sets: record.sets.map((set) => ({ ...set })),
      })),
    }

    setLastRecords(nextLastRecords)
    setHistory((current) => [
      {
        id: Date.now(),
        savedAt: new Date().toISOString(),
        routineLabel: `${selectedRoutine.label} / ${selectedRoutine.focus}`,
        exercises: todayRecords.map((record) => ({
          ...record,
          sets: record.sets.map((set) => ({ ...set })),
        })),
        routineIndex: routines.findIndex((routine) => routine.id === selectedRoutine.id),
      },
      ...current,
    ])
    setSaveMessage("保存しました")
  }

  const renderHome = () => (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-white/10 bg-[#111111] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
        <div className="text-sm font-medium uppercase tracking-[0.24em] text-[#F5A623]">今日やること</div>
        <h1 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-white">{selectedRoutine.focus}</h1>
        <div className="mt-2 text-sm text-white/56">
          {selectedRoutine.label} / {selectedRoutine.exercises.length}種目だけやればOK
        </div>

        <div className="mt-5 rounded-[24px] bg-white/5 p-4">
          <div className="text-xs tracking-[0.16em] text-white/42">前回の続き</div>
          <div className="mt-2 text-base font-semibold text-white">
            {lastRecords[selectedRoutine.id]?.[0]?.sets[0]
              ? `${lastRecords[selectedRoutine.id][0].name} ${lastRecords[selectedRoutine.id][0].sets[0].weight}kg / ${lastRecords[selectedRoutine.id][0].sets[0].reps}回`
              : "前回記録はまだありません"}
          </div>
          <div className="mt-4 space-y-2">
            {selectedRoutine.exercises.map((exercise) => (
              <div key={exercise.name} className="rounded-2xl bg-black/18 px-4 py-3 text-sm text-white/84">
                {exercise.name}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => startRoutine(selectedRoutine.id)}
          className="mt-5 w-full rounded-[22px] bg-[#F5A623] px-4 py-4 text-base font-semibold text-[#111111]"
        >
          記録を始める
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
          <div className="text-xs tracking-[0.16em] text-white/42">今週</div>
          <div className="mt-2 text-lg font-semibold text-white">{history.length}回記録</div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
          <div className="text-xs tracking-[0.16em] text-white/42">仲間</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {friends.filter((friend) => friend.status === "done").length}/{friends.length}人完了
          </div>
        </div>
      </section>
    </div>
  )

  const renderRecord = () => (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/56">今日の記録</div>
            <div className="mt-1 text-xl font-semibold text-white">
              {selectedRoutine.label} / {selectedRoutine.focus}
            </div>
          </div>
          <select
            value={selectedRoutine.id}
            onChange={(event) => startRoutine(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none"
          >
            {routines.map((routine) => (
              <option key={routine.id} value={routine.id} className="bg-[#111111] text-white">
                {routine.label} / {routine.focus}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/72">
          {completedCount}/{todayRecords.length}種目 完了
        </div>
      </section>

      {todayRecords.map((record, exerciseIndex) => (
        <section key={`${record.name}-${exerciseIndex}`} className="rounded-[26px] border border-white/8 bg-white/4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.16em] text-white/42">種目</div>
              <h2 className="mt-1 text-xl font-semibold text-white">{record.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => updateDone(exerciseIndex)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${record.done ? "bg-[#F5A623] text-[#111111]" : "bg-white/8 text-white/72"}`}
            >
              {record.done ? "完了" : "完了にする"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {record.sets.map((set, setIndex) => (
              <div key={`${record.name}-${setIndex}`} className="rounded-[22px] bg-[#121212] p-4">
                <div className="text-sm font-semibold text-white">セット {setIndex + 1}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="text-xs text-white/42">重量</div>
                    <input
                      value={set.weight}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)}
                      className="mt-2 w-full bg-transparent text-lg font-semibold text-white outline-none"
                    />
                  </label>
                  <label className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="text-xs text-white/42">回数</div>
                    <input
                      value={set.reps}
                      onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                      className="mt-2 w-full bg-transparent text-lg font-semibold text-white outline-none"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-[24px] border border-[#F5A623]/20 bg-[#17130a] p-5">
        <div className="text-sm text-[#F5A623]">最後に保存</div>
        <div className="mt-2 text-xl font-semibold text-white">今日の記録を保存する</div>
        <button
          type="button"
          onClick={saveWorkout}
          className="mt-4 w-full rounded-[20px] bg-[#F5A623] px-4 py-4 text-base font-semibold text-[#111111]"
        >
          保存する
        </button>
        {saveMessage ? <div className="mt-3 text-sm text-[#F7D28B]">{saveMessage}</div> : null}
      </section>
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <div className="text-sm text-white/56">過去の記録</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">見返す</h2>
      </section>

      {Object.keys(groupedHistory).length === 0 ? (
        <section className="rounded-[24px] border border-white/8 bg-white/4 p-5 text-sm text-white/58">
          まだ記録がありません。
        </section>
      ) : (
        Object.entries(groupedHistory).map(([dateLabel, entries]) => (
          <section key={dateLabel} className="space-y-3">
            <div className="px-1 text-sm font-semibold tracking-[0.08em] text-[#F5A623]">{dateLabel}</div>
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-white/8 bg-[#121212] p-5">
                <div className="text-lg font-semibold text-white">{entry.routineLabel}</div>
                <div className="mt-1 text-sm text-white/52">{new Date(entry.savedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="mt-4 space-y-3">
                  {entry.exercises.map((exercise) => (
                    <div key={`${entry.id}-${exercise.name}`} className="rounded-2xl bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{exercise.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={`${entry.id}-${exercise.name}-${setIndex}`} className="rounded-full bg-black/20 px-3 py-1.5 text-xs text-white/78">
                            {setIndex + 1}セット目 {set.weight}
                            {set.weight !== "-" ? "kg" : ""} / {set.reps}
                            {set.reps.includes("秒") ? "" : "回"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )

  const renderFriends = () => (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] p-5">
        <div className="text-sm text-white/56">仲間</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">ゆるく続ける</h2>
      </section>

      <section className="space-y-3">
        {friends.map((friend) => (
          <div key={friend.id} className="rounded-[24px] border border-white/8 bg-[#121212] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">{friend.name}</div>
                <div className="mt-2 text-sm text-white/58">今日のルーティン: {friend.routineLabel}</div>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[friend.status]}`}>
                {statusLabel[friend.status]}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: "home", label: "ホーム" },
    { id: "record", label: "記録" },
    { id: "history", label: "履歴" },
    { id: "friends", label: "仲間" },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pb-28 pt-6">
        <header className="mb-6">
          <div className="text-sm font-medium uppercase tracking-[0.28em] text-[#F5A623]">GO TRAIN</div>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-white">初心者が続けられるジム習慣</h1>
        </header>

        <div className="flex-1">
          {activeTab === "home" ? renderHome() : null}
          {activeTab === "record" ? renderRecord() : null}
          {activeTab === "history" ? renderHistory() : null}
          {activeTab === "friends" ? renderFriends() : null}
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
                  className={`flex-1 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-[#F5A623] text-[#111111]" : "bg-white/5 text-white/62"
                  }`}
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