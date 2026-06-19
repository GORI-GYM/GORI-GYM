# Task: Dramatically Improve Progress Chart

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read src/sections/TrainingPage.tsx before editing.

## Problem
The current progress chart makes weight improvements hard to see. The Y axis uses ugly decimal numbers like 22.5kg, 67.5kg. The bars all look the same height. Users can't feel motivated seeing their progress.

## Required Changes to ProgressChart component

### 1. Y-Axis: Round Numbers Only
- Calculate "nice" tick values: use intervals of 5, 10, 20, 25, or 50
- Examples:
  - Weights 75-80kg -> Y ticks: 75, 80 (interval 5)
  - Weights 60-120kg -> Y ticks: 60, 80, 100, 120 (interval 20)
- NEVER show decimals like 22.5kg or 67.5kg
- Show "kg" suffix on labels

### 2. Y-Axis: Do NOT Start From Zero
- This is the MOST important change
- Start Y axis from just below the minimum weight value
- Example: if recorded weights are [75, 77.5, 80], show Y axis from 70 to 85
- This makes a 2.5kg improvement look like a significant visual jump
- Add ~10% padding below min and above max

### 3. Thick Bars Instead of Thin Lines
- Replace thin lines/circles with thick rectangular bars (width ~30px)
- Bar color: gold (#FFB800)
- Highlight the max value bar with brighter gold and a subtle glow
- Other bars slightly muted (#D4A017 or similar)

### 4. Show Weight Value on Top of Each Bar
- Display the actual kg value above each bar as text
- e.g. "75kg", "77.5kg", "80kg"
- Font size small but readable, ink color (#2D1B0E)

### 5. PR Star on Highest Bar
- If the latest (rightmost) data point is the highest, show a small star icon (★) above it
- Gold color, to indicate new personal record

### 6. Chart Height
- Increase SVG height from current value to at least 180px
- Taller chart = more dramatic visual difference between bars

### 7. Keep Pixel Quest Style
- Parchment background for chart area
- Ink color text
- Gold bars and accents

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
