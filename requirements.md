# タスク管理ツール 要件定義書

## 1. プロジェクト概要
営業チーム向けの顧客対応タスク管理システム。営業管理が営業マンに顧客関連のタスクを割り当て、進捗を管理し、承認フローを持つWebアプリケーション。

## 2. 技術スタック
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Authentication + Realtime)
- **Notifications**: Web Push API
- **File Storage**: Supabase Storage

## 3. ユーザー役職
| 役職 | 権限 |
|------|------|
| 営業管理 (admin) | 全社員管理、全タスク管理、組織階層変更、顧客情報変更 |
| 営業マン（マネージャー）(manager) | 自分のタスク + 配下メンバーのタスク管理 |
| 営業マン (sales) | 自分のタスクのみ |

## 4. タスク構成要素
各タスクは以下の情報を持つ：
- **面談ID**: 顧客識別用（手動入力、重複可能）
- **LINE名**: 顧客のLINE表示名
- **本名**: 顧客の実名
- **タスク内容**: 具体的な作業内容

## 5. 顧客情報の自動入力機能
- タスク作成時に面談IDを入力すると、既存の顧客情報（LINE名、本名）が自動入力される
- 面談IDが重複する場合は確認ダイアログを表示してスルー
- 新規顧客の場合は手動でLINE名、本名を入力

## 6. データベース設計

### users テーブル (組織管理)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'sales')) NOT NULL,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### customers テーブル (顧客情報)
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id VARCHAR(100) NOT NULL,
  line_name VARCHAR(100) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### tasks テーブル (タスク管理)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')) DEFAULT 'pending',
  deadline TIMESTAMP,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  assigned_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### task_threads テーブル (スレッド機能)
```sql
CREATE TABLE task_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  message TEXT NOT NULL,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### notifications テーブル
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  task_id UUID REFERENCES tasks(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. タスクフロー
1. 営業管理が営業マンにタスクを割り当て（面談ID、LINE名、本名、タスク内容を指定）
2. 営業マンに通知（ブラウザ通知）
3. 営業マンがタスクを実行・完了報告
4. 営業管理に通知
5. 営業管理が承認/差し戻し（スレッド形式でやり取り）

## 8. タスク状態管理
- `pending`: 未着手
- `in_progress`: 作業中  
- `completed`: 完了（承認待ち）
- `approved`: 承認済み
- `rejected`: 差し戻し

## 9. 画面構成

### 9.1 営業管理 (admin)
- **ダッシュボード**: 全タスクの状況、承認待ちリスト
- **タスク作成**: 面談ID入力 → 顧客情報自動入力/新規入力 → タスク内容入力
- **タスク管理**: 全タスクの閲覧・管理
- **顧客管理**: 全顧客一覧、顧客別タスク履歴
- **組織管理**: 全社員の階層変更
- **顧客情報編集**: 複数ステップでの安全な編集機能

### 9.2 営業マン（マネージャー）(manager)
- **自分のタスク**: 受信・進行中・完了タスク
- **チーム管理**: 配下メンバーのタスク状況
- **顧客履歴**: 担当顧客のタスク履歴閲覧

### 9.3 営業マン (sales)
- **自分のタスク**: 受信・進行中・完了タスク  
- **タスク詳細**: スレッド形式でのやり取り
- **完了報告**: 画像添付可能
- **顧客履歴**: 担当顧客のタスク履歴閲覧

## 10. 顧客管理機能

### 10.1 面談ID重複時の処理
```
面談ID "ABC123" 入力時の既存チェック:
1. 完全一致 (面談ID + LINE名 + 本名) → 自動入力
2. 面談IDのみ一致 → 確認ダイアログ表示
   「面談ID "ABC123" は既に存在します
   既存: 田中太郎 (田中太郎)  
   新規: 佐藤花子 (佐藤花子)
   このまま作成しますか？」
3. 一致なし → 新規顧客として登録
```

### 10.2 顧客詳細ページ
- 面談ID、LINE名、本名で顧客を特定
- 該当顧客の全タスク履歴（完了・未完了含む）
- タスク状態別のフィルタリング機能

### 10.3 顧客情報編集（誤操作防止設計）
```
編集手順:
1. 顧客選択
2. 「編集モード」ボタンクリック
3. 確認ダイアログ「顧客情報を編集しますか？」
4. パスワード再入力
5. 編集フォーム表示
6. 変更内容確認画面
7. 最終確認「保存しますか？」
8. 保存完了
```

## 11. タスク作成フロー

### 11.1 既存顧客の場合
1. 面談ID入力
2. 自動でLINE名、本名が入力される
3. タスク内容入力
4. 担当者選択
5. 期限設定（任意）
6. 作成

### 11.2 新規顧客の場合  
1. 面談ID入力（重複チェック）
2. LINE名、本名を手動入力
3. タスク内容入力
4. 担当者選択
5. 期限設定（任意）
6. 作成

## 12. 通知仕様
### 通知タイミング
- タスク割り当て時 → 担当者に通知
- タスク完了時 → 割り当て者に通知
- スレッド返信時 → 関係者に通知
- 承認/差し戻し時 → 担当者に通知

### 通知方法
- ブラウザ通知（Web Push API）
- アプリ内通知（未読バッジ）

## 13. ファイル添付機能
- **対応形式**: 画像（PNG, JPG, GIF）、PDF、DOC
- **最大サイズ**: 10MB
- **保存先**: Supabase Storage
- **添付場所**: タスク作成時、スレッド返信時

## 14. 認証・セキュリティ
- **認証**: Supabase Auth（メール/パスワード）
- **認可**: Row Level Security (RLS)
- **データアクセス制御**: 役職に応じたアクセス権限

## 15. 将来的な拡張機能（現在は実装しない）
- マネージャーから部下へのタスク作成機能
- タスクカテゴリ・ラベル機能  
- 進捗報告機能
- 分析・レポート機能
- 顧客の統合・分割機能

## 16. 非機能要件
- **レスポンシブ対応**: PC・タブレット・スマートフォン
- **リアルタイム更新**: タスク状態の即座反映
- **ブラウザ対応**: Chrome, Firefox, Safari, Edge (最新版)
- **パフォーマンス**: 1000タスク、500顧客まで快適動作

## 17. 開発フェーズ
### Phase 1: 基本機能
- 認証・ユーザー管理
- 顧客管理（作成・検索）
- タスクCRUD
- 基本的な通知

### Phase 2: 高度な機能  
- スレッド機能
- ファイル添付
- リアルタイム通知
- 顧客情報編集

### Phase 3: 管理機能
- 組織階層管理（管理者のみ）
- ダッシュボード
- 顧客別分析機能