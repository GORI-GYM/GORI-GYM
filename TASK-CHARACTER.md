# Task: Redesign Character SVG for Clear Muscle Growth

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Problem
Current SVG character doesn't show muscle growth clearly. Need DRAMATIC visible differences between levels.

## Files to Edit
- src/sections/AvatarSection.tsx (home avatar)
- src/sections/CharacterPage.tsx (character detail page)

## Character Design: Front-facing pixel bodybuilder

### SVG Structure - Each body part is a separate group that scales independently:
- head (doesn't change)
- neck/traps (grows with level)
- shoulders left/right (get wider and rounder)
- chest (gets thicker and wider)
- arms left/right (biceps get bigger, forearms thicker)
- torso/core (v-taper develops, lats widen)
- legs left/right (quads get thicker, calves grow)

### 5 Distinct Levels:

Level 1 (Skinny): Thin arms, flat chest, narrow shoulders, thin legs, narrow torso
Level 2 (Some definition): Arms +15%, chest starts showing, shoulders slightly wider
Level 3 (Athletic): Arms +30%, clear pec shape, visible delts, quad definition, v-taper
Level 4 (Muscular): Arms +50%, thick chest, broad shoulders, thick legs, wide lats
Level 5+ (Massive): Arms +70%, huge chest, bowling ball delts, tree trunk legs, extreme v-taper, big traps

### How to implement the scaling:
Use transform: scale() on each body part group based on level.
Example: arms at level 1 = scale(1), level 3 = scale(1.3), level 5 = scale(1.7)
Use transform-origin centered on each body part so scaling looks natural.

### Pixel Art Style:
- Use rectangles and simple geometric shapes (not organic curves)
- Skin color: #FFDBAC base, darker shadows for muscle definition at higher levels
- Outline: #2D1B0E (ink color)
- Keep it simple but the SIZE DIFFERENCES must be dramatic and obvious

### AvatarSection.tsx:
- Read level from props
- Show character at appropriate size for that level
- SVG viewBox 0 0 200 300, character centered

### CharacterPage.tsx:
- Show larger character
- Individual body parts scale based on bodyPartXP (per-muscle growth)
- If chest XP high but leg XP low, chest visually bigger than legs
- Highlight body parts on tap
- framer-motion transitions for smooth growth animation

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
