# 暫時關閉後台登入（不需帳密即可進後台）

專案有開關 **VITE_SKIP_AUTH**，設為 `true` 時，`/#/admin`、`/#/crm` 不需登入即可進入。

---

## 啟用方式

### 本機開發

在專案根目錄的 `.env` 加上（或改為）：

```
VITE_SKIP_AUTH=true
```

存檔後重啟 `npm run dev`，再開 `http://localhost:8080/#/admin` 即可直接進後台。

### Cloudflare Pages（線上站）

1. Cloudflare Dashboard → Workers & Pages → 你的專案
2. **Settings** → **Environment variables**
3. 新增一筆：**Variable name** = `VITE_SKIP_AUTH`，**Value** = `true`
4. **Deployments** → 最新部署右側 **⋯** → **Retry deployment**
5. 建置完成後，打開 `https://trinhnai.pages.dev/#/admin` 即可直接進後台，不需登入。

---

## 注意

- **誰都能進後台**：啟用後任何人只要知道網址就能進 `/admin`、`/crm`，請僅在測試或內部使用。
- **要恢復登入**：把 `VITE_SKIP_AUTH` 刪掉或改為 `false`，重新部署後就會恢復登入檢查。
