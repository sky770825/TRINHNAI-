-- 測試 has_role 函數是否存在的 SQL
-- 可以在 SQL Editor 中執行來檢查

-- 檢查函數是否存在
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 檢查 app_role 類型是否存在
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'app_role';

-- 測試函數調用（應該會失敗如果函數不存在）
SELECT public.has_role('00000000-0000-0000-0000-000000000000'::uuid, 'admin'::public.app_role);
