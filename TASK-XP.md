# Task: Connect Training Records to Character Growth

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Overview
When the user records training in TrainingPage, the character on the home screen and CharacterPage should gain XP and visually grow more muscular. Training volume (weight × reps × sets) drives character progression.

## Files to Read First
- src/App.tsx (shared state)
- src/sections/AvatarSection.tsx (home avatar)
- src/sections/CharacterPage.tsx (character growth page with muscle groups)
- src/sections/TrainingPage.tsx (training records, session completion)
- src/sections/XPBar.tsx (XP/level display)

## Implementation

### 1. XP System (App.tsx)
- Add shared state: xp (number), level (number)
- XP formula: total volume from a session = sum of (weight × reps) for all sets
- Each 1kg of volume = 1 XP (e.g. bench 80kg × 10 reps = 800 XP per set)
- Level thresholds: Level 1 = 0 XP, Level 2 = 5000 XP, Level 3 = 15000 XP, Level 4 = 30000 XP, Level 5 = 50000 XP, etc.
- Initialize with sample data XP (calculate from sampleEntries)
- Pass xp/level/setXp to XPBar, AvatarSection, CharacterPage, TrainingPage

### 2. Training Completion -> XP Gain (TrainingPage.tsx)
- When handleCompleteSession or handleSaveTraining fires:
  - Calculate session volume (sum of weight × reps for all sets)
  - Add to shared XP state
  - Show XP gained notification: "+800 XP!" in gold, animated with framer-motion (fade in/out)

### 3. XP Bar Update (XPBar.tsx)
- Read xp and level from props instead of hardcoded values
- Show current XP / next level XP (e.g. "12,500 / 15,000 XP")
- Progress bar fills based on progress toward next level
- Level number displayed prominently

### 4. Avatar Muscle Growth (AvatarSection.tsx)
- The SVG character should visually change based on level:
  - Level 1: Thin/normal body
  - Level 2: Slightly wider shoulders, small biceps
  - Level 3: Visible chest, bigger arms, wider back
  - Level 4: Large muscles, thick legs, broad shoulders
  - Level 5+: Massive muscular physique
- Use SVG transform scale or path changes based on level
- Keep pixel art style

### 5. Character Page Muscle Levels (CharacterPage.tsx)
- Each body part level should be driven by training data:
  - Chest exercises volume -> chest muscle level
  - Back exercises volume -> back muscle level
  - etc.
- Track per-body-part XP in shared state
- Body part level = bodyPartXP / 5000 (capped at level 10)
- The SVG muscle visualization should scale with these levels (already partially implemented)
- Pass body part levels from App.tsx based on training data

### 6. Body Part XP Mapping
When a training session completes, distribute XP to body parts based on exercise body part:
- CHEST exercises -> chest XP
- BACK exercises -> back XP
- SHOULDERS exercises -> shoulders XP
- BICEPS exercises -> biceps XP (map to "arms" on character page if needed)
- TRICEPS exercises -> triceps XP (map to "arms" on character page if needed)
- LEGS exercises -> legs XP

### 7. i18n Keys
- home.xpGained: "+{{xp}} XP!" / "+{{xp}} XP!"
- home.levelUp: "LEVEL UP!" / "レベルアップ!"
- character.totalXP: "Total XP" / "総経験値"
- character.bodyPartXP: "Part XP" / "部位経験値"

## Style
Pixel Quest design. XP gain notification should be a floating gold text animation. Level up should have a special celebratory animation.

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
