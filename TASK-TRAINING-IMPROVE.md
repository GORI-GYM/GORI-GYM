# TRAINING タブ改善: 情報整理 + 入力UI最適化

## 改善1: セッションビューと履歴ビューの分離

現状TRAININGタブには、カレンダー・履歴・進行中セッション・手動追加・グラフが1画面に同居しており認知負荷が高い。

以下のようにビュー分離する:
- タブ上部に「セッション」「履歴」の2つのサブタブ（トグル）を配置
- セッションビュー: ルーティーン選択、進行中セッション、手動追加フォーム
- 履歴ビュー: カレンダー、過去の記録一覧、進捗グラフ
- デフォルトはセッションビュー。セッション進行中でないときも「セッション」がデフォルト

## 改善2: セット入力UIの最適化

現状の数値入力が使いにくい。以下を改善:
- 重量入力: +-2.5kgの±ボタンを追加（数値入力フィールドの左右に配置）
- 回数入力: +-1の±ボタンを追加
- セット完了チェック: 各セットの横にチェックマークボタンを追加、完了したセットは視覚的に区別
- ボタンスタイル: ゴールド(#FFB800)の丸ボタン、タップしやすいサイズ(40px以上)

## 対象ファイル

- C:\Users\knuma\Projects\gym-quest\src\sections\TrainingPage.tsx（メイン変更）
- C:\Users\knuma\Projects\gym-quest\src\locales\ja.ts（翻訳キー追加）
- C:\Users\knuma\Projects\gym-quest\src\locales\en.ts（翻訳キー追加）

## デザイン

Pixel Questスタイル（羊皮紙 #F5E6C8、インク #2D1B0E、ゴールド #FFB800）
サブタブのデザインはBottomNavのようなスタイルではなく、シンプルなテキストトグル（選択中はゴールドの下線）

## 検証

ビルドコマンド:
```
cmd /c "set PATH=C:\Program Files\nodejs;%PATH% && cd /d C:\Users\knuma\Projects\gym-quest && node node_modules\vite\bin\vite.js build"
```
ビルド成功・型エラーなしを確認すること。
