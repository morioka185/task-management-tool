-- ===== 最適化されたデータベースリセットスクリプト =====
-- タスク管理ツール用 - requirements.md準拠
-- 実行前の注意: このスクリプトは全データを削除します。本番環境では実行しないでください。

-- トランザクション開始（全操作を一括実行）
BEGIN;

-- ===== Step 1: 外部キー制約とトリガーの一時無効化（パフォーマンス最適化） =====
SET session_replication_role = replica;

-- ===== Step 2: 既存データの完全削除（依存関係順） =====
-- 通知を削除
TRUNCATE TABLE notifications CASCADE;

-- タスクスレッドを削除
TRUNCATE TABLE task_threads CASCADE;

-- タスクを削除
TRUNCATE TABLE tasks CASCADE;

-- 顧客を削除
TRUNCATE TABLE customers CASCADE;

-- ユーザーを削除（最後に削除）
TRUNCATE TABLE users CASCADE;

-- ===== Step 3: RLS・トリガー・ポリシーの削除 =====
-- 全てのポリシーを削除（安全な削除）
DO $$
BEGIN
    -- users テーブルのポリシー削除
    DROP POLICY IF EXISTS "users_select_policy" ON users;
    DROP POLICY IF EXISTS "users_insert_policy" ON users;
    DROP POLICY IF EXISTS "users_update_policy" ON users;
    
    -- customers テーブルのポリシー削除
    DROP POLICY IF EXISTS "All authenticated users can view customers" ON customers;
    DROP POLICY IF EXISTS "All authenticated users can insert customers" ON customers;
    DROP POLICY IF EXISTS "Admins can update customers" ON customers;
    
    -- tasks テーブルのポリシー削除
    DROP POLICY IF EXISTS "Users can view their tasks" ON tasks;
    DROP POLICY IF EXISTS "Admins and managers can view all tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
    
    -- task_threads テーブルのポリシー削除
    DROP POLICY IF EXISTS "Users can view task threads" ON task_threads;
    DROP POLICY IF EXISTS "Users can insert task threads" ON task_threads;
    
    -- notifications テーブルのポリシー削除
    DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ポリシー削除中にエラーが発生しました: %', SQLERRM;
END $$;

-- トリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_task_threads_updated_at ON task_threads;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ===== Step 4: 外部キー制約の再有効化 =====
SET session_replication_role = DEFAULT;

-- ===== Step 5: テスト用ユーザーの作成（要件定義書準拠） =====
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) VALUES 
-- 営業管理（admin）
('10000000-0000-4000-8000-000000000001', 'admin@test.com', '管理者テスト', 'admin', NULL, NOW(), NOW()),

-- 営業マン（マネージャー）- 田中マネージャー
('20000000-0000-4000-8000-000000000002', 'manager@test.com', '田中マネージャー', 'manager', '10000000-0000-4000-8000-000000000001', NOW(), NOW()),

-- 営業マン（sales）- 田中マネージャーの部下
('30000000-0000-4000-8000-000000000003', 'sales1@test.com', '佐藤営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),
('30000000-0000-4000-8000-000000000004', 'sales2@test.com', '鈴木営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),
('30000000-0000-4000-8000-000000000005', 'sales3@test.com', '山田営業', 'sales', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),

-- 独立営業（管理者直下）
('30000000-0000-4000-8000-000000000006', 'sales4@test.com', '独立営業', 'sales', '10000000-0000-4000-8000-000000000001', NOW(), NOW());

-- ===== Step 6: テスト用顧客データの作成 =====
INSERT INTO customers (id, interview_id, line_name, real_name, created_at, updated_at) VALUES 
('c0000000-0000-4000-8000-000000000001', 'INT001', '田中太郎LINE', '田中太郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000002', 'INT002', '佐藤花子LINE', '佐藤花子', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000003', 'INT003', '山田次郎LINE', '山田次郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000004', 'INT004', '鈴木一郎LINE', '鈴木一郎', NOW(), NOW()),
('c0000000-0000-4000-8000-000000000005', 'INT001', '重複面談ID', '別の田中太郎', NOW(), NOW()); -- 面談ID重複テスト用

-- ===== Step 7: テスト用タスクデータの作成 =====
INSERT INTO tasks (id, customer_id, title, description, status, deadline, assigned_to, assigned_by, created_at, updated_at) VALUES 
-- 佐藤営業のタスク
('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'お客様フォローアップ', '初回面談後のフォローアップを実施してください', 'pending', NOW() + INTERVAL '3 days', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', NOW(), NOW()),

-- 鈴木営業のタスク
('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', '契約書確認', '契約書の内容確認と説明を行ってください', 'in_progress', NOW() + INTERVAL '5 days', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', NOW(), NOW()),

-- 山田営業のタスク（完了済み）
('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', '商品説明', '商品の詳細説明を実施', 'completed', NOW() + INTERVAL '1 day', '30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', NOW(), NOW());

-- ===== Step 8: テスト用通知データの作成 =====
INSERT INTO notifications (id, user_id, task_id, type, title, message, read, created_at) VALUES 
('b0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'task_assigned', '新しいタスクが割り当てられました', 'お客様フォローアップのタスクが割り当てられました', FALSE, NOW()),
('b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'task_completed', 'タスクが完了されました', '山田営業が商品説明タスクを完了しました', FALSE, NOW());

-- ===== Step 9: RLSポリシーの再設定 =====
-- users テーブルのRLS有効化とポリシー設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')));

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR 
                     EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'));

-- customers テーブルのRLS設定
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE USING (EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin')));

-- tasks テーブルのRLS設定
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (
        assigned_to::text = auth.uid()::text OR 
        assigned_by::text = auth.uid()::text OR
        EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager'))
    );

CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager'))
    );

CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE USING (
        assigned_to::text = auth.uid()::text OR 
        assigned_by::text = auth.uid()::text OR
        EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager'))
    );

-- task_threads テーブルのRLS設定
ALTER TABLE task_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_threads_select_policy" ON task_threads
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM tasks WHERE id = task_id AND 
               (assigned_to::text = auth.uid()::text OR assigned_by::text = auth.uid()::text)) OR
        EXISTS(SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager'))
    );

CREATE POLICY "task_threads_insert_policy" ON task_threads
    FOR INSERT WITH CHECK (
        user_id::text = auth.uid()::text AND
        EXISTS(SELECT 1 FROM tasks WHERE id = task_id AND 
               (assigned_to::text = auth.uid()::text OR assigned_by::text = auth.uid()::text))
    );

-- notifications テーブルのRLS設定
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- ===== Step 10: 更新タイムスタンプトリガーの再作成 =====
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

-- ===== Step 11: インデックスの再構築（パフォーマンス最適化） =====
-- 顧客検索用インデックス
CREATE INDEX IF NOT EXISTS idx_customers_interview_id ON customers(interview_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_name ON customers(line_name);
CREATE INDEX IF NOT EXISTS idx_customers_real_name ON customers(real_name);

-- タスク検索用インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);

-- 通知検索用インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- タスクスレッド検索用インデックス
CREATE INDEX IF NOT EXISTS idx_task_threads_task_id ON task_threads(task_id);

-- ===== Step 12: 統計情報の更新 =====
ANALYZE users;
ANALYZE customers;
ANALYZE tasks;
ANALYZE task_threads;
ANALYZE notifications;

-- トランザクション完了
COMMIT;

-- ===== 実行完了メッセージ =====
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'データベースリセットが完了しました';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'テストユーザー: 6名';
    RAISE NOTICE 'テスト顧客: 5名（面談ID重複含む）';
    RAISE NOTICE 'テストタスク: 3件';
    RAISE NOTICE 'テスト通知: 2件';
    RAISE NOTICE '========================================';
    RAISE NOTICE '管理者: admin@test.com';
    RAISE NOTICE 'マネージャー: manager@test.com';
    RAISE NOTICE '営業: sales1@test.com～sales4@test.com';
    RAISE NOTICE '========================================';
END $$;