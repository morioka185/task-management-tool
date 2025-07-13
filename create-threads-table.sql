-- ===== タスクスレッド機能のためのテーブル作成 =====

-- task_threadsテーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS task_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_task_threads_task_id ON task_threads(task_id);
CREATE INDEX IF NOT EXISTS idx_task_threads_created_at ON task_threads(created_at DESC);

-- RLSの設定（既存のパターンに合わせて無効化）
ALTER TABLE task_threads DISABLE ROW LEVEL SECURITY;