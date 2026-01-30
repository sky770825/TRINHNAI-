# Git 與 Cloudflare 部署檢查

## 一、Git 檢查結果 ✅

| 項目 | 狀態 |
|------|------|
| **分支** | `main`，與 `origin/main` 同步 |
| **最新 commit** | `8eda004` — feat: API 層模組化、admin-leads 封裝、DEV_RLS、文件與型別整理 |
| **未提交變更** | 僅 `supabase/.temp/cli-latest`（暫存檔，可不提交） |
| **遠端** | `origin` → GitHub `sky770825/TRINHNAI-` |

**結論**：程式碼已成功推送到 GitHub，無需再處理。

---

## 二、Cloudflare（dash.cloudflare.com）請你自行檢查

我無法登入你的 Cloudflare 後台，請在 **https://dash.cloudflare.com/** 依下面項目確認。

### 1. Pages 專案

- **Workers & Pages** → 選你的 **Pages** 專案（連到 TRINHNAI 的）
- 確認 **Deployments** 有最新一次部署，且狀態為 **Success**
- 若剛連 GitHub，應為 **Build in progress** 或已完成；若失敗可點該次部署看 **Build log**

### 2. 建置設定

- **Settings** → **Builds & deployments** 應為：
  - **Framework preset**: Vite（或 None）
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
- **Root directory**：若專案在 repo 根目錄，留空即可。

### 3. 環境變數（重要）

- **Settings** → **Environment variables**
- 至少要有（**Production** 與 **Preview** 建議都設）：
  - `VITE_SUPABASE_URL` = 你的 Supabase Project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` = 你的 Supabase anon key
- **不要**在 Cloudflare 設 `VITE_SKIP_AUTH=true`（正式站要登入）。
- 若有改環境變數，需 **重新部署** 才會生效（可到 Deployments → **Retry deployment** 或再 push 一次觸發）。

### 4. 網址與行為

- **Custom domains**：若已綁網域，確認 DNS 正常、SSL 為「Full」或「Full (strict)」。
- 開啟 **預覽 / 正式網址**（例如 `https://你的專案.pages.dev`）：
  - 首頁能開、樣式正常
  - 點「預約」等會連到 Supabase 的流程可操作
  - 後台 `/admin`、`/crm` 需登入後可進

### 5. 若部署失敗

- 在 **Deployments** 點失敗的那次 → 看 **Build log**。
- 常見原因：
  - 建置指令或輸出目錄設錯（應為 `npm run build`、`dist`）
  - 沒設 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`，執行期報錯
  - Node 版本不符（Cloudflare 多為 18.x，本專案應可跑）

---

## 三、快速自檢清單

- [ ] GitHub 上 `sky770825/TRINHNAI-` 的 `main` 為最新
- [ ] Cloudflare Pages 最新一次部署為 **Success**
- [ ] 建置指令 = `npm run build`，輸出目錄 = `dist`
- [ ] 已設 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] 實際打開網站首頁與一兩個功能正常
- [ ] （有綁網域）DNS / SSL 正常

若以上都勾選，Git 與 Cloudflare 端即算檢查完成。
