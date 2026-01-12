# SQL 檔案檢查報告

## 檢查的檔案

### 1. ANNOUNCEMENTS_MIGRATION_COMPLETE.sql
- **狀態**: ✅ 已檢查
- **問題**: `has_role` 函數中使用 `::text` 轉換進行比較
- **建議**: 這是一個臨時解決方案，適用於 `user_roles.role` 可能是 `text` 或 `app_role` 類型的情況

### 2. supabase/migrations/20260111084637_468a4e20-cd71-4067-bb4d-01c8ca979330.sql
- **狀態**: ✅ 已檢查
- **內容**: 
  - 建立 `app_role` enum 類型
  - 建立 `user_roles` 表（`role` 欄位為 `app_role` 類型）
  - 建立 `has_role` 函數（參數類型為 `app_role`）
- **問題**: 無

### 3. supabase/migrations/20260112065349_create_announcements.sql
- **狀態**: ⚠️ 需要檢查
- **問題**: 
  - 註釋說 `has_role` 函數應該已存在，但實際上可能不存在
  - 使用 `CAST('admin' AS public.app_role)` 可能不匹配函數定義

## 主要問題

### 問題 1: `has_role` 函數的類型匹配

在 `20260111084637` migration 中：
- 函數定義：`has_role(_user_id uuid, _role app_role)`
- `user_roles.role` 欄位類型：`app_role`

但在 `ANNOUNCEMENTS_MIGRATION_COMPLETE.sql` 中：
- 使用 `role::text = _role::text` 進行比較（因為資料庫中實際可能是 `text` 類型）

### 問題 2: 類型轉換不一致

在不同 migration 中，`has_role` 函數的調用方式不一致：
- `20260111084637`: 使用 `'admin'`（無類型轉換）
- `20260112065349`: 使用 `CAST('admin' AS public.app_role)`
- `ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`: 使用 `'admin'`

## 建議修復

### 方案 1: 使用 ANNOUNCEMENTS_MIGRATION_COMPLETE.sql（推薦）

這個檔案：
- ✅ 包含完整的 `has_role` 函數定義
- ✅ 使用 `::text` 轉換處理類型不匹配問題
- ✅ 可以安全重複執行（idempotent）

### 方案 2: 檢查實際的資料庫結構

如果 `user_roles.role` 實際是 `app_role` 類型（符合 migration 定義），則可以：
- 移除 `::text` 轉換
- 直接使用 `role = _role` 比較

## 檢查建議

在 SQL Editor 中執行以下查詢來檢查實際結構：

```sql
-- 檢查 user_roles 表的 role 欄位類型
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'role';

-- 檢查 has_role 函數是否存在及其參數類型
SELECT 
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'has_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```
