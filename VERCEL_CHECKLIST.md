# Vercel 部署檢查清單

您的 Vercel 專案：[trinhnai-342f2e80](https://vercel.com/linebot/trinhnai-342f2e80)

## ✅ 必須完成的設定

### 1. 環境變數設定

前往 [Vercel 專案設定](https://vercel.com/linebot/trinhnai-342f2e80/settings/environment-variables) 確認以下環境變數已設定：

#### 必要環境變數：

- ✅ `VITE_SUPABASE_URL`
  - 取得方式：前往 [Supabase Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api)
  - 複製 **Project URL** 欄位的值
  - 格式：`https://xxxxx.supabase.co`

- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
  - 取得方式：前往 [Supabase Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api)
  - 複製 **anon public** key
  - 格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 設定環境變數步驟：

1. 前往 Vercel 專案設定頁面
2. 點擊左側選單的 **Settings** → **Environment Variables**
3. 新增上述兩個環境變數
4. 確認環境選擇：
   - ✅ Production
   - ✅ Preview
   - ✅ Development（可選）
5. 點擊 **Save**
6. **重新部署**專案（重要！）

### 2. 重新部署

設定環境變數後，必須重新部署才能生效：

**方式 A：從 Vercel Dashboard**
1. 前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 點擊最新的部署記錄右上角的 **⋯** 選單
3. 選擇 **Redeploy**

**方式 B：推送新的 commit**
```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

### 3. 檢查部署狀態

前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments) 確認：

- ✅ 最新部署狀態為 **Ready**
- ✅ 沒有 Build Errors
- ✅ 部署時間顯示正常

### 4. 測試網站功能

訪問您的部署 URL（通常是：`https://trinhnai-342f2e80.vercel.app`）測試：

- ✅ 網站可以正常開啟
- ✅ 沒有控制台錯誤（按 F12 查看）
- ✅ Supabase 連線正常
- ✅ 表單提交功能正常
- ✅ 登入/註冊功能正常

### 5. 自訂網域（可選）

如需設定自訂網域：

1. 前往 **Settings** → **Domains**
2. 輸入您的網域
3. 按照指示設定 DNS 記錄

## 🔍 常見問題排查

### 問題 1：網站顯示空白或錯誤

**可能原因：**
- 環境變數未設定
- 環境變數設定錯誤
- 需要重新部署

**解決方法：**
1. 檢查環境變數是否正確設定
2. 確認變數名稱完全正確（大小寫敏感）
3. 重新部署專案
4. 檢查瀏覽器控制台錯誤訊息

### 問題 2：Supabase 連線失敗

**可能原因：**
- `VITE_SUPABASE_URL` 或 `VITE_SUPABASE_PUBLISHABLE_KEY` 錯誤
- Supabase 專案已暫停或刪除

**解決方法：**
1. 確認 Supabase 專案狀態：[Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx)
2. 重新複製環境變數並更新
3. 檢查 Supabase 專案是否正常運作

### 問題 3：Build 失敗

**可能原因：**
- 依賴套件問題
- 建置命令錯誤
- Node.js 版本不匹配

**解決方法：**
1. 檢查 [Build Logs](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 確認本地可以成功執行 `npm run build`
3. 檢查 `package.json` 中的 Node.js 版本要求

### 問題 4：路由無法正常運作

**可能原因：**
- `vercel.json` 中的 rewrites 設定有問題
- SPA 路由需要特殊設定

**解決方法：**
- 已設定 `vercel.json` 處理所有路由到 `index.html`，應該可以正常運作

## 📊 監控與日誌

### 查看部署日誌

前往 [Logs](https://vercel.com/linebot/trinhnai-342f2e80/logs) 查看即時日誌

### 查看分析數據

前往 [Analytics](https://vercel.com/linebot/trinhnai-342f2e80/analytics) 查看網站流量和使用情況

## 🎯 下一步

部署完成後：

1. ✅ 測試所有功能
2. ✅ 設定自訂網域（如需要）
3. ✅ 部署 Supabase Edge Functions（如需後端功能）
4. ✅ 設定監控告警（可選）

## 📝 快速指令

```bash
# 本地建置測試
npm run build
npm run preview

# 檢查環境變數（需在 Vercel Dashboard 設定）
echo "VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY 需在 Vercel 設定"
```
