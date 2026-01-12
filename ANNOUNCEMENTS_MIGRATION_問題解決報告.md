# Announcements Migration 問題解決報告

## 📋 問題概述

在執行 `announcements` 表的 migration 時，遇到 PostgreSQL 類型不匹配錯誤，導致 migration 無法執行。

## 🔍 問題詳情

### 錯誤訊息

```
Error: Failed to run sql query: 
ERROR: 42883: operator does not exist: text = app_role 
LINE 25: AND role = _role 
       ^ 
HINT: No operator matches the given name and argument types. 
You might need to add explicit type casts.
```

### 問題根源

1. **類型定義不一致**：
   - 在 migration `20260111084637` 中，`user_roles` 表的 `role` 欄位被定義為 `app_role` enum 類型
   - 但實際資料庫中，`user_roles.role` 欄位可能是 `text` 類型（可能在 migration 執行前就存在，或 migration 未正確執行）

2. **`has_role` 函數的類型假設**：
   - 原始函數定義假設 `user_roles.role` 是 `app_role` 類型
   - 函數使用 `role = _role` 進行直接比較
   - 當實際類型是 `text` 時，PostgreSQL 無法直接比較 `text` 和 `app_role` 類型

## 🔧 解決方案

### 方案 1：使用類型轉換（已採用）

修改 `has_role` 函數，使用 `::text` 轉換將兩邊都轉換為 `text` 類型進行比較：

```sql
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
      AND role::text = _role::text  -- 使用 ::text 轉換
  )
$$;
```

**優點**：
- ✅ 無論 `user_roles.role` 是 `text` 還是 `app_role` 類型都能工作
- ✅ 相容性好，可以處理類型不一致的情況
- ✅ 不需要修改現有資料庫結構

**缺點**：
- ⚠️ 不是最理想的解決方案（理想情況是類型一致）
- ⚠️ 如果 `user_roles.role` 是 `app_role` 類型，轉換會增加少量開銷

### 方案 2：統一類型定義（未採用）

將 `user_roles.role` 欄位修改為 `app_role` 類型：

```sql
-- 需要先將現有資料轉換
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE app_role USING role::text::app_role;
```

**優點**：
- ✅ 類型一致，符合設計規範
- ✅ 不需要類型轉換，性能更好

**缺點**：
- ⚠️ 需要修改現有資料庫結構
- ⚠️ 如果現有資料不符合 enum 值，可能導致資料丟失
- ⚠️ 風險較高

## 📝 解決過程

### 階段 1：初始錯誤

- **錯誤**：`function public.has_role(uuid, unknown) does not exist`
- **原因**：`'admin'` 字串未明確轉換為 `app_role` 類型
- **修復**：在 RLS policy 中使用 `CAST('admin' AS public.app_role)`

### 階段 2：類型不匹配錯誤

- **錯誤**：`operator does not exist: text = app_role`
- **原因**：`user_roles.role` 實際是 `text` 類型，但函數參數是 `app_role` 類型
- **修復**：在函數內部使用 `::text` 轉換進行比較

### 階段 3：檔案混淆

- **錯誤**：`syntax error at or near "#"`
- **原因**：複製了 Markdown 檔案（`.md`）而不是 SQL 檔案（`.sql`）
- **修復**：使用正確的 SQL 檔案 `ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`

## ✅ 最終解決方案

使用 **`ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`** 檔案，包含：

1. ✅ `app_role` enum 類型的建立（如果不存在）
2. ✅ `has_role` 函數的建立（使用 `::text` 轉換）
3. ✅ `announcements` 表的建立
4. ✅ RLS policies 的建立
5. ✅ 索引和觸發器的建立

## 📚 相關檔案

### 主要檔案

1. **`ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`**（✅ 推薦使用）
   - 包含完整的 migration SQL
   - 使用 `::text` 轉換處理類型不匹配問題
   - 可直接在 Supabase SQL Editor 執行

2. **`ANNOUNCEMENTS_MIGRATION_FINAL.sql`**（備用）
   - 與標準 migration 定義完全一致
   - 使用直接比較（假設類型一致）
   - 如果類型已統一，可以使用此版本

3. **`supabase/migrations/20260112065349_create_announcements.sql`**
   - 標準 migration 檔案
   - 依賴 `has_role` 函數已存在
   - 用於 Supabase CLI `db push`

### 文檔檔案

- `SQL_REVIEW_SUMMARY.md`：SQL 檔案檢查總結
- `SQL_FILES_REVIEW.md`：詳細的 SQL 檔案檢查報告
- `ANNOUNCEMENTS_MIGRATION_FIX.md`：問題修復指南
- `執行步驟.md`：執行 migration 的步驟說明

## 🎯 關鍵學習點

1. **類型一致性很重要**：
   - 確保 migration 定義與實際資料庫結構一致
   - 如果類型不一致，需要使用類型轉換

2. **錯誤訊息分析**：
   - PostgreSQL 的錯誤訊息通常很明確
   - `operator does not exist` 通常表示類型不匹配
   - 使用 `HINT` 來獲得解決建議

3. **檔案類型區分**：
   - `.sql` 檔案：SQL 語句，用於執行
   - `.md` 檔案：Markdown 文檔，用於閱讀
   - 確保複製正確的檔案類型

4. **漸進式解決問題**：
   - 先解決最明顯的錯誤
   - 逐步深入分析根本原因
   - 使用多個版本作為備用方案

## 📊 問題統計

- **總錯誤次數**：3 次
- **解決時間**：約 30 分鐘
- **涉及的檔案**：5 個 SQL 檔案，4 個文檔檔案
- **最終狀態**：✅ 問題已解決

## 🔮 未來建議

1. **統一資料庫結構**：
   - 考慮在適當的時候將 `user_roles.role` 統一為 `app_role` 類型
   - 這樣可以移除類型轉換，提高性能和可維護性

2. **Migration 測試**：
   - 在執行 migration 前，先檢查實際資料庫結構
   - 使用 `information_schema` 查詢欄位類型

3. **文檔整理**：
   - 保持 migration 檔案的清晰註釋
   - 記錄已知的類型不一致問題

## ✅ 驗證步驟

執行 migration 後，驗證：

1. ✅ `announcements` 表已建立
2. ✅ `has_role` 函數正常工作
3. ✅ RLS policies 已建立
4. ✅ 可以在 CRM 後台新增公告
5. ✅ 前端可以顯示公告

---

**報告生成時間**：2026-01-12  
**問題狀態**：✅ 已解決  
**最終使用檔案**：`ANNOUNCEMENTS_MIGRATION_COMPLETE.sql`
