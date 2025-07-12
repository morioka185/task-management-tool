-- ===== 認証エラー修正用スクリプト =====
-- 500エラーの解決

-- ===== Step 1: 現在の認証ユーザーをusersテーブルに追加 =====
-- 認証ユーザーが存在しない場合の対処

INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    '9a9cd59d-355c-4460-8003-15463e26fc36', 
    'current@user.com', 
    '現在のユーザー', 
    'admin', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ===== Step 2: RLSポリシーの一時的な緩和 =====
-- 開発中のエラーを回避するため

-- users テーブルのポリシーを更新（より緩い条件）
DROP POLICY IF EXISTS "users_select_policy" ON users;
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (true);

-- tasks テーブルのポリシーを更新（JOIN エラー回避）
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT USING (true);

-- ===== Step 3: 外部キー制約の確認と修正 =====
-- 外部キー制約名の確認と修正

-- 既存の外部キー制約を削除
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_by_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_customer_id_fkey;

-- 新しい外部キー制約を追加（適切な命名）
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES users(id);

ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES users(id);

ALTER TABLE tasks 
ADD CONSTRAINT tasks_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id);

-- ===== Step 4: 認証トリガーの設定 =====
-- auth.users に新規ユーザーが作成された際に users テーブルにも追加

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'sales'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除してから新規作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Step 5: RLS無効化（デバッグ用） =====
-- 一時的にRLSを無効化してエラーの詳細を確認

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE task_threads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

\echo '認証エラー修正スクリプトが完了しました';
\echo '現在のユーザーをusersテーブルに追加し、RLSポリシーを緩和しました';
\echo 'アプリケーションを再読み込みしてください';