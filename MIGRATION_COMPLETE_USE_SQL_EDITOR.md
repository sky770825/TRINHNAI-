# Migration 自動化遇到問題 - 建議使用 SQL Editor

## 問題說明

在自動化執行 migration 時遇到了以下問題：
1. 某些 migration 已經執行過但狀態未同步（已使用 `migration repair` 修復）
2. `has_role` 函數的建立語法在 DO 區塊中有問題（已修復）
3. `has_role` 函數可能不存在或參數類型不匹配

## 推薦解決方案：使用 SQL Editor

由於 migration 執行過程中遇到多個問題，**最簡單可靠的方式是直接使用 Supabase Dashboard SQL Editor 執行 `announcements` migration**。

### 步驟 1：前往 SQL Editor

https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

### 步驟 2：執行 Announcements Migration

使用 `ANNOUNCEMENTS_MIGRATION_READY_TO_USE.sql` 檔案，它已經準備好可以直接執行：

1. 打開檔案：`ANNOUNCEMENTS_MIGRATION_READY_TO_USE.sql`
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
2. ✅ **安全可靠**：Migration 檔案包含所有依賴檢查
3. ✅ **簡單直接**：複製貼上即可執行
4. ✅ **不會影響現有表**：使用 `IF NOT EXISTS` 檢查

## 未來建議

1. **使用 Migration 系統**：所有資料庫變更都應該使用 migration
2. **保持一致**：避免手動執行 SQL 和 migration 混用
3. **定期同步**：如果手動執行了 SQL，記得使用 `migration repair` 同步狀態

## 快速執行命令

在 macOS 終端中查看 migration 檔案內容：

```bash
cd /Users/caijunchang/Desktop/程式專案資料夾/trinhnai-lovable專案
cat ANNOUNCEMENTS_MIGRATION_READY_TO_USE.sql
```

然後複製輸出到 SQL Editor 執行。
