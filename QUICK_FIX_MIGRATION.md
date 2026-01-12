# 快速修復 Migration 問題

## 問題說明

執行 `supabase db push` 時遇到多個錯誤，因為某些表已經存在：
- `leads` 表已存在
- `bookings` 表已存在（部分欄位）

這表示資料庫中已經有一些 migration 被執行過了。

## 解決方案：只執行 Announcements Migration（推薦）

由於您的主要目標是執行 `announcements` migration，**最簡單的方式是直接使用 SQL Editor 執行它**：

### 步驟 1：前往 SQL Editor

https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

### 步驟 2：執行 Announcements Migration

1. 打開檔案：`supabase/migrations/20260112065349_create_announcements.sql`
2. 複製所有內容
3. 在 SQL Editor 中貼上
4. 點擊 **RUN** 或按 `Cmd + Enter`

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

## 為什麼推薦使用 SQL Editor？

1. ✅ **立即可用**：不需要修復 migration 狀態
2. ✅ **不會影響現有表**：`announcements` migration 包含所有依賴檢查
3. ✅ **簡單直接**：複製貼上即可執行
4. ✅ **安全**：Migration 檔案已經包含 `IF NOT EXISTS` 檢查

## 如果未來需要完全自動化

如果未來想要使用 CLI 完全自動化執行所有 migration，需要：

1. **使用 Migration Repair** 標記已執行的 migration：
   ```bash
   supabase migration repair --status applied [版本號]
   ```

2. **然後執行剩餘的 migration**：
   ```bash
   supabase db push
   ```

但這需要確定哪些 migration 已經執行過，可能比較複雜。

## 快速執行命令

在 macOS 終端中執行（快速查看 migration 檔案內容）：

```bash
cd /Users/caijunchang/Desktop/程式專案資料夾/trinhnai-lovable專案
cat supabase/migrations/20260112065349_create_announcements.sql
```

然後複製輸出到 SQL Editor 執行。
