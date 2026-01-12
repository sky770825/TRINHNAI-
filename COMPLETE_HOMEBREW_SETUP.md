# 完成 Homebrew 安裝指南

## 如果安裝過程中斷

如果您看到 `Press RETURN/ENTER to continue or any other key to abort:` 提示：

1. **按 RETURN/ENTER 鍵繼續安裝**
2. 等待安裝完成（約 5-10 分鐘）
3. 安裝完成後，會顯示額外的設定命令

## 安裝完成後的設定步驟

Homebrew 安裝完成後，通常會提示您執行以下命令來設定 PATH：

### 步驟 1：將 Homebrew 加入 PATH

```bash
# 對於 zsh（macOS 預設）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 步驟 2：驗證安裝

```bash
brew --version
```

如果顯示版本號（例如：`Homebrew 4.x.x`），表示安裝成功。

### 步驟 3：安裝 Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 步驟 4：驗證 Supabase CLI

```bash
supabase --version
```

## 如果 brew 命令找不到

如果執行 `brew --version` 時出現 `command not found`：

### 方法 1：手動設定 PATH（立即生效）

```bash
# 將 Homebrew 加入當前終端會話
eval "$(/opt/homebrew/bin/brew shellenv)"

# 驗證
brew --version
```

### 方法 2：永久設定 PATH

```bash
# 檢查 shell 配置檔案（zsh）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile

# 重新載入配置
source ~/.zprofile

# 或者開啟新的終端視窗
```

### 方法 3：使用完整路徑（臨時使用）

```bash
# 使用完整路徑執行 brew
/opt/homebrew/bin/brew --version

# 安裝 Supabase CLI
/opt/homebrew/bin/brew install supabase/tap/supabase
```

## 完整安裝流程

1. **執行 Homebrew 安裝**：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   - 輸入密碼
   - 按 RETURN/ENTER 繼續
   - 等待安裝完成

2. **設定 PATH**：
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

3. **驗證 Homebrew**：
   ```bash
   brew --version
   ```

4. **安裝 Supabase CLI**：
   ```bash
   brew install supabase/tap/supabase
   ```

5. **驗證 Supabase CLI**：
   ```bash
   supabase --version
   ```

6. **登入 Supabase**：
   ```bash
   supabase login
   ```

7. **連結專案**：
   ```bash
   supabase link --project-ref iofbmtjgfphictlmczas
   ```

## 快速檢查

執行以下命令檢查 Homebrew 是否已安裝：

```bash
# 檢查 Homebrew 是否存在
test -f /opt/homebrew/bin/brew && echo "Homebrew 已安裝" || echo "Homebrew 未安裝"

# 檢查 PATH 中是否有 brew
which brew || echo "brew 不在 PATH 中，需要執行：eval \"\$(/opt/homebrew/bin/brew shellenv)\""
```
