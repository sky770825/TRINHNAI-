# SQL 檔案檢查總結

## 檢查結果

### 發現的問題

1. **ANNOUNCEMENTS_MIGRATION_COMPLETE.sql**：
   - ❌ `has_role` 函數使用 `role::text = _role::text` 進行比較
   - ❌ 這表示假設 `user_roles.role` 是 `text` 類型，但實際應該是 `app_role` 類型

2. **supabase/migrations/20260112065349_create_announcements.sql**：
   - ❌ 使用 `CAST('admin' AS public.app_role)` 調用 `has_role`
   - ❌ 但函數定義的參數類型是 `app_role`（沒有 `public.` 前綴）
   - ✅ 在其他 migration（`20260111084637`）中使用 `'admin'`（無類型轉換）

### 正確的定義（從 20260111084637 migration）

```sql
-- 函數定義
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role  -- 直接比較，不需要 ::text 轉換
  )
$$;

-- 函數調用（在 RLS policy 中）
USING (public.has_role(auth.uid(), 'admin'));  -- 使用 'admin'，無類型轉換
```

### 修復方案

已創建 `ANNOUNCEMENTS_MIGRATION_FINAL.sql`，包含：
- ✅ 與 `20260111084637` migration 完全一致的 `has_role` 函數定義
- ✅ 使用 `'admin'` 調用函數（無類型轉換，與其他 migration 一致）
- ✅ 直接使用 `role = _role` 比較（不需要 `::text` 轉換）

## 推薦使用的檔案

**使用 `ANNOUNCEMENTS_MIGRATION_FINAL.sql`**：
- ✅ 與現有 migration 定義完全一致
- ✅ 使用標準的 PostgreSQL enum 類型比較
- ✅ 不需要類型轉換
- ✅ 可以安全重複執行（idempotent）

## 檔案對比

| 檔案 | has_role 函數定義 | 函數調用 | 狀態 |
|------|------------------|---------|------|
| `20260111084637` | `role = _role` | `'admin'` | ✅ 正確（標準定義） |
| `ANNOUNCEMENTS_MIGRATION_COMPLETE.sql` | `role::text = _role::text` | `'admin'` | ⚠️ 使用 text 轉換 |
| `ANNOUNCEMENTS_MIGRATION_FINAL.sql` | `role = _role` | `'admin'` | ✅ 正確（與標準一致） |

## 執行建議

1. **使用 `ANNOUNCEMENTS_MIGRATION_FINAL.sql`**：
   - 前往 Supabase Dashboard SQL Editor
   - 複製 `ANNOUNCEMENTS_MIGRATION_FINAL.sql` 的內容
   - 貼上並執行

2. **如果遇到類型錯誤**：
   - 可能是 `user_roles.role` 欄位實際是 `text` 類型（不符合 migration 定義）
   - 在這種情況下，可以使用 `ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`（使用 `::text` 轉換）
