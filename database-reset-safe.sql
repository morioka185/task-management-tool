-- ===== 安全な段階的データベースリセットスクリプト =====
-- タスク管理ツール用 - requirements.md準拠
-- エラーハンドリング強化版

-- ===== Step 1: 既存データの段階的削除 =====
-- 外部キー制約エラーを避けるため、依存関係順に削除

-- 通知を削除
DELETE FROM notifications WHERE id IS NOT NULL;

-- タスクスレッドを削除
DELETE FROM task_threads WHERE id IS NOT NULL;

-- タスクを削除
DELETE FROM tasks WHERE id IS NOT NULL;

-- 顧客を削除
DELETE FROM customers WHERE id IS NOT NULL;

-- ユーザーを削除（auth.usersとの連携があるため慎重に）
DELETE FROM users WHERE email LIKE '%@test.com';

-- ===== Step 2: RLSポリシーの安全な削除 =====
-- 存在確認してから削除

-- users テーブルのポリシー削除
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- customers テーブルのポリシー削除
DROP POLICY IF EXISTS "All authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "All authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Admins can update customers" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;

-- tasks テーブルのポリシー削除
DROP POLICY IF EXISTS "Users can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and managers can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;

-- task_threads テーブルのポリシー削除
DROP POLICY IF EXISTS "Users can view task threads" ON task_threads;
DROP POLICY IF EXISTS "Users can insert task threads" ON task_threads;
DROP POLICY IF EXISTS "task_threads_select_policy" ON task_threads;
DROP POLICY IF EXISTS "task_threads_insert_policy" ON task_threads;

-- notifications テーブルのポリシー削除
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

-- ===== Step 3: トリガーの削除 =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_task_threads_updated_at ON task_threads;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- ===== Step 4: RLSの無効化 =====
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ===== Step 5: テスト用ユーザーの作成 =====
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) VALUES 
-- 営業管理（admin）
('10000000-0000-4000-8000-000000000001', 'admin@test.com', '管理者テスト', 'admin', NULL, NOW(), NOW()),

-- 営業マン（マネージャー）
('20000000-0000-4000-8000-000000000002', 'manager@test.com', '田中マネージャー', 'manager', '10000000-0000-4000-8000-000000000001', NOW(), NOW()),

-- 営業マン（sales）
('30000000-0000-4000-8000-000000000003', 'sales1@test.com', '佐藤営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),
('30000000-0000-4000-8000-000000000004', 'sales2@test.com', '鈴木営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),
('30000000-0000-4000-8000-000000000005', 'sales3@test.com', '山田営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),

-- 独立営業
('30000000-0000-4000-8000-000000000006', 'sales4@test.com', '独立営業', 'sales', '10000000-0000-4000-8000-000000000001', NOW(), NOW());

-- ===== Step 6: テスト用顧客データの作成 =====
INSERT INTO customers (id, interview_id, line_name, real_name, created_at, updated_at) VALUES 
('c0000000-0000-4000-8000-000000000001', 'INT001', '田中太郎LINE', '田中太郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000002', 'INT002', '佐藤花子LINE', '佐藤花子', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000003', 'INT003', '山田次郎LINE', '山田次郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000004', 'INT004', '鈴木一郎LINE', '鈴木一郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000005', 'INT001', '重複面談ID', '別の田中太郎', NOW(), NOW());

-- ===== Step 7: テスト用タスクデータの作成 =====
INSERT INTO tasks (id, customer_id, title, description, status, deadline, assigned_to, assigned_by, created_at, updated_at) VALUES 
-- 佐藤営業のタスク
('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'お客様フォローアップ', '初回面談後のフォローアップを実施してください', 'pending', NOW() + INTERVAL '3 days', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', NOW(), NOW()),

-- 鈴木営業のタスク
('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', '契約書確認', '契約書の内容確認と説明を行ってください', 'in_progress', NOW() + INTERVAL '5 days', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),

-- 山田営業のタスク
('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', '商品説明', '商品の詳細説明を実施', 'completed', NOW() + INTERVAL '1 day', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', NOW(), NOW());

-- ===== Step 8: テスト用通知データの作成 =====
INSERT INTO notifications (id, user_id, task_id, type, title, message, read, created_at) VALUES 
('b0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'task_assigned', '新しいタスクが割り当てられました', 'お客様フォローアップのタスクが割り当てられました', FALSE, NOW()),
('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'task_completed', 'タスクが完了されました', '山田営業が商品説明タスクを完了しました', FALSE, NOW());

-- ===== Step 9: 基本的なRLSポリシーの設定 =====
-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (true); -- 開発用：全てのユーザーが閲覧可能

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (true); -- 開発用：全てのユーザーが挿入可能

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (true); -- 開発用：全てのユーザーが更新可能

-- customers テーブル
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT USING (true);

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE USING (true);

-- tasks テーブル
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE USING (true);

-- task_threads テーブル
ALTER TABLE task_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_threads_select_policy" ON task_threads
    FOR SELECT USING (true);

CREATE POLICY "task_threads_insert_policy" ON task_threads
    FOR INSERT WITH CHECK (true);

-- notifications テーブル
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (true);

-- ===== Step 10: 更新タイムスタンプトリガーの作成 =====
-- 共通の更新タイムスタンプ関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 完了メッセージ =====
\echo '========================================';
\echo 'データベースリセットが完了しました';
\echo '========================================';
\echo 'テストユーザー: 6名';
\echo 'テスト顧客: 5名（面談ID重複含む）';
\echo 'テストタスク: 3件';
\echo 'テスト通知: 2件';
\echo '========================================';
\echo '管理者: admin@test.com';
\echo 'マネージャー: manager@test.com';
\echo '営業: sales1@test.com～sales4@test.com';
\echo '========================================';