You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4. Uses react-i18next for i18n (ja/en).

For all node commands:
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && ..."

TASK: Replace the INVENTORY tab with a TRAINING (トレーニング) tab.
Remove the inventory feature entirely and replace it with a training log that records exercises by body part.

Step 1: Read existing files to understand patterns:
- src/sections/InventoryPage.tsx (to be replaced)
- src/sections/BottomNav.tsx (tab labels/icons)
- src/sections/WorkoutPage.tsx (exercise recording pattern)
- src/sections/CharacterPage.tsx (body part data pattern)
- src/App.tsx (routing)
- src/locales/en.ts and src/locales/ja.ts (translations)
- src/icons/index.tsx (icons)
- src/index.css (theme)

Step 2: Delete src/sections/InventoryPage.tsx (or overwrite it completely)

Step 3: Create src/sections/TrainingPage.tsx
This is a training log screen where users can see and record workouts by body part.

A. TRAINING HEADER
   - Title: "TRAINING LOG" / "トレーニング記録"
   - Summary stats: total sessions, total weight lifted, favorite body part

B. BODY PART SELECTOR (horizontal scroll tabs)
   - ALL, CHEST (胸), BACK (背中), ARMS (腕), LEGS (脚), SHOULDERS (肩), CORE (体幹)
   - Pixel-style tab buttons, active = gold bg

C. TRAINING HISTORY LIST (filtered by selected body part)
   - Each entry is a card showing one exercise:
     - Date (e.g. "6/15" or "今日")
     - Exercise name (e.g. "ベンチプレス", "Bench Press")
     - Body part tag (colored badge)
     - Sets detail: list of "SET 1: 80kg × 10回", "SET 2: 80kg × 8回" etc.
     - Total volume for this exercise (weight × reps × sets)
   - Entries sorted by date (newest first)
   - Use pixel-border cards, parchment styling

D. ADD TRAINING BUTTON (floating or fixed at bottom)
   - "＋ トレーニングを追加" / "+ ADD TRAINING"
   - Gold pixel-border button

E. ADD TRAINING FORM (shown when add button tapped, inline or overlay)
   - Exercise name input (with suggestions: Bench Press/ベンチプレス, Squat/スクワット, Deadlift/デッドリフト, Overhead Press/オーバーヘッドプレス, Barbell Row/バーベルロウ, Pull Up/懸垂, Bicep Curl/アームカール, Leg Press/レッグプレス, Lat Pulldown/ラットプルダウン, Lateral Raise/サイドレイズ, Plank/プランク, Crunch/クランチ)
   - Body part selector (single select: CHEST/BACK/ARMS/LEGS/SHOULDERS/CORE)
   - Add sets: weight (kg) input + reps (回) input + "ADD SET" button
   - Sets list showing added sets
   - "SAVE" button to add to log
   - "CANCEL" to close

F. Sample training data (hardcoded, pre-populated):
   - 今日: ベンチプレス (胸) SET1: 80kg×10, SET2: 80kg×8, SET3: 75kg×8
   - 今日: ダンベルフライ (胸) SET1: 20kg×12, SET2: 20kg×10
   - 昨日: スクワット (脚) SET1: 100kg×8, SET2: 100kg×6, SET3: 90kg×8
   - 昨日: レッグプレス (脚) SET1: 150kg×10, SET2: 150kg×8
   - 3日前: デッドリフト (背中) SET1: 120kg×5, SET2: 120kg×5, SET3: 110kg×6
   - 3日前: ラットプルダウン (背中) SET1: 60kg×10, SET2: 60kg×10
   - 5日前: オーバーヘッドプレス (肩) SET1: 40kg×10, SET2: 40kg×8
   - 5日前: サイドレイズ (肩) SET1: 10kg×15, SET2: 10kg×12
   - 1週間前: アームカール (腕) SET1: 15kg×12, SET2: 15kg×10
   - 1週間前: プランク (体幹) SET1: 0kg×60秒

Step 4: Update src/sections/BottomNav.tsx
   - Change "inventory" tab to "training"
   - Change icon from IconBag to IconBook or a dumbbell icon
   - Update label: "TRAINING" / "トレーニング"
   - Update NavTab type

Step 5: Update src/App.tsx
   - Remove InventoryPage import, add TrainingPage import
   - Change "inventory" case to "training" in renderMainContent
   - Update NavTab type to use "training" instead of "inventory"

Step 6: Update src/locales/en.ts and src/locales/ja.ts
   - Remove all inventory.* keys
   - Add training.* keys:
     training: {
       title: "TRAINING LOG" / "トレーニング記録",
       totalSessions: "Total Sessions" / "総セッション数",
       totalWeight: "Total Weight" / "総重量",
       favoritePart: "Favorite" / "得意部位",
       all: "ALL" / "すべて",
       chest: "CHEST" / "胸",
       back: "BACK" / "背中",
       arms: "ARMS" / "腕",
       legs: "LEGS" / "脚",
       shoulders: "SHOULDERS" / "肩",
       core: "CORE" / "体幹",
       addTraining: "ADD TRAINING" / "トレーニングを追加",
       exerciseName: "Exercise Name" / "種目名",
       selectBodyPart: "Select Body Part" / "部位を選択",
       weight: "Weight (kg)" / "重量 (kg)",
       reps: "Reps" / "回数",
       addSet: "ADD SET" / "セット追加",
       save: "SAVE" / "保存",
       cancel: "CANCEL" / "キャンセル",
       set: "SET" / "セット",
       volume: "Volume" / "ボリューム",
       today: "Today" / "今日",
       yesterday: "Yesterday" / "昨日",
       daysAgo: "{{count}} days ago" / "{{count}}日前",
       weekAgo: "1 week ago" / "1週間前",
       seconds: "sec" / "秒",
       ... etc
     }
   - Update nav.inventory to nav.training: "TRAINING" / "トレーニング"

Step 7: Run typecheck and build:
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"

Fix ALL errors. Make sure clean compile.

Style: Match existing Pixel Quest aesthetic. pixel-border cards, parchment-bg, gold accents, framer-motion animations.
The training form inputs should be styled consistently with WorkoutPage form inputs.
