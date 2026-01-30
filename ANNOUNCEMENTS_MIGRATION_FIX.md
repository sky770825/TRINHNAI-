# 公告 Migration 執行指南

## 問題診斷

如果遇到 `type "app_role" does not exist` 錯誤，這表示 `app_role` 類型尚未建立。

## 解決方案

### 方法 1：確保依賴的 Migration 已執行（推薦）

`announcements` 表依賴於 `app_role` 類型，該類型在以下 migration 中建立：
- `20260111084637_468a4e20-cd71-4067-bb4d-01c8ca979330.sql`

**步驟：**
1. 前往 Supabase Dashboard → SQL Editor
2. 檢查是否已執行上述 migration（查看 Migration History）
3. 如果未執行，請先執行該 migration
4. 然後再執行 `20260112065349_create_announcements.sql`

### 方法 2：手動建立 app_role 類型（如果方法 1 失敗）

如果 `app_role` 類型確實不存在，請先執行以下 SQL：

```sql
-- 建立 app_role 類型（如果不存在）
g

然後再執行完整的 `20260112065349_create_announcements.sql` migration。

### 方法 3：使用簡化版本（不依賴 has_role 函數）

如果上述方法都失敗，可以使用以下簡化版本，直接檢查 user_roles 表：

```sql
-- 簡化版本：直接檢查 user_roles 表
CREATE POLICY "Admins can view all announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
);
```

## 檢查 Migration 狀態

在 Supabase Dashboard 中：
1. 前往 Database → Migrations
2. 檢查以下 migration 是否已執行：
   - `20260111084637_468a4e20-cd71-4067-bb4d-01c8ca979330.sql`（建立 app_role 和 has_role 函數）
   - `20260112065349_create_announcements.sql`（建立 announcements 表）

## 驗證

執行以下 SQL 檢查類型是否存在：

```sql
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'app_role';
```

如果返回結果，表示類型存在；如果沒有結果，表示類型不存在，需要先執行建立類型的 migration。
