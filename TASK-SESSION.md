# Task: Training Page - Routine Selection & Exercise Management

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Overview
TrainingPageで、ルーティーンを選択してその日のトレーニングを開始できるようにする。
選択したルーティーンの種目をベースに、不要な種目の削除や追加種目の追加ができるようにする。

## Flow

### 1. トレーニング開始フロー
- TrainingPageのカレンダー下に「今日のトレーニングを開始」ボタンを表示（まだ今日のトレーニングが無い場合）
- ボタンタップ → ルーティーン選択モーダルが開く
- RoutinePageで定義済みのルーティーン一覧を表示（胸+三頭筋の日、背中+二頭筋の日、脚の日、肩の日）
- ルーティーン選択 → そのルーティーンの種目が今日のトレーニングとしてセットされる

### 2. 今日のトレーニングセッション画面
ルーティーン選択後、カレンダーの下に今日のセッションを表示:
- 上部: 選択したルーティーン名を表示（例: "胸＋三頭筋の日"）
- 種目リスト: ルーティーンの各種目がカード形式で並ぶ
  - 各カードに: 種目名、セット数 × 目標重量kg × 目標回数
  - 各カードに「×」ボタン → その種目を今日のセッションから削除（ルーティーン自体は変更しない）
  - 各セットに実際の重量と回数を入力できるフィールド

### 3. 種目追加
- 種目リストの下に「＋ 種目を追加」ボタン
- タップ → 種目選択モーダル（既存のTrainingPageの種目追加と同じUI）
- 追加した種目もセッションに含まれる

### 4. セッション完了
- 「トレーニング完了」ボタン
- 完了すると今日の日付にトレーニング記録として保存（カレンダーにマーカーが付く）
- セッション画面が記録表示に切り替わる

## Technical Notes
- RoutinePageのプリセットデータをTrainingPageからも参照できるようにする
  - 共通のデータ/型をRoutinePage.tsxから export するか、共有ファイルに切り出す
- セッション状態はuseStateで管理（永続化は不要、サンプルレベル）
- 既存のサンプルトレーニングデータとの共存を維持

## i18n Keys to Add (en.ts / ja.ts)
- training.startToday: "Start Today's Training" / "今日のトレーニングを開始"
- training.selectRoutine: "Select Routine" / "ルーティーンを選択"
- training.currentSession: "Today's Session" / "今日のセッション"
- training.removeExercise: "Remove" / "削除"
- training.finishTraining: "Finish Training" / "トレーニング完了"
- training.addMore: "Add Exercise" / "種目を追加"
- training.actualWeight: "Actual" / "実績"
- training.noTrainingYet: "No training recorded yet" / "まだトレーニングの記録がありません"

## Style
Pixel Quest design maintained. pixel-border, parchment, gold, ink colors, framer-motion.

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
