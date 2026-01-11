# Vercel 環境變數設定指南

## 需要設定的環境變數

請在 [Vercel 專案設定](https://vercel.com/linebot/trinhnai-342f2e80/settings/environment-variables) 中新增以下兩個環境變數：

### 1. VITE_SUPABASE_URL
**值**：`https://uoymqlwjpxsspqslkezx.supabase.co`

**取得方式**：
- 前往 [Supabase Dashboard - API Settings](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api)
- 複製 **Project URL** 的值

### 2. VITE_SUPABASE_PUBLISHABLE_KEY
**值**：`sb_publishable_UtHqSHCpcgBwaZnoI54Axg_OoXJ6Hp4`

**取得方式**：
- 前往 [Supabase Dashboard - API Keys](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api-keys)
- 在 **Publishable key** 區塊複製完整的 key（以 `sb_publishable_` 開頭）

## 設定步驟

### 步驟 1：前往 Vercel 環境變數設定頁面

1. 前往 [Vercel 專案設定](https://vercel.com/linebot/trinhnai-342f2e80/settings/environment-variables)
2. 或者：
   - 前往專案 Dashboard
   - 點擊左側選單 **Settings**
   - 點擊 **Environment Variables**

### 步驟 2：新增環境變數

點擊 **Add New** 按鈕，依序新增：

#### 變數 1：VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://uoymqlwjpxsspqslkezx.supabase.co`
- **Environment**: 勾選以下選項
  - ✅ Production
  - ✅ Preview
  - ⬜ Development（可選）

#### 變數 2：VITE_SUPABASE_PUBLISHABLE_KEY
- **Key**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value**: `sb_publishable_UtHqSHCpcgBwaZnoI54Axg_OoXJ6Hp4`
- **Environment**: 勾選以下選項
  - ✅ Production
  - ✅ Preview
  - ⬜ Development（可選）

### 步驟 3：儲存並重新部署

1. 點擊 **Save** 儲存所有環境變數
2. **重要**：必須重新部署才能讓環境變數生效

**重新部署方式**：
- **方式 A（推薦）**：推送新的 commit 觸發自動部署
- **方式 B**：前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)，點擊最新部署的 **⋯** → **Redeploy**

## 確認設定

### 方法 1：檢查環境變數列表

在環境變數設定頁面，確認可以看到：
- ✅ `VITE_SUPABASE_URL` = `https://uoymqlwjpxsspqslkezx.supabase.co`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_UtHqSHCpcgBwaZnoI54Axg_OoXJ6Hp4`

### 方法 2：檢查建置日誌

1. 前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 點擊最新的部署
3. 查看 **Build Logs**
4. 確認沒有環境變數相關的錯誤

### 方法 3：測試網站功能

重新部署後，測試以下功能：

1. **表單提交**
   - 前往網站首頁
   - 填寫預約表單
   - 提交表單
   - 檢查是否成功（應該會連接到 Supabase）

2. **檢查瀏覽器控制台**
   - 按 F12 開啟開發者工具
   - 前往 Console 標籤
   - 確認沒有以下錯誤：
     - ❌ "Missing Supabase environment variables..."
     - ❌ "Invalid API key"

## 常見問題

### Q: 環境變數設定後網站還是無法連線？

**A**: 環境變數設定後，必須重新部署才能生效。請確認已執行重新部署。

### Q: 如何確認環境變數是否正確載入？

**A**: 
1. 查看建置日誌，確認沒有錯誤
2. 測試實際功能（如表單提交）
3. 檢查瀏覽器控制台是否有錯誤訊息

### Q: 可以只設定 Production 環境嗎？

**A**: 可以，但建議同時設定 Preview 環境，這樣 Pull Request 的預覽部署也能正常運作。

### Q: Development 環境需要設定嗎？

**A**: 如果需要本地開發時也使用這些環境變數，可以建立 `.env.local` 檔案（不要提交到 Git）。

## 注意事項

1. **不要使用 Secret Key**
   - ✅ 使用 **Publishable key**（以 `sb_publishable_` 開頭）
   - ❌ 不要使用 **Secret key**（以 `sb_secret_` 開頭）

2. **環境變數名稱大小寫敏感**
   - 必須完全符合：`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`
   - 不能有空格或多餘的引號

3. **值不能有引號**
   - ❌ 錯誤：`"https://uoymqlwjpxsspqslkezx.supabase.co"`
   - ✅ 正確：`https://uoymqlwjpxsspqslkezx.supabase.co`

## 快速複製區

### VITE_SUPABASE_URL
```
https://uoymqlwjpxsspqslkezx.supabase.co
```

### VITE_SUPABASE_PUBLISHABLE_KEY
```
sb_publishable_UtHqSHCpcgBwaZnoI54Axg_OoXJ6Hp4
```
