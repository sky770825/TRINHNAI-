-- 檢查 user_roles 表的實際結構
-- 在 SQL Editor 中執行此查詢來檢查 role 欄位的類型

-- 檢查 user_roles 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_roles';

-- 檢查 role 欄位的類型
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'role';

-- 如果 role 是 text 類型，我們需要知道如何處理
