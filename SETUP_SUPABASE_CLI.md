# Supabase CLI 設定指南

## ✅ 安裝完成

- ✅ Homebrew 5.0.9
- ✅ Supabase CLI 2.67.1

## 下一步：登入和連結專案

### 步驟 1：登入 Supabase

```bash
supabase login
```

這會打開瀏覽器，讓您登入 Supabase 帳號。

### 步驟 2：連結到您的專案

```bash
supabase link --project-ref iofbmtjgfphictlmczas
```

**專案 ID：** `iofbmtjgfphictlmczas`

### 步驟 3：執行 Migration

連結成功後，您可以執行 migration：

```bash
# 查看 migration 狀態
supabase migration list

# 推送所有 migration 到 Supabase
supabase db push

# 查看 migration 歷史
supabase migration list
```

## 注意事項

⚠️ **永久設定 PATH**：
如果您在新的終端視窗中執行命令，需要確保 Homebrew 在 PATH 中。

已執行：
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

在新終端視窗中，PATH 會自動設定。如果當前的終端視窗還找不到 `brew` 或 `supabase`，請執行：

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

## 快速參考

```bash
# 登入 Supabase
supabase login

# 連結專案
supabase link --project-ref iofbmtjgfphictlmczas

# 查看 migration
supabase migration list

# 執行 migration
supabase db push

# 部署 Edge Functions
supabase functions deploy
```
