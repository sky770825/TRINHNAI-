# Homebrew 和 Supabase CLI 安裝指南

## 安裝步驟

### 步驟 1：安裝 Homebrew

請在**終端機（Terminal）**中執行以下命令：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**注意事項：**
- 安裝過程會要求輸入您的 macOS 密碼（需要管理員權限）
- 安裝時間約 5-10 分鐘
- 安裝完成後，可能會提示您執行額外命令將 Homebrew 加入 PATH

**如果安裝完成後提示執行額外命令，例如：**
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

請按照提示執行這些命令。

### 步驟 2：驗證 Homebrew 安裝

安裝完成後，執行以下命令驗證：

```bash
brew --version
```

如果顯示版本號，表示安裝成功。

### 步驟 3：安裝 Supabase CLI

安裝 Homebrew 後，執行以下命令安裝 Supabase CLI：

```bash
brew install supabase/tap/supabase
```

### 步驟 4：驗證 Supabase CLI 安裝

執行以下命令驗證：

```bash
supabase --version
```

如果顯示版本號，表示安裝成功。

### 步驟 5：登入 Supabase

```bash
supabase login
```

這會打開瀏覽器，讓您登入 Supabase 帳號。

### 步驟 6：連結到您的專案

```bash
supabase link --project-ref iofbmtjgfphictlmczas
```

**專案 ID：** `iofbmtjgfphictlmczas`

## 使用 Supabase CLI 執行 Migration

連結成功後，您可以執行 migration：

```bash
# 查看 migration 狀態
supabase migration list

# 推送所有 migration 到 Supabase
supabase db push

# 查看 migration 歷史
supabase migration list
```

## 故障排除

### 如果 Homebrew 安裝失敗

1. 檢查您的網路連線
2. 確保您有管理員權限
3. 檢查是否已經安裝了 Homebrew：
   ```bash
   which brew
   ```

### 如果 Supabase CLI 安裝失敗

1. 確保 Homebrew 已正確安裝：
   ```bash
   brew --version
   ```

2. 更新 Homebrew：
   ```bash
   brew update
   ```

3. 重新嘗試安裝：
   ```bash
   brew install supabase/tap/supabase
   ```

### 如果連結專案失敗

1. 確保您已登入：
   ```bash
   supabase login
   ```

2. 確認專案 ID 正確（`iofbmtjgfphictlmczas`）

3. 確認您在 Supabase Dashboard 中有該專案的訪問權限

## 快速參考

```bash
# 安裝 Homebrew（需要在終端機執行）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝 Supabase CLI
brew install supabase/tap/supabase

# 登入
supabase login

# 連結專案
supabase link --project-ref iofbmtjgfphictlmczas

# 執行 migration
supabase db push
```
