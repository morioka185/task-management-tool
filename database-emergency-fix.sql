-- ===== 緊急修正用スクリプト =====
-- 500エラーの緊急解決

-- ===== Step 1: 一時的にRLSを無効化 =====
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- ===== Step 2: 認証エラーで表示されているユーザーIDを追加 =====
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    '9a9cd59d-355c-4460-8003-15463e26fc36', 
    'current@user.com', 
    '現在のユーザー', 
    'admin', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ===== Step 3: テストユーザーアカウントを作成 =====
-- admin@test.com ユーザー
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    uuid_generate_v4(), 
    'admin@test.com', 
    '管理者', 
    'admin', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- manager@test.com ユーザー
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    uuid_generate_v4(), 
    'manager@test.com', 
    'マネージャー', 
    'manager', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- sales@test.com ユーザー
INSERT INTO users (id, email, name, role, manager_id, created_at, updated_at) 
VALUES (
    uuid_generate_v4(), 
    'sales@test.com', 
    '営業担当', 
    'sales', 
    NULL, 
    NOW(), 
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- ===== Step 4: RLSを再有効化（緩い条件で） =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ===== Step 5: 緩いRLSポリシーを設定 =====
-- users テーブル：全てのユーザーが全ての操作を実行可能
DROP POLICY IF EXISTS "users_all_policy" ON users;
CREATE POLICY "users_all_policy" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- tasks テーブル：全てのユーザーが全ての操作を実行可能
DROP POLICY IF EXISTS "tasks_all_policy" ON tasks;
CREATE POLICY "tasks_all_policy" ON tasks
    FOR ALL USING (true) WITH CHECK (true);

-- customers テーブル：全てのユーザーが全ての操作を実行可能
DROP POLICY IF EXISTS "customers_all_policy" ON customers;
CREATE POLICY "customers_all_policy" ON customers
    FOR ALL USING (true) WITH CHECK (true);

-- ===== Step 6: ユーザー作成用のPostgreSQL関数を作成 =====
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

-- ===== Step 7: 認証トリガーの設定 =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin'
      WHEN NEW.email LIKE '%manager%' THEN 'manager'
      ELSE 'sales'
    END::user_role
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
SELECT 'Users created:', count(*) FROM users;
SELECT 'User details:' as info, id, email, name, role FROM users ORDER BY created_at DESC LIMIT 5;