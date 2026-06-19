# Task: Replace Quests with My Routine

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c for all file reads and commands.

## Overview
Remove QUESTS tab entirely. Replace with MY ROUTINE (マイルーティーン) tab.
Users can build their own training routines (e.g. "Chest + Triceps Day" with all exercises pre-set).

## Files to Change
- src/sections/BottomNav.tsx — change "quests" tab to "routine", change icon
- src/App.tsx — remove QuestsPage/QuestDetail imports, add RoutinePage, update routing
- DELETE or overwrite: src/sections/QuestsPage.tsx, src/sections/QuestDetail.tsx
- CREATE: src/sections/RoutinePage.tsx
- src/locales/en.ts, ja.ts — remove quests keys, add routine keys

## RoutinePage Features

### 1. Routine List (main view)
- Show registered routines as cards
- Each card: routine name, target body part tags, exercise count, estimated time
- "+ CREATE ROUTINE" button at bottom

### 2. Preset Routines (pre-populated sample data):

a. Chest + Triceps Day (胸＋三頭筋の日):
   - Bench Press (ベンチプレス) 4 sets
   - Incline Dumbbell Press (インクラインダンベルプレス) 3 sets
   - Dumbbell Fly (ダンベルフライ) 3 sets
   - Triceps Extension (トライセプスエクステンション) 3 sets
   - Dips (ディップス) 3 sets

b. Back + Biceps Day (背中＋二頭筋の日):
   - Deadlift (デッドリフト) 3 sets
   - Lat Pulldown (ラットプルダウン) 3 sets
   - Bent Over Row (ベントオーバーロウ) 3 sets
   - Barbell Curl (アームカール) 3 sets
   - Hammer Curl (ハンマーカール) 3 sets

c. Leg Day (脚の日):
   - Squat (スクワット) 4 sets
   - Leg Press (レッグプレス) 3 sets
   - Leg Curl (レッグカール) 3 sets
   - Leg Extension (レッグエクステンション) 3 sets
   - Calf Raise (カーフレイズ) 3 sets

d. Shoulder + Core Day (肩＋体幹の日):
   - Overhead Press (オーバーヘッドプレス) 4 sets
   - Side Raise (サイドレイズ) 3 sets
   - Front Raise (フロントレイズ) 3 sets
   - Plank (プランク) 3 sets
   - Crunch (クランチ) 3 sets

### 3. Routine Detail/Edit (tap a card)
- Edit routine name
- Select target body parts (multi-select: chest/back/shoulders/arms/legs/core)
- Exercise list: exercise name + sets + target weight(kg) + target reps
- Add/delete/reorder exercises
- Save button

### 4. Create Routine
- Routine name input
- Body part selection (multi)
- Add exercises: pick from exercise list (same as TrainingPage) -> set count, target weight, target reps
- Save adds to routine list

### 5. Start from Routine
- Each routine card has a "START" button
- For now, just navigate to Training tab (setActiveTab('training'))

## i18n Keys to Add

### English (en.ts):
nav.routine: "ROUTINE"
routine.title: "MY ROUTINE"
routine.createNew: "CREATE ROUTINE"
routine.editRoutine: "EDIT ROUTINE"
routine.routineName: "Routine Name"
routine.targetParts: "Target Parts"
routine.exercises: "Exercises"
routine.sets: "sets"
routine.targetWeight: "Target Weight"
routine.targetReps: "Target Reps"
routine.addExercise: "Add Exercise"
routine.save: "SAVE"
routine.delete: "DELETE"
routine.start: "START"
routine.estimatedTime: "Est. Time"
routine.min: "min"
routine.chestTriceps: "Chest + Triceps Day"
routine.backBiceps: "Back + Biceps Day"
routine.legDay: "Leg Day"
routine.shoulderCore: "Shoulder + Core Day"

### Japanese (ja.ts):
nav.routine: "ルーティーン"
routine.title: "マイルーティーン"
routine.createNew: "ルーティーン作成"
routine.editRoutine: "ルーティーン編集"
routine.routineName: "ルーティーン名"
routine.targetParts: "対象部位"
routine.exercises: "種目"
routine.sets: "セット"
routine.targetWeight: "目標重量"
routine.targetReps: "目標回数"
routine.addExercise: "種目を追加"
routine.save: "保存"
routine.delete: "削除"
routine.start: "開始"
routine.estimatedTime: "推定時間"
routine.min: "分"
routine.chestTriceps: "胸＋三頭筋の日"
routine.backBiceps: "背中＋二頭筋の日"
routine.legDay: "脚の日"
routine.shoulderCore: "肩＋体幹の日"

Remove all quests.* and nav.quests keys.

## Style
Pixel Quest design: pixel-border, parchment bg #F5E6C8, ink #2D1B0E, gold #FFB800, framer-motion animations.

## Build
After all changes:
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
