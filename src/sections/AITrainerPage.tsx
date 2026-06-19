import type { MonthlyCharacterProgressSummary } from "@/utils/monthlyCharacterProgress"
import type { TrainingEntry } from "@/sections/TrainingPage"
import { analyzeAiTrainer } from "@/utils/aiTrainer"
import type { GorillaEmotion } from "@/utils/gorillaEmotion"
import type { WeeklyProgressSummary } from "@/utils/weeklyProgress"

interface AITrainerPageProps {
  entries: TrainingEntry[]
  weeklyProgress: WeeklyProgressSummary
  monthlyCharacterProgress: MonthlyCharacterProgressSummary
  gorillaEmotion: GorillaEmotion
  onBackHome?: () => void
}

function getToneClassName(tone: "praise" | "improve" | "warning") {
  switch (tone) {
    case "praise":
      return "border-[#F5A623]/40 bg-[#FFF7D6] text-[#5C3B00] dark:bg-[#1A1406] dark:text-[#FFE7A3]"
    case "warning":
      return "border-[#F5A623]/40 bg-[#1A1A1A] text-[#FFE082] dark:bg-[#120F08] dark:text-[#FFD27A]"
    default:
      return "border-[#F5A623]/30 bg-white text-[#1A1A1A] dark:bg-[#171717] dark:text-white"
  }
}

export default function AITrainerPage({
  entries,
  weeklyProgress,
  monthlyCharacterProgress,
  gorillaEmotion,
  onBackHome,
}: AITrainerPageProps) {
  const analysis = analyzeAiTrainer(entries, weeklyProgress, monthlyCharacterProgress, gorillaEmotion)

  if (!analysis.hasEnoughData) {
    return (
      <section className="px-5 py-6">
        <button
          type="button"
          onClick={onBackHome}
          className="mb-4 border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2"
        >
          HOMEへ戻る
        </button>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-white">
          <div className="flex items-start gap-4">
            <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 flex h-16 w-16 items-center justify-center text-3xl">
              🦍
            </div>
            <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
              <div className="text-[#888] text-sm">GORILLA AI TRAINER</div>
              <p className="mt-2 text-white font-bold text-lg">
                まだデータが足りない。もう少しトレーニングを続けたらアドバイスできるぞ！
              </p>
              <p className="mt-3 text-[#ccc]">
                今は{analysis.totalSessions}回分の記録を確認した。まずは5回以上のセッションを積み上げてくれ。
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[#0a0a0a] space-y-6 px-5 py-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackHome}
          className="border border-[#F5A623] text-[#F5A623] rounded-lg px-4 py-2"
        >
          HOMEへ戻る
        </button>
        <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2">
          AI TRAINER
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-[#F5A623] text-black font-bold rounded-lg px-4 py-2 flex h-16 w-16 items-center justify-center text-3xl">
            🦍
          </div>
          <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
            <div className="text-[#888] text-sm">GORILLA AI TRAINER</div>
            <p className="mt-2 text-white font-bold text-lg">{analysis.greeting}</p>
            <p className="mt-3 text-[#ccc]">{analysis.gradeComment}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-[#F5A623]/25 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-[#171717]">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900]">総合評価</div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-6xl font-black leading-none text-[#0a0a0a] dark:text-white">{analysis.grade}</div>
            <div className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-black text-[#0a0a0a]">
              週間達成率 {analysis.frequency.achievementRate}%
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold leading-7 text-[#333333] dark:text-[#E5E7EB]">{analysis.gradeComment}</p>
        </div>

        <div className={`rounded-[1.75rem] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${getToneClassName(analysis.frequency.insight.tone)}`}>
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900] dark:text-[#FFD27A]">今週の振り返り</div>
          <p className="mt-3 text-lg font-black">
            {analysis.frequency.completed} / {analysis.frequency.goal} 回
          </p>
          <p className="mt-3 text-sm font-semibold leading-7">{analysis.frequency.insight.message}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[#F5A623]/25 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-[#171717]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900]">部位バランス</div>
            <h3 className="mt-1 text-lg font-black text-[#0a0a0a] dark:text-white">過去1ヶ月の配分</h3>
          </div>
          <div className="rounded-full bg-[#FFF4CC] px-3 py-2 text-xs font-bold text-[#8A5A00] dark:bg-[#0f0f0f] dark:text-[#FFD27A]">
            弱点: {analysis.bodyPartBalance.weakestBodyPart ? analysis.bodyPartBalance.items.find((item) => item.bodyPart === analysis.bodyPartBalance.weakestBodyPart)?.label : "-"}
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {analysis.bodyPartBalance.items.map((item) => (
            <div key={item.bodyPart}>
              <div className="mb-2 flex items-center justify-between text-sm font-bold text-[#1A1A1A] dark:text-[#F8FAFC]">
                <span>{item.label}</span>
                <span>{item.count}回 / {item.percentage}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6] dark:bg-[#0f0f0f]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#F5A623,#FFE082)]"
                  style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-5 rounded-[1.5rem] border p-4 ${getToneClassName(analysis.bodyPartBalance.insight.tone)}`}>
          <p className="text-sm font-semibold leading-7">{analysis.bodyPartBalance.insight.message}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-[#F5A623]/25 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-[#171717]">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900]">重量推移</div>
          <div className="mt-4 space-y-3">
            {analysis.weightTrends.items.map((item) => (
              <div key={item.exerciseName} className="rounded-[1.25rem] border border-[#F5A623]/20 bg-[#FFFBEA] p-4 dark:bg-[#111111]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-[#0a0a0a] dark:text-white">{item.exerciseName}</div>
                  <div className={`rounded-full px-3 py-1 text-xs font-black ${item.improving ? "bg-[#F5A623] text-[#0a0a0a]" : item.stagnant ? "bg-[#0a0a0a] text-[#FFD27A]" : "bg-[#E5E7EB] text-[#374151]"}`}>
                    {item.delta > 0 ? `+${item.delta}kg` : item.delta < 0 ? `${item.delta}kg` : "維持"}
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#4B5563] dark:text-[#D1D5DB]">{item.message}</p>
              </div>
            ))}
          </div>
          <div className={`mt-4 rounded-[1.5rem] border p-4 ${getToneClassName(analysis.weightTrends.insight.tone)}`}>
            <p className="text-sm font-semibold leading-7">{analysis.weightTrends.insight.message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-[1.75rem] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${getToneClassName(analysis.recovery.insight.tone)}`}>
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900] dark:text-[#FFD27A]">休息分析</div>
            <p className="mt-3 text-sm font-semibold leading-7">{analysis.recovery.insight.message}</p>
          </div>

          <div className="rounded-[1.75rem] border border-[#F5A623]/25 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-[#171717]">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#B77900]">次回おすすめメニュー</div>
            <div className="mt-4 space-y-3">
              {analysis.recommendations.map((item, index) => (
                <div key={`${item.exerciseName}-${index}`} className="rounded-[1.25rem] border border-[#F5A623]/20 bg-[linear-gradient(135deg,#FFFBEA,#FFF4CC)] p-4 dark:bg-[linear-gradient(135deg,#111111,#171717)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-[#0a0a0a] dark:text-white">{item.exerciseName}</div>
                    <div className="rounded-full bg-[#F5A623] px-3 py-1 text-xs font-black text-[#0a0a0a]">{item.difficulty}</div>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#4B5563] dark:text-[#D1D5DB]">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}