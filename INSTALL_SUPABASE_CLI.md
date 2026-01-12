# 安裝 Supabase CLI 指南

## 重要說明

Supabase CLI **不支援**使用 `npm install -g supabase` 全域安裝。

## 推薦安裝方式

### 方式 1：使用 Homebrew（macOS 推薦）

```bash
# 1. 安裝 Homebrew（如果還沒安裝）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安裝 Supabase CLI
brew install supabase/tap/supabase

# 3. 驗證安裝
supabase --version
```

### 方式 2：直接下載二進制檔案（不需要 Homebrew）

1. 前往 [Supabase CLI Releases](https://github.com/supabase/cli/releases)
2. 下載適合 macOS 的版本（通常是 `supabase_darwin_arm64.tar.gz` 或 `supabase_darwin_amd64.tar.gz`）
3. 解壓縮並移動到 `/usr/local/bin/`：

```bash
# 下載並解壓縮（請替換為實際的檔案名稱）
tar -xzf supabase_darwin_arm64.tar.gz

# 移動到系統路徑
sudo mv supabase /usr/local/bin/

# 驗證安裝
supabase --version
```

### 方式 3：使用 npx（臨時使用，不推薦長期使用）

雖然不支援全域安裝，但可以使用 `npx` 來執行：

```bash
# 臨時執行（不需要安裝）
npx supabase --version

# 執行 migration
npx supabase db push
```

## 使用 Supabase CLI

安裝完成後，可以使用以下命令：

### 1. 登入 Supabase

```bash
supabase login
```

### 2. 連結到專案

```bash
# 使用您的專案 ID
supabase link --project-ref iofbmtjgfphictlmczas
```

### 3. 執行 Migration

```bash
# 推送所有 migration 到 Supabase
supabase db push

# 查看 migration 狀態
supabase migration list

# 重置資料庫（危險！會刪除所有資料）
supabase db reset
```

### 4. 部署 Edge Functions

```bash
# 部署所有 functions
supabase functions deploy

# 部署特定 function
supabase functions deploy admin-leads
```

## 替代方案：使用 Supabase Dashboard SQL Editor

如果您不想安裝 CLI，也可以直接使用 Supabase Dashboard 的 SQL Editor：

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/iofbmtjgfphictlmczas)
2. 點擊左側選單的 **SQL Editor**
3. 複製 migration 檔案內容（例如：`supabase/migrations/20260112065349_create_announcements.sql`）
4. 貼上並執行

## 選擇建議

- **想要自動化管理** → 安裝 Homebrew 和 Supabase CLI（方式 1）
- **不想安裝 Homebrew** → 直接下載二進制檔案（方式 2）
- **只是偶爾使用** → 使用 Supabase Dashboard SQL Editor（不需要安裝）
- **臨時使用** → 使用 npx（方式 3）

## 當前專案狀態

您的專案已經有完整的 migration 檔案在 `supabase/migrations/` 目錄中。

**對於當前的 `announcements` migration**：
- ✅ Migration 檔案已準備好：`supabase/migrations/20260112065349_create_announcements.sql`
- ✅ 包含所有依賴檢查（會自動建立 `app_role` 和 `has_role`）
- ✅ 可以直接在 Supabase Dashboard SQL Editor 中執行

您**不需要**安裝 CLI 來執行這個 migration，可以直接使用 SQL Editor。
