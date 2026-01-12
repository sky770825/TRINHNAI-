# 自動化 Migration 執行指南

## 問題說明

使用 `supabase db push` 時遇到錯誤，因為某些表已經存在（例如 `leads` 表）。這表示資料庫中已經有一些 migration 被執行過了。

## 解決方案：同步 Migration 狀態

### 方案 1：使用 Migration Repair（推薦）

如果資料庫中已經有一些 migration 被執行，我們需要先修復 migration 狀態：

```bash
cd /Users/caijunchang/Desktop/程式專案資料夾/trinhnai-lovable專案

# 修復 migration 狀態（標記已執行的 migration）
supabase migration repair --status applied 20260111034619
supabase migration repair --status applied 20260111044408
# ... 等等，標記所有已經在資料庫中執行的 migration

# 或者使用自動修復（如果有）
supabase migration repair --auto
```

### 方案 2：直接執行新的 Migration（只執行 announcements）

如果只想執行 `announcements` migration，可以使用以下方式：

#### 方式 A：使用 SQL Editor（最簡單）

1. 前往：https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new
2. 複製 `supabase/migrations/20260112065349_create_announcements.sql` 的內容
3. 貼上並執行

#### 方式 B：使用 Supabase CLI + 直接 SQL 執行

```bash
# 如果支援直接執行 SQL 檔案
supabase db execute --file supabase/migrations/20260112065349_create_announcements.sql
```

### 方案 3：重置並重新執行所有 Migration（⚠️ 危險！）

**警告：這會刪除所有資料！**

```bash
# 重置資料庫（會刪除所有資料）
supabase db reset

# 然後執行所有 migration
supabase db push
```

## 自動化腳本

我已經建立了一個自動化腳本 `scripts/execute_announcements_migration.sh`，但需要設定資料庫連線資訊。

### 使用腳本（需要資料庫連線資訊）

```bash
# 設定資料庫連線（從 Supabase Dashboard 取得）
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.iofbmtjgfphictlmczas.supabase.co:5432/postgres"

# 執行腳本
chmod +x scripts/execute_announcements_migration.sh
./scripts/execute_announcements_migration.sh
```

## 推薦方案

對於您的情況（已經有一些 migration 執行過），**推薦使用方案 1（Migration Repair）**：

1. 先修復 migration 狀態，標記已執行的 migration
2. 然後執行 `supabase db push` 來執行剩餘的 migration

或者，如果只想執行 `announcements` migration，**使用方案 2 的方式 A（SQL Editor）**最簡單。

## 檢查 Migration 狀態

```bash
# 查看本地 migration 列表
supabase migration list

# 查看遠端 migration 狀態（如果有連結）
supabase migration list --db-url "postgresql://..."
```

## 未來建議

1. **使用 Migration 系統**：所有資料庫變更都應該使用 migration
2. **不要手動執行 SQL**：避免 migration 狀態不同步
3. **定期同步**：如果手動執行了 SQL，記得使用 `migration repair` 同步狀態
