You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
This is an RPG-style fitness app with a retro 16-bit pixel art aesthetic (Pixel Quest style).
Tech stack: Vite + React + TypeScript + Tailwind v4.

IMPORTANT BUILD COMMAND (use this exact command for build):
cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"

IMPORTANT: Read the existing code first to understand patterns:
- src/index.css (theme tokens, pixel-border utilities, parchment-bg, stone-bg, font-pixel)
- src/App.tsx (main app structure, nav state)
- src/sections/BottomNav.tsx (tab navigation)
- src/icons/index.tsx (existing SVG icons)
- src/sections/WorkoutLog.tsx, StreakCard.tsx, StatusPanel.tsx (style patterns)

TASK: Create the QUESTS page with quest list and quest detail view.

1. Create src/sections/QuestsPage.tsx
   - Quest list showing RPG-style quests mapped to fitness goals
   - Each quest card: quest name (pixel font), description, XP reward, progress bar, difficulty stars, quest type icon
   - Quest types: DAILY (repeat daily), WEEKLY (7-day), LEGENDARY (long-term)
   - Use pixel-border, parchment-bg, pixel font classes
   - Colors: parchment #F5E6C8, ink #2D1B0E, gold #FFB800
   - Category headers with section dividers (like STATUS section pattern)
   - Hardcoded sample data

2. Create src/sections/QuestDetail.tsx
   - Shown when quest card tapped
   - Shows: quest name, full description, objectives checklist, XP reward breakdown, time remaining, accept/complete button
   - Back button to return to list
   - RPG scroll/parchment styling

3. Update src/App.tsx
   - When activeTab is "quests", show QuestsPage instead of home content
   - Pass navigation callbacks for quest selection/back

4. Sample quests:
   DAILY: "Morning Warrior" (30min workout, 50XP), "Iron Oath" (log 3 exercises, 30XP), "Hydration Quest" (drink 2L water, 20XP)
   WEEKLY: "Chest Conqueror" (3 chest workouts, 200XP), "Endurance Trial" (run 15km, 300XP)
   LEGENDARY: "The 100 Day Crusade" (100 day streak, 5000XP), "Atlas Ascension" (lift 100,000kg total, 10000XP)

5. Animations: framer-motion entry animations, hover/active states on cards

6. After implementation, build using the build command above and verify success.

The quests page should feel like opening a quest board in an RPG tavern.
