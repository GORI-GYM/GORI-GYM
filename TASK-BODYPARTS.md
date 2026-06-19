# Task: Update body parts - split ARMS into BICEPS/TRICEPS, remove CORE

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Change Summary
Replace the body part list in BOTH RoutinePage.tsx and TrainingPage.tsx:

OLD: CHEST / BACK / SHOULDERS / ARMS / LEGS / CORE
NEW: CHEST / BACK / SHOULDERS / BICEPS / TRICEPS / LEGS

## Files to modify

### 1. src/sections/TrainingPage.tsx
- Change BodyPart type: remove "ARMS" and "CORE", add "BICEPS" and "TRICEPS"
- Update bodyParts array to: ["ALL", "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS"]
- Reclassify exercises:
  - Bicep Curl, Hammer Curl, Cable Curl -> BICEPS
  - Triceps Extension, Skull Crusher, Dips -> TRICEPS
  - Remove all CORE exercises (Plank, Crunch, Leg Raise, Ab Roller, Side Plank)
- Update sample training data body parts accordingly

### 2. src/sections/RoutinePage.tsx
- Change BodyPart type: remove "ARMS" and "CORE", add "BICEPS" and "TRICEPS"
- Update bodyParts array
- Update preset routines:
  - "Chest + Triceps Day": parts = ["CHEST", "TRICEPS"]
  - "Back + Biceps Day": parts = ["BACK", "BICEPS"]
  - "Leg Day": parts = ["LEGS"] (unchanged)
  - "Shoulder + Core Day" -> rename to "Shoulder Day" (肩の日), parts = ["SHOULDERS"], remove Plank and Crunch exercises from it
- Update exercise suggestions per body part

### 3. src/locales/en.ts
- Remove: training.arms, training.core (and any routine equivalents)
- Add: training.biceps = "BICEPS", training.triceps = "TRICEPS"
- Change routine.shoulderCore to routine.shoulderDay = "Shoulder Day"

### 4. src/locales/ja.ts
- Remove: training.arms (腕), training.core (体幹)
- Add: training.biceps = "二頭筋", training.triceps = "三頭筋"
- Change routine.shoulderCore to routine.shoulderDay = "肩の日"

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
