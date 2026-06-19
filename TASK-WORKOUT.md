You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4.

BUILD: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
TYPECHECK: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"

Read existing code first:
- src/index.css (theme, utilities)
- src/App.tsx (routing, state)
- src/icons/index.tsx (icons)
- src/sections/WorkoutLog.tsx (existing card on home — entry point)
- src/sections/QuestsPage.tsx and QuestDetail.tsx (pattern for list+detail)
- src/sections/StatusPanel.tsx (stats layout)

TASK: Create the WORKOUT RECORDING screen.

This is the core functional screen — where users actually log their exercises.

1. Create src/sections/WorkoutPage.tsx
   Full workout recording flow with these states:

   A. WORKOUT START (initial state)
      - "BEGIN QUEST" button (large, gold, pixel-border)
      - Today's date
      - Quick stats: workouts this week, current streak

   B. ACTIVE WORKOUT (after pressing begin)
      - Timer showing elapsed time (MM:SS format, updating every second)
      - Exercise list (added exercises appear here)
      - "ADD EXERCISE" button opens exercise form
      - Each exercise entry shows: name, sets x reps x weight
      - Can add multiple sets per exercise
      - "COMPLETE QUEST" button to finish

   C. EXERCISE FORM (inline, not a separate page)
      - Exercise name input (text, pixel-border styled)
      - Muscle group selector: CHEST, BACK, ARMS, LEGS, SHOULDERS, CORE (tap to select, RPG button style)
      - Weight (kg) input
      - Reps input
      - "ADD SET" button
      - Sets display as a list: "SET 1: 80kg x 10", "SET 2: 80kg x 8"
      - "DONE" button to close form and add to workout

   D. WORKOUT COMPLETE (after finishing)
      - Summary screen with RPG victory fanfare style
      - "QUEST COMPLETE!" header
      - Total time, exercises done, total sets, total reps, total weight
      - XP earned (calculated: 10 XP per set + time bonus)
      - "RETURN TO GUILD" button (goes back to home)

2. Update src/App.tsx
   - Add a "workoutActive" state
   - When WorkoutLog card on home is tapped, show WorkoutPage
   - When workout completes and user returns, go back to home
   - The home screen WorkoutLog card's onPress should trigger this

3. Sample/default data:
   - Pre-populated exercise suggestions when typing: "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull Up", "Bicep Curl", "Tricep Extension", "Leg Press", "Lat Pulldown"
   - All inputs should work (useState for form state)
   - Timer should actually count up using useEffect/setInterval

4. Style: parchment/ink/gold palette, pixel-border, font-pixel, framer-motion animations.
   All form inputs styled with pixel-border, parchment-dark-bg background.
   Buttons: gold bg with ink text for primary, parchment-dark for secondary.

5. Run typecheck and build. Fix all errors.
