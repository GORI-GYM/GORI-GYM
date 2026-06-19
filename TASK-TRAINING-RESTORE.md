# TrainingPage 復元 + 改善

## 重要: 既存機能の復元が最優先

前のタスクが誤ってTrainingPage.tsxを簡易版に置き換えてしまいました。
gitから元のTrainingPage.tsxを復元してから、改善を加えてください。

### 手順
1. `git diff HEAD~3 -- src/sections/TrainingPage.tsx` で変更を確認
2. `git log --oneline -10 -- src/sections/TrainingPage.tsx` で直近の変更履歴を確認
3. 適切なコミットからTrainingPage.tsxを復元: `git checkout <commit> -- src/sections/TrainingPage.tsx`
4. 復元後、App.tsxとの整合性を確認（pendingStartRoutine, routines propsなど）
5. 復元が確認できたら、以下の改善を追加

## 復元すべき既存機能
- カレンダー（月間表示、トレーニング日マーカー）
- ルーティーン選択からセッション開始フロー
- 進行中セッション管理（currentSession）
- 前回実績自動入力、次回重量提案
- 推移グラフ（PR星、切りの良いY軸）
- PR通知
- XP付与
- pendingStartRoutine による ROUTINE→TRAINING連携（App.tsxから受け取り）
- routines props（App.tsxから共有される）

## 改善1: セッションビューと履歴ビューの分離

復元後に追加:
- タブ上部に「セッション」「履歴」の2つのサブタブ（トグル）を配置
- セッションビュー: ルーティーン選択、進行中セッション、手動追加フォーム
- 履歴ビュー: カレンダー、過去の記録一覧、進捗グラフ
- デフォルトはセッションビュー
- サブタブのデザイン: シンプルなテキストトグル（選択中はゴールド #FFB800 の下線）

## 改善2: セット入力UIの最適化

- 重量入力: +-2.5kgの±ボタンを追加（数値入力フィールドの左右に配置）
- 回数入力: +-1の±ボタンを追加
- セット完了チェック: 各セットの横にチェックマークボタン、完了セットは視覚的に区別（薄い背景色）
- ボタンスタイル: ゴールド(#FFB800)の丸ボタン、タップしやすいサイズ(min 40px)

## デザイン
Pixel Questスタイル（羊皮紙 #F5E6C8、インク #2D1B0E、ゴールド #FFB800）

## 検証
```
cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
```
ビルド成功・型エラーなしを確認すること。
App.tsxからのpendingStartRoutine/routines propsが正しく受け取れていることを確認。
