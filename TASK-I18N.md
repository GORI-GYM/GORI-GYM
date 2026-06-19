You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4.

BUILD: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
TYPECHECK: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"
NPM INSTALL: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js install <package>"

TASK: Add full Japanese (ja) / English (en) internationalization to ALL screens.

Read ALL existing source files first to understand every hardcoded string:
- src/App.tsx
- src/sections/TopBar.tsx
- src/sections/AvatarSection.tsx
- src/sections/XPBar.tsx
- src/sections/WorkoutLog.tsx
- src/sections/StreakCard.tsx
- src/sections/StatusPanel.tsx
- src/sections/BottomNav.tsx
- src/sections/QuestsPage.tsx
- src/sections/QuestDetail.tsx
- src/sections/CharacterPage.tsx
- src/sections/InventoryPage.tsx
- src/sections/WorkoutPage.tsx
- src/sections/AchievementsPage.tsx

APPROACH: Use react-i18next + i18next for i18n.

1. Install dependencies:
   cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install react-i18next i18next"

2. Create src/i18n.ts — i18n configuration
   - Default language: ja (Japanese)
   - Fallback: en
   - Resources inline (no lazy loading needed for this app size)

3. Create src/locales/en.ts and src/locales/ja.ts
   Extract EVERY user-visible string from all components.
   This includes:
   - Navigation labels (HOME, QUESTS, INVENTORY, CHARACTER, ACHIEVEMENTS)
   - Headers (GYM QUEST, TRAIN. LEVEL UP. BECOME LEGEND.)
   - Section titles (STATUS, WORKOUT LOG, STREAK, BODY DEVELOPMENT, etc.)
   - Button labels (BEGIN QUEST, ADD EXERCISE, COMPLETE QUEST, etc.)
   - Stat names (STRENGTH, ENDURANCE, STAMINA, etc.)
   - Quest names and descriptions
   - Achievement names and descriptions
   - Item names and descriptions
   - Workout form labels
   - All other UI text
   
   Use nested keys organized by screen:
   {
     common: { ... },
     nav: { home, quests, inventory, character, achievements },
     home: { ... },
     workout: { ... },
     quests: { ... },
     character: { ... },
     inventory: { ... },
     achievements: { ... }
   }

4. Update src/main.tsx to import i18n config

5. Update ALL section components to use useTranslation() hook
   Replace every hardcoded string with t('key')
   For strings with variables, use interpolation: t('xpProgress', { current: 685, max: 1000 })

6. Add a language switcher to TopBar.tsx
   - Small pixel-style button showing current language: "JP" or "EN"
   - Tapping toggles between ja and en
   - Use the existing pixel-border button style
   - Position: replace one of the header buttons or add between menu and title

7. Japanese translations should be natural Japanese, not literal translations:
   - "WORKOUT LOG" → "トレーニング記録"
   - "STREAK" → "連続記録"
   - "BEGIN QUEST" → "クエスト開始"
   - "QUEST COMPLETE!" → "クエスト達成！"
   - "RETURN TO GUILD" → "ギルドに戻る"
   - "TROPHY ROOM" → "トロフィールーム"
   - "Morning Warrior" → "朝の戦士"
   - "Iron Oath" → "鉄の誓い"
   - "Chest Conqueror" → "胸筋の征服者"
   - "The 100 Day Crusade" → "100日の聖戦"
   - etc. (translate everything naturally)

8. Keep RPG flavor in Japanese translations — use kanji/katakana that feels game-like.

9. Run typecheck and build. Fix ALL errors. Make sure the app compiles cleanly.

IMPORTANT: Do not miss ANY hardcoded string. Every visible text must go through t().
IMPORTANT: The pixel font "Press Start 2P" does not support Japanese characters well. 
For Japanese text, the font should fall back to the body font or a suitable Japanese pixel/game font.
Add a CSS rule: when lang is ja, pixel font elements should use a readable Japanese font instead.
