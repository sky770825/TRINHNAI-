# Supabase SQL Editor 整理指南

## 問題說明

在 Supabase Dashboard 的 SQL Editor 中，可能會累積很多 SQL 查詢檔案，需要整理。

## 推薦做法：使用 Migration 系統

最好的做法是使用 **Supabase Migration 系統**，而不是直接在 SQL Editor 中執行 SQL。

### 優點
- ✅ 版本控制：所有 migration 檔案都在 Git 中
- ✅ 可追蹤：可以清楚看到每個 migration 的執行歷史
- ✅ 可重複：團隊成員可以執行相同的 migration
- ✅ 自動化：可以使用 Supabase CLI 執行

## 整理 SQL Editor 的方法

### 方法 1：清理舊查詢（推薦）

在 Supabase Dashboard 的 SQL Editor 中：

1. **刪除不需要的查詢**：
   - 點擊每個查詢檔案旁邊的「⋯」或「X」圖標
   - 選擇「Delete」刪除不需要的查詢
   - 只保留重要的查詢（例如：常用的檢查查詢）

2. **重新命名查詢**：
   - 點擊查詢名稱可以重新命名
   - 使用清晰的命名規則，例如：
     - `check_tables` - 檢查表
     - `check_roles` - 檢查角色
     - `test_query` - 測試查詢

3. **組織查詢**：
   - 將相關的查詢放在一起
   - 使用前綴來分類，例如：
     - `[Migration] create_announcements`
     - `[Check] user_roles`
     - `[Test] announcements`

### 方法 2：使用 Supabase CLI（最佳實踐）

如果還沒有安裝 Supabase CLI，建議安裝並使用：

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 或使用 Homebrew (macOS)
brew install supabase/tap/supabase

# 登入 Supabase
supabase login

# 連結到專案
supabase link --project-ref your-project-ref

# 查看 migration 狀態
supabase migration list

# 執行 migration
supabase db push
```

這樣可以：
- 直接從本地 migration 檔案執行
- 自動追蹤 migration 狀態
- 不需要在 SQL Editor 中手動執行

### 方法 3：導出重要查詢

如果 SQL Editor 中有重要的查詢想保留：

1. **導出查詢**：
   - 點擊查詢
   - 複製 SQL 內容
   - 儲存到本地的 `.sql` 檔案

2. **組織到專案中**：
   - 創建 `sql/queries/` 目錄
   - 將重要查詢儲存為 `.sql` 檔案
   - 例如：
     ```
     sql/
       queries/
         check_tables.sql
         check_roles.sql
         test_announcements.sql
     ```

## 建議的查詢清理策略

### 可以刪除的查詢
- ❌ 已經執行過的 migration SQL（應該在 migration 檔案中）
- ❌ 測試用的臨時查詢
- ❌ 失敗的查詢（如果已經修正並重新執行）
- ❌ 重複的查詢

### 應該保留的查詢
- ✅ 常用的檢查查詢（例如：檢查表是否存在）
- ✅ 重要的維護查詢（例如：清理舊資料）
- ✅ 常用的測試查詢
- ✅ 文件化的查詢（例如：示範如何使用某個功能）

## 快速清理步驟

1. **檢視所有查詢**：
   - 在 SQL Editor 中檢視所有儲存的查詢
   - 標記哪些要刪除，哪些要保留

2. **批量操作**：
   - 一次刪除多個不需要的查詢
   - 重新命名保留的查詢

3. **組織分類**：
   - 使用命名前綴分類查詢
   - 例如：`[Migration]`, `[Check]`, `[Test]`, `[Maintenance]`

## 未來建議

1. **使用 Migration 系統**：
   - 所有資料庫變更都應該在 migration 檔案中
   - 使用 Supabase CLI 執行 migration
   - 避免在 SQL Editor 中直接執行 migration SQL

2. **保留 SQL Editor 用於**：
   - 臨時查詢和測試
   - 資料檢查和除錯
   - 一次性的維護操作

3. **文件化**：
   - 重要的查詢應該有註釋說明用途
   - 在 README 或文件中記錄常用的查詢
