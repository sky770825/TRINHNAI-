# 快速執行公告 Migration

## 為什麼無法在 Cursor 中安裝 Homebrew？

Homebrew 安裝需要：
- 互動式輸入密碼（需要管理員權限）
- 非互動式環境無法執行

## 解決方案：直接使用 SQL Editor

您**不需要**安裝 Homebrew 或 Supabase CLI 就可以執行 migration！

### 步驟 1：打開 Supabase Dashboard SQL Editor

前往：https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

### 步驟 2：複製 Migration SQL

打開專案中的檔案：
- `ANNOUNCEMENTS_MIGRATION_READY_TO_USE.sql`

或者直接複製 `supabase/migrations/20260112065349_create_announcements.sql` 的內容

### 步驟 3：貼上並執行

1. 在 SQL Editor 中貼上完整的 SQL
2. 點擊 **RUN** 按鈕（或按 `Cmd + Enter`）
3. 等待執行完成

### 步驟 4：驗證

執行以下 SQL 檢查表是否建立成功：

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

## Migration 說明

這個 migration 會：
- ✅ 自動檢查並建立 `app_role` 類型（如果不存在）
- ✅ 自動檢查並建立 `has_role` 函數（如果不存在）
- ✅ 建立 `announcements` 表
- ✅ 設定 RLS（Row Level Security）政策
- ✅ 建立索引和觸發器

**可以重複執行**（idempotent），不會出錯。

## 執行完成後

1. **在 CRM 後台新增公告**：
   - 前往 `/crm` 頁面
   - 點擊「公告管理」標籤頁
   - 點擊「新增公告」按鈕
   - 填寫標題、內容等資訊
   - 儲存

2. **前端自動顯示**：
   - 前端會自動從資料庫讀取啟用的公告
   - 在首頁載入時顯示彈窗

## 如果之後想要安裝 Homebrew

如果您之後想要使用 Supabase CLI 來管理 migration，可以：

1. 打開 **macOS 終端機（Terminal）**
2. 執行安裝命令（需要輸入密碼）：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. 安裝 Supabase CLI：
   ```bash
   brew install supabase/tap/supabase
   ```

但對於執行 migration，**直接使用 SQL Editor 是最簡單的方式**。
