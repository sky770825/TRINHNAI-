# 執行 Migration 的方式

## 方式 1：使用 Supabase CLI（如果連結成功）

如果 `supabase link` 成功，可以執行：

```bash
cd /Users/caijunchang/Desktop/程式專案資料夾/trinhnai-lovable專案
supabase db push
```

## 方式 2：使用 SQL Editor（推薦，最簡單）

如果 CLI 連結遇到權限問題，可以直接使用 Supabase Dashboard SQL Editor：

### 步驟 1：前往 SQL Editor

https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

### 步驟 2：執行 Announcements Migration

複製 `ANNOUNCEMENTS_MIGRATION_READY_TO_USE.sql` 的內容（或 `supabase/migrations/20260112065349_create_announcements.sql`），貼上並執行。

### 步驟 3：驗證

執行以下 SQL 檢查：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'announcements';

-- 查看表結構
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'announcements';
```

## 方式 3：使用 Database URL（如果可用）

如果有資料庫連接字串，可以嘗試：

```bash
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.iofbmtjgfphictlmczas.supabase.co:5432/postgres"
```

但需要知道資料庫密碼。

## 推薦方案

**推薦使用方式 2（SQL Editor）**，因為：
- ✅ 不需要額外權限設定
- ✅ 立即可用
- ✅ 可以直接看到執行結果
- ✅ Migration 檔案已經包含所有依賴檢查
