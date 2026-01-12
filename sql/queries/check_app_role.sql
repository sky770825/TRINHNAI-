-- 檢查 app_role 類型是否存在
SELECT 
    typname AS type_name,
    typtype AS type_type,
    typlen AS type_length
FROM pg_type
WHERE typname = 'app_role';

-- 檢查 app_role 的枚舉值
SELECT 
    enumlabel AS enum_value,
    enumsortorder AS sort_order
FROM pg_enum
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'app_role'
)
ORDER BY enumsortorder;

-- 檢查 has_role 函數是否存在
SELECT 
    proname AS function_name,
    proargnames AS argument_names,
    pg_get_function_arguments(oid) AS function_arguments
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
