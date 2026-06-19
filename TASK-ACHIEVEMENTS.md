You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4.

BUILD: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
TYPECHECK: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"

Read existing code first:
- src/index.css, src/App.tsx, src/icons/index.tsx
- src/sections/QuestsPage.tsx (list pattern)
- src/sections/CharacterPage.tsx (progress bars)

TASK: Create the ACHIEVEMENTS screen.

The achievements page shows all badges and milestones — the trophy room.

1. Create src/sections/AchievementsPage.tsx

   A. TROPHY ROOM HEADER
      - "TROPHY ROOM" title, pixel font, gold
      - Completion: "8 / 24 ACHIEVEMENTS" with progress bar
      - Total achievement points

   B. ACHIEVEMENT CATEGORIES
      - TRAINING (workout count milestones)
      - STRENGTH (weight lifted milestones)
      - STREAK (consecutive day milestones)
      - MASTERY (muscle group mastery)
      - LEGENDARY (special rare achievements)

   C. ACHIEVEMENT LIST
      - Each achievement card:
        - Trophy/badge icon (unique SVG per achievement)
        - Achievement name (pixel font)
        - Description
        - Progress bar (e.g. "45/100 workouts")
        - Reward: XP amount + item name if applicable
        - LOCKED (grayed out, progress shown) vs UNLOCKED (full color, gold border, date earned)
        - Rarity indicator: bronze/silver/gold/diamond border

   D. ACHIEVEMENT DETAIL (expand on tap)
      - Larger icon
      - Full description
      - Progress detail
      - Reward breakdown
      - Date earned (if unlocked)

2. Update src/App.tsx
   - When activeTab is "achievements", show AchievementsPage

3. Sample achievements (hardcoded):

   TRAINING (unlocked/locked):
   - "First Step" — Complete 1 workout (UNLOCKED, bronze, 10 pts)
   - "Dedicated" — Complete 25 workouts (UNLOCKED, silver, 50 pts)
   - "Warrior" — Complete 100 workouts (LOCKED, 63/100, gold, 200 pts)
   - "Legend" — Complete 500 workouts (LOCKED, 163/500, diamond, 1000 pts)

   STRENGTH:
   - "Heavy Lifter" — Lift 10,000kg total (UNLOCKED, bronze, 25 pts)
   - "Iron Giant" — Lift 50,000kg total (UNLOCKED, silver, 100 pts)
   - "Atlas" — Lift 100,000kg total (LOCKED, 52340/100000, gold, 500 pts)

   STREAK:
   - "Getting Started" — 3-day streak (UNLOCKED, bronze, 15 pts)
   - "On Fire" — 7-day streak (UNLOCKED, bronze, 30 pts)
   - "Unstoppable" — 14-day streak (UNLOCKED, silver, 75 pts)
   - "Immortal" — 30-day streak (LOCKED, 14/30, gold, 200 pts)
   - "Eternal Flame" — 100-day streak (LOCKED, 14/100, diamond, 1000 pts)

   MASTERY:
   - "Chest Apprentice" — Chest LVL 5 (UNLOCKED, bronze, 20 pts)
   - "Arm Scholar" — Arms LVL 5 (UNLOCKED, bronze, 20 pts)
   - "Chest Master" — Chest LVL 10 (LOCKED, 8/10, silver, 100 pts)
   - "Full Body Master" — All groups LVL 10 (LOCKED, 0/6 groups, diamond, 2000 pts)

   LEGENDARY:
   - "The Chosen One" — Reach Level 20 (LOCKED, 12/20, diamond, 5000 pts)
   - "Mythic Warrior" — All achievements unlocked (LOCKED, 8/24, diamond, 10000 pts)

4. Style: Trophy room feel. Unlocked = bright, celebratory. Locked = muted, mysterious.
   Staggered framer-motion animations. Category filters as horizontal scroll tabs.
   Diamond achievements should have a subtle sparkle/shimmer animation.

5. Run typecheck and build. Fix all errors.
