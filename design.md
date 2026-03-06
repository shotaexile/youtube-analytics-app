# YouTube Analytics App — Design Plan

## Brand Identity
- **App Name:** YT Analytics
- **Primary Color:** `#FF0000` (YouTube Red)
- **Accent Color:** `#1A1A2E` (Deep Navy)
- **Background Light:** `#FFFFFF`
- **Background Dark:** `#0F0F0F`
- **Surface Light:** `#F8F8F8`
- **Surface Dark:** `#1A1A1A`
- **Success:** `#22C55E`
- **Warning:** `#F59E0B`
- **Error:** `#EF4444`

---

## Screen List

### 1. ダッシュボード (Dashboard) — `/`
**Primary Content:**
- チャンネル全体サマリーカード（総視聴回数・総収益・総再生時間・登録者数）
- 月別視聴回数推移グラフ（折れ線グラフ）
- カテゴリ別パフォーマンス（REAL VALUE / ショート / 通常動画）
- 直近10本の動画リスト

### 2. ランキング (Rankings) — `/rankings`
**Primary Content:**
- ランキング種別セレクター（視聴回数 / 収益 / 再生時間 / CTR / 高評価率）
- TOP 20 動画ランキングリスト（メダルアイコン付き）
- 期間フィルター（全期間 / 直近3ヶ月 / 直近6ヶ月 / 直近1年）

### 3. グラフ分析 (Charts) — `/charts`
**Primary Content:**
- 視聴回数 vs 収益の散布図
- 動画の長さ vs 平均視聴時間の相関グラフ
- CTR vs 視聴回数の関係グラフ
- 月別投稿本数と視聴回数の棒グラフ

### 4. 動画一覧 (Videos) — `/videos`
**Primary Content:**
- 検索バー
- ソート・フィルターオプション
- 動画カードリスト（サムネイル風カード、主要指標表示）

### 5. 動画詳細 (Video Detail) — `/video/[id]`
**Primary Content:**
- 動画タイトル・公開日
- 主要指標カード（視聴回数・収益・再生時間・CTR・高評価率）
- パフォーマンス評価スコア（A〜Eグレード）
- AI分析セクション（強み・弱み・改善提案）
- 類似動画比較

### 6. AI分析 (AI Analysis) — `/ai`
**Primary Content:**
- チャンネル全体のAI評価レポート
- コンテンツ戦略の提案
- 改善アクションリスト（優先度付き）
- 成功パターン分析

---

## Key User Flows

### フロー1: ダッシュボードから動画詳細へ
ダッシュボード → 直近動画リストのカードをタップ → 動画詳細画面 → AI分析セクションを確認

### フロー2: ランキングから動画詳細へ
ランキング画面 → ランキング種別を選択 → 動画カードをタップ → 動画詳細画面

### フロー3: AI分析レポートを確認
AI分析タブ → チャンネル全体レポートを確認 → 改善アクションリストを確認

---

## Layout Principles
- **Bottom Tab Bar:** 5タブ（ダッシュボード・ランキング・グラフ・動画一覧・AI分析）
- **Card-based Design:** 各指標はカード形式で表示
- **Color Coding:** 高パフォーマンス=緑、低パフォーマンス=赤、中間=黄
- **Typography:** 数値は大きく太字、ラベルは小さくグレー
- **Dark Mode Support:** 完全対応
