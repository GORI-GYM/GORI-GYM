# HOME タブ改善: メインCTA + 今日の進捗サマリー

## 改善1: メインCTAボタン

アバター・XPバーの下（WorkoutLogの上）に大型CTAボタンを配置する。

- テキスト: 「今日のトレーニングを始める」(ja) / "Start Today's Training" (en)
- 今日既にトレーニング済みの場合: 「トレーニングを追加する」/ "Add More Training"
- スタイル: ゴールド(#FFB800)背景、インク(#2D1B0E)テキスト、角丸、パディング大きめ、font-weight bold
- タップ時: setActiveTab('routine') を呼んでROUTINEタブに遷移

## 改善2: 今日の進捗サマリー

CTAボタンの直下に今日の進捗を表示する小さなカード。

- 表示内容: 本日の種目数、セット数、総ボリューム(kg)
- historyから今日の日付(YYYY-MM-DD)のレコードを集計して計算
- 未実施の場合: 「今日はまだトレーニングしていません」/ "No training yet today"
- スタイル: 既存カード(WorkoutLog等)と同じ羊皮紙スタイル

## 対象ファイル

- `src/App.tsx` — historyをHOMEセクションに渡す(propsまたは既に渡されているか確認)
- `src/sections/AvatarSection.tsx` または新コンポーネント — CTA+進捗表示を追加
- `src/sections/WorkoutLog.tsx` — 既存カードとの整合確認
- `src/locales/ja.ts` / `src/locales/en.ts` — 翻訳キー追加

## 注意

- 既存のStreakCard、StatusPanel、WorkoutLogは残す。CTAが上位にあればOK
- Pixel Questスタイル（羊皮紙 #F5E6C8、インク #2D1B0E、ゴールド #FFB800）

## 検証

ビルドコマンド:
```
cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
```
ビルド成功・型エラーなしを確認すること。
