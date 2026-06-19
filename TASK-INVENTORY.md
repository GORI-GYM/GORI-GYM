You are working on the Gym Quest project at C:\Users\knuma\Projects\gym-quest.
RPG-style fitness app, retro 16-bit pixel art (Pixel Quest style).
Tech: Vite + React + TypeScript + Tailwind v4.

BUILD: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
TYPECHECK: cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\typescript\bin\tsc --noEmit"

Read existing code first:
- src/index.css, src/App.tsx, src/icons/index.tsx
- src/sections/QuestsPage.tsx (list pattern reference)
- src/sections/CharacterPage.tsx (stats card pattern)

TASK: Create the INVENTORY screen.

The inventory shows items/rewards earned through training streaks and achievements.

1. Create src/sections/InventoryPage.tsx

   A. INVENTORY HEADER
      - "INVENTORY" title in pixel font
      - Item count: "12 / 50 ITEMS"
      - Gold coins display (earned from workouts)

   B. ITEM CATEGORIES (horizontal tab bar)
      - ALL, EQUIPMENT, POTIONS, BADGES, RARE
      - Pixel-style tab buttons, active = gold bg

   C. ITEM GRID
      - 3-column grid of item cards
      - Each item card:
        - Item icon (simple SVG — sword, shield, potion bottle, medal, etc.)
        - Item name (pixel-xs font)
        - Rarity border color: COMMON (gray), UNCOMMON (green), RARE (blue), EPIC (purple), LEGENDARY (gold)
        - Quantity badge if > 1
      - Tap item to show detail popup

   D. ITEM DETAIL (modal/overlay when tapped)
      - Item icon (larger)
      - Name, description, rarity
      - How it was earned
      - Stats bonus (if equipment): "+2 STRENGTH", "+5% XP BONUS"
      - "EQUIP" or "USE" button (visual only)
      - Close button

2. Update src/App.tsx
   - When activeTab is "inventory", show InventoryPage

3. Sample items (hardcoded):
   EQUIPMENT:
   - "Iron Gauntlets" (UNCOMMON, +2 Strength, earned from 10 arm workouts)
   - "Steel Chestplate" (RARE, +3 Defense, earned from 25 chest workouts)
   - "Dragon Boots" (EPIC, +5 Agility, earned from 50 leg workouts)

   POTIONS:
   - "XP Potion" x3 (COMMON, +50 XP bonus next workout)
   - "Streak Shield" x1 (RARE, protects streak for 1 missed day)
   - "Double XP Elixir" x1 (EPIC, double XP for next workout)

   BADGES:
   - "First Blood" (COMMON, completed first workout)
   - "Iron Will" (UNCOMMON, 7-day streak)
   - "Centurion" (RARE, 100 total workouts)
   - "Legendary Warrior" (LEGENDARY, reached level 10)

   RARE:
   - "Golden Dumbbell" (LEGENDARY, lifted 50,000kg total)
   - "Phoenix Feather" (LEGENDARY, 30-day streak)

4. Style: RPG inventory grid feel. Dark stone-bg for the grid area. Item cards with pixel-border.
   Rarity glow effect on EPIC and LEGENDARY items.
   Framer-motion for item card entry animations (staggered).

5. Run typecheck and build. Fix all errors.
