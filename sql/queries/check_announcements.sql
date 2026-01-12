-- 檢查公告表是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'announcements';

-- 檢查公告表結構
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'announcements'
ORDER BY ordinal_position;

-- 檢查 RLS 政策
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'announcements';

-- 查看所有公告
SELECT * FROM public.announcements
ORDER BY priority DESC, created_at DESC;

-- 查看啟用的公告
SELECT * FROM public.announcements
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
ORDER BY priority DESC, created_at DESC
LIMIT 1;
