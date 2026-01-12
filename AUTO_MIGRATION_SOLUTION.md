# 自動化 Migration 執行方案

## 問題

使用 `supabase db push` 時遇到錯誤，因為某些表已經存在（例如 `leads` 表）。這表示資料庫中已經有一些 migration 被執行過了。

## 自動化解決方案

### 方案 1：使用 Migration Repair（推薦，完全自動化）

標記已執行的 migration，然後執行剩餘的 migration：

```bash
cd /Users/caijunchang/Desktop/程式專案資料夾/trinhnai-lovable專案

# 標記已執行的 migration（根據 migration list 的結果，只標記已存在表的 migration）
supabase migration repair --status applied 20260111034619
supabase migration repair --status applied 20260111044408
supabase migration repair --status applied 20260111045157
supabase migration repair --status applied 20260111080127
supabase migration repair --status applied 20260111080136
supabase migration repair --status applied 20260111081420
supabase migration repair --status applied 20260111082756
supabase migration repair --status applied 20260111084637
supabase migration repair --status applied 20260111085754

# 執行剩餘的 migration（包括 announcements）
supabase db push
```

**注意**：需要確定哪些 migration 已經執行過。可以通過檢查資料庫中的表來判斷。

### 方案 2：只執行 Announcements Migration（簡單快速）

如果只想執行 `announcements` migration，可以直接使用 SQL Editor：

1. **前往 SQL Editor**：
   https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

2. **複製並執行**：
   - 打開 `supabase/migrations/20260112065349_create_announcements.sql`
   - 複製所有內容
   - 貼上並執行

這個 migration 檔案已經包含所有依賴檢查，可以安全執行。

### 方案 3：使用腳本自動執行（半自動化）

我已經建立了 `scripts/push_migrations.sh` 腳本：

```bash
chmod +x scripts/push_migrations.sh
./scripts/push_migrations.sh
```

這個腳本會：
- 檢查是否已登入
- 顯示 migration 狀態
- 提供自動化建議

## 推薦流程

對於您的情況（已經有一些 migration 執行過），**推薦使用方案 1（Migration Repair）**：

1. **先檢查哪些 migration 已執行**：
   ```bash
   supabase migration list
   ```
   
   查看哪些 migration 在 Remote 列中有時間戳（表示已執行）。

2. **標記已執行的 migration**（如果 Remote 列為空，但表已存在）：
   ```bash
   supabase migration repair --status applied [版本號]
   ```

3. **執行剩餘的 migration**：
   ```bash
   supabase db push
   ```

## 快速執行 Announcements Migration

如果只想快速執行 `announcements` migration，**使用方案 2（SQL Editor）**最簡單：

```bash
# 1. 打開 SQL Editor
# https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new

# 2. 複製 migration 內容
cat supabase/migrations/20260112065349_create_announcements.sql

# 3. 貼上並執行
```

## 未來建議

1. **使用 Migration 系統**：所有資料庫變更都應該使用 migration
2. **不要手動執行 SQL**：避免 migration 狀態不同步
3. **使用 CLI 自動化**：使用 `supabase db push` 來自動執行 migration
4. **同步狀態**：如果手動執行了 SQL，記得使用 `migration repair` 同步狀態
