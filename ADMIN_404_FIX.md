# 後台管理頁面 404 錯誤修復指南

## 問題描述

訪問 `/admin` 路由時出現：
```
404: NOT_FOUND
Code: NOT_FOUND
ID: hkg1::dn5pq-1768134448994-5f7f003ac3bf
```

## 問題分析

### 原因
Vercel 的 rewrites 配置可能沒有正確生效，導致直接訪問 `/admin` 時返回 Vercel 的 404 錯誤頁面，而不是 React 應用的內容。

### 已修復
已更新 `vercel.json` 配置，使用更標準的格式：
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

## 解決步驟

### 步驟 1：提交並推送變更

```bash
git add vercel.json
git commit -m "Fix: Update Vercel rewrites configuration for admin routes"
git push
```

### 步驟 2：等待部署完成

1. 前往 [Vercel Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 等待新的部署完成（狀態變為 "Ready"）
3. 通常需要 1-2 分鐘

### 步驟 3：測試路由

部署完成後，測試以下路由：

1. **首頁**：https://trinhnai-342f2e80.vercel.app/
   - ✅ 應該正常顯示

2. **登入頁面**：https://trinhnai-342f2e80.vercel.app/auth
   - ✅ 應該顯示登入頁面（不是 404）

3. **管理後台**：https://trinhnai-342f2e80.vercel.app/admin
   - ✅ 應該重定向到登入頁面（如果未登入）
   - ✅ 或顯示管理後台（如果已登入且為管理員）

4. **CRM 頁面**：https://trinhnai-342f2e80.vercel.app/crm
   - ✅ 應該重定向到登入頁面（如果未登入）
   - ✅ 或顯示 CRM 頁面（如果已登入且為管理員）

## 預期行為

### 未登入時訪問 /admin
- 應該重定向到 `/auth` 登入頁面
- 不應該顯示 404 錯誤

### 已登入但非管理員時訪問 /admin
- 應該顯示「權限不足」頁面
- 提供「返回首頁」和「切換帳號」選項

### 已登入且為管理員時訪問 /admin
- 應該顯示管理後台頁面
- 可以查看和管理預約資料

## 如果問題仍然存在

### 檢查 1：確認配置已更新
1. 在 Vercel Dashboard 查看部署日誌
2. 確認 `vercel.json` 已被包含在部署中

### 檢查 2：清除快取
1. 使用無痕模式瀏覽器訪問
2. 或清除瀏覽器快取後重新訪問

### 檢查 3：確認部署狀態
1. 前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 確認最新部署狀態為 "Ready"
3. 檢查建置日誌是否有錯誤

### 檢查 4：手動重新部署
如果自動部署沒有生效：
1. 前往 [Deployments](https://vercel.com/linebot/trinhnai-342f2e80/deployments)
2. 點擊最新部署的 **⋯** 選單
3. 選擇 **Redeploy**

## 技術說明

### Rewrites vs Redirects

**Rewrites**（我們使用的）：
- 將請求重寫到 `/index.html`
- URL 不會改變（瀏覽器仍顯示 `/admin`）
- 讓 React Router 處理路由

**Redirects**（不適用）：
- 會改變 URL
- 不適用於 SPA 路由

### 配置格式說明

```json
{
  "rewrites": [
    {
      "source": "/:path*",           // 匹配所有路徑
      "destination": "/index.html"   // 重寫到 index.html
    }
  ]
}
```

- `/:path*` 匹配所有路徑（包括 `/admin`、`/auth` 等）
- 所有請求都會被重寫到 `/index.html`
- React Router 會根據 URL 顯示對應的頁面

## 參考資料

- [Vercel Rewrites 文檔](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
- [Vercel SPA 路由配置](https://vercel.com/docs/concepts/routing/routing-behavior)
