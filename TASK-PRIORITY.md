# Task: Implement Top 5 Priority Improvements

Project: C:\Users\knuma\Projects\gym-quest
Use cmd /c to read all files before editing.

## Overview
Implement the 5 highest priority improvements for the training app.

## 1. Auto-fill Previous Results (前回実績の自動入力)
In the training session (TrainingPage), when a routine is selected and exercises are loaded:
- Each set should show the previous session's weight/reps as default values (pre-filled)
- Use sample history data to determine "previous" values
- Add quick buttons next to weight input: "Same" (同じ), "+2.5kg", "-2.5kg"
- Quick buttons for reps: "+1", "-1"
- The pre-filled values should appear as editable defaults, not just placeholders

## 2. Next Weight Suggestion (次回重量の提案)
After completing a training session (when "Finish Training" is pressed):
- For each exercise, evaluate performance:
  - All sets completed at target reps -> suggest +2.5kg next time (show green arrow up icon + "次回 82.5kg 推奨")
  - Some sets missed target -> suggest same weight (show yellow = icon + "次回も同じ重量")
  - Multiple sessions missed -> suggest deload -10% (show red arrow down + "デロード推奨")
- Show these suggestions in the completion summary
- Add i18n keys for suggestion messages

## 3. Exercise Progress Graph (種目ごとの推移グラフ)
Add a simple progress visualization:
- In TrainingPage, when tapping an exercise name in the history, show a small SVG line/bar chart
- Display the last 5 sessions' max weight for that exercise
- X axis: dates, Y axis: weight (kg)
- Simple SVG implementation, no chart library needed
- Pixel Quest styled (gold lines/bars on parchment background)
- Add a small chart icon button next to exercise names in history

## 4. Auto-start Rest Timer (セット間タイマー自動起動)
In the active training session:
- When a set is marked as complete (user fills in actual weight/reps for a set), auto-start a countdown timer
- Default: 90 seconds
- Show timer prominently between sets (large countdown display, gold text)
- Timer shows at the top of the session area
- Sound/vibration when timer ends (optional, can be visual only)
- "Skip" button to dismiss timer early
- Timer auto-hides when it reaches 0

## 5. PR (Personal Record) Detection & Notification (自己ベスト更新通知)
- Track the highest weight used for each exercise across all sample data
- When a user enters a weight higher than the previous max during a session:
  - Show a celebratory notification/banner: "🏆 NEW PR! Bench Press 82.5kg!"
  - Use Pixel Quest styling (gold border, animation, trophy icon)
  - framer-motion scale animation for the PR badge
- Also show PR markers in the training history (star icon next to PR sets)
- Add i18n keys: training.newPR, training.personalRecord, etc.

## i18n Keys to Add

### English:
training.same: "Same"
training.nextSuggestion: "Next suggestion"
training.suggestUp: "Increase to {{weight}}kg recommended"
training.suggestSame: "Keep same weight"
training.suggestDeload: "Deload recommended"
training.restTimer: "Rest Timer"
training.skip: "Skip"
training.seconds: "sec"
training.newPR: "NEW PR!"
training.personalRecord: "Personal Record"
training.progressChart: "Progress"
training.maxWeight: "Max Weight"
training.sessions: "sessions"

### Japanese:
training.same: "同じ"
training.nextSuggestion: "次回の提案"
training.suggestUp: "次回 {{weight}}kg に増量推奨"
training.suggestSame: "次回も同じ重量で"
training.suggestDeload: "デロード推奨"
training.restTimer: "レストタイマー"
training.skip: "スキップ"
training.seconds: "秒"
training.newPR: "新記録!"
training.personalRecord: "自己ベスト"
training.progressChart: "推移"
training.maxWeight: "最大重量"
training.sessions: "セッション"

## Style
All new UI must match Pixel Quest design: pixel-border, parchment bg, gold accents, ink text, framer-motion animations.

## After changes
cmd /c "cd /d C:\Users\knuma\Projects\gym-quest && npm run typecheck && npm run build"
Fix ALL errors.
