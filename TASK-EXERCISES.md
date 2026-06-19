# Task: Expand Exercise Database by Body Part

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Overview
Expand the exercise list significantly and organize by body part. Update routineData.ts (shared exercise catalog) and ensure TrainingPage and RoutinePage both use the expanded list.

## New Exercise List by Body Part

### CHEST (胸) - 10 exercises
1. Bench Press / ベンチプレス
2. Incline Bench Press / インクラインベンチプレス
3. Decline Bench Press / デクラインベンチプレス
4. Dumbbell Press / ダンベルプレス
5. Incline Dumbbell Press / インクラインダンベルプレス
6. Dumbbell Fly / ダンベルフライ
7. Cable Crossover / ケーブルクロスオーバー
8. Chest Press Machine / チェストプレスマシン
9. Pec Deck / ペックデック
10. Dips (Chest) / ディップス(胸)

### BACK (背中) - 10 exercises
1. Deadlift / デッドリフト
2. Lat Pulldown / ラットプルダウン
3. Bent Over Row / ベントオーバーロウ
4. Chin Up / チンニング(懸垂)
5. Seated Row / シーテッドロウ
6. T-Bar Row / Tバーロウ
7. One Arm Dumbbell Row / ワンハンドダンベルロウ
8. Cable Row / ケーブルロウ
9. Pull Up / プルアップ
10. Back Extension / バックエクステンション

### SHOULDERS (肩) - 10 exercises
1. Overhead Press / オーバーヘッドプレス
2. Dumbbell Shoulder Press / ダンベルショルダープレス
3. Side Raise / サイドレイズ
4. Front Raise / フロントレイズ
5. Rear Delt Fly / リアデルトフライ
6. Arnold Press / アーノルドプレス
7. Upright Row / アップライトロウ
8. Face Pull / フェイスプル
9. Cable Side Raise / ケーブルサイドレイズ
10. Shrug / シュラッグ

### BICEPS (二頭筋) - 8 exercises
1. Barbell Curl / バーベルカール
2. Dumbbell Curl / ダンベルカール
3. Hammer Curl / ハンマーカール
4. Incline Dumbbell Curl / インクラインダンベルカール
5. Concentration Curl / コンセントレーションカール
6. Cable Curl / ケーブルカール
7. Preacher Curl / プリーチャーカール
8. EZ Bar Curl / EZバーカール

### TRICEPS (三頭筋) - 8 exercises
1. Triceps Pushdown / トライセプスプッシュダウン
2. Triceps Extension / トライセプスエクステンション
3. Skull Crusher / スカルクラッシャー
4. Close Grip Bench Press / ナローベンチプレス
5. Overhead Triceps Extension / オーバーヘッドトライセプスエクステンション
6. Dips (Triceps) / ディップス(三頭筋)
7. Kickback / キックバック
8. Cable Overhead Extension / ケーブルオーバーヘッドエクステンション

### LEGS (脚) - 12 exercises
1. Squat / スクワット
2. Front Squat / フロントスクワット
3. Leg Press / レッグプレス
4. Leg Curl / レッグカール
5. Leg Extension / レッグエクステンション
6. Romanian Deadlift / ルーマニアンデッドリフト
7. Bulgarian Split Squat / ブルガリアンスクワット
8. Hip Thrust / ヒップスラスト
9. Calf Raise / カーフレイズ
10. Hack Squat / ハックスクワット
11. Goblet Squat / ゴブレットスクワット
12. Lunges / ランジ

## Implementation

### 1. Update src/sections/routineData.ts
- Replace the exerciseOptions object with the expanded list above
- Each body part key maps to an array of exercise objects: { id: string, en: string, ja: string }
- Export a type for Exercise

### 2. Update src/sections/TrainingPage.tsx
- Update exercise suggestions/selection to use the new expanded list from routineData
- When showing exercise selection modal, group exercises by body part with body part headers
- Make the exercise list scrollable within the modal

### 3. Update src/sections/RoutinePage.tsx
- Exercise selection in routine editor should also use the expanded grouped list
- Show body part headers in exercise picker

### 4. Update src/locales/en.ts and ja.ts
- Add all new exercise names as suggestion keys under training.suggestions.*
- Keep consistent key naming (camelCase)

## Style
Pixel Quest design. In exercise selection modals, show body part headers in gold with exercises listed below each.

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
