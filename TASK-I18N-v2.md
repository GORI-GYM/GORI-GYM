You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4.

For all npm/node commands, always prefix with:
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && ..."

TASK: Add full Japanese/English internationalization to ALL screens.

Use react-i18next + i18next.

Step 1: Install deps.
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && npm install react-i18next i18next"

Step 2: Create src/i18n.ts — i18n config. Default language: ja. Fallback: en. Inline resources.

Step 3: Create src/locales/en.ts and src/locales/ja.ts
  Read EVERY file in src/sections/ to find ALL hardcoded strings.
  Use nested keys: common, nav, home, workout, quests, character, inventory, achievements.

Step 4: Update src/main.tsx to import './i18n'

Step 5: Update ALL 13 section components to use useTranslation() hook.
  Replace every hardcoded string with t('key'). Use interpolation for variables.
  Files: TopBar, AvatarSection, XPBar, WorkoutLog, StreakCard, StatusPanel, BottomNav,
         QuestsPage, QuestDetail, CharacterPage, InventoryPage, WorkoutPage, AchievementsPage

Step 6: Add language switcher to TopBar.tsx — pixel-style JP/EN toggle button.

Step 7: Japanese translations (RPG-flavored):
  WORKOUT LOG=トレーニング記録, STREAK=連続記録, BEGIN QUEST=クエスト開始,
  QUEST COMPLETE=クエスト達成！, RETURN TO GUILD=ギルドに戻る,
  TROPHY ROOM=トロフィールーム, Morning Warrior=朝の戦士, Iron Oath=鉄の誓い,
  Chest Conqueror=胸筋の征服者, The 100 Day Crusade=100日の聖戦,
  STRENGTH=筋力, ENDURANCE=耐久力, STAMINA=スタミナ, FOCUS=集中力,
  DISCIPLINE=規律, ATTACK=攻撃力, DEFENSE=防御力, VITALITY=体力,
  RECOVERY=回復力, AGILITY=俊敏性, HOME=ホーム, QUESTS=クエスト,
  INVENTORY=アイテム, CHARACTER=キャラクター, ACHIEVEMENTS=実績,
  STATUS=ステータス, BODY DEVELOPMENT=身体発達, GROWTH HISTORY=成長履歴,
  GYM QUEST=ジムクエスト, TRAIN. LEVEL UP. BECOME LEGEND.=鍛えろ。成長しろ。伝説になれ。

Step 8: CSS font fallback. Press Start 2P does not support Japanese.
  Add to src/index.css:
  html[lang="ja"] .font-pixel { font-family: "DotGothic16", "MS Gothic", monospace; }
  Also add DotGothic16 Google Font import to index.html.

Step 9: Run typecheck and build. Fix ALL errors:
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"
  cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"

IMPORTANT: Do not miss ANY hardcoded string. Every visible text must use t().
