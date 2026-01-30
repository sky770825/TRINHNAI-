# Cloudflare Pages 空白頁排查

## 一、已做的程式調整

- **頂層錯誤邊界**：若 React 拋錯，會顯示「頁面載入發生錯誤」與訊息，不再整頁空白。
- 重新部署後，若仍出錯，畫面上會看到錯誤內容，方便對照下面步驟。

---

## 二、請在 Cloudflare Dashboard 檢查

### 1. 環境變數（最常見原因）

Vite 在**建置時**會把環境變數寫進 JS，沒設就不會生效。

1. 打開 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → 選你的 **trinhnai** 專案。
2. 點 **Settings** → **Environment variables**。
3. 確認有設（**Production** 與 **Preview** 建議都設）：
   - `VITE_SUPABASE_URL` = 你的 Supabase 專案 URL（例如 `https://xxxx.supabase.co`）
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Supabase 的 anon public key
4. **儲存後一定要重新部署**：到 **Deployments** → 最新一次部署右側 **⋯** → **Retry deployment**，或再 push 一次到 GitHub 觸發新部署。

### 2. 建置設定（必設，否則會出現 MIME / main.tsx 錯誤）

若 Console 出現：

- `Failed to load module script: Expected a JavaScript... but the server responded with a MIME type of "application/octet-stream"`
- 或錯誤裡出現 **main.tsx**

代表 Cloudflare 正在提供「原始 repo」的 `index.html`（會載入 `/src/main.tsx`），而不是**建置後的** `dist/`。請務必設定：

- **Settings** → **Builds & deployments**：
  - **Build command**：`npm run build`
  - **Build output directory**：`dist`（一定要填，不能留空）
  - **Root directory**：留空（若專案在 repo 根目錄）

設好後到 **Deployments** → 最新部署右側 **⋯** → **Retry deployment**，等建置完成再重新開網頁。

### 3. 部署日誌

- **Deployments** → 點最新一次部署 → 看 **Build log**。
- 若建置失敗，會寫原因；若建置成功但網頁仍空白，多半是執行期錯誤或環境變數未帶入。

---

## 三、瀏覽器端檢查

1. 打開 https://trinhnai.pages.dev/
2. 按 **F12** 開開發者工具 → 切到 **Console**。
3. 看是否有**紅色錯誤**（例如 `Failed to fetch`、`undefined is not an object`、`Missing env` 等）。
4. 若已加錯誤邊界，畫面上會顯示錯誤訊息，可對照 Console 一起看。

---

## 四、確認清單

- [ ] Cloudflare 已設 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] 設好變數後已「重新部署」（Retry 或重新 push）
- [ ] Build command = `npm run build`，Build output directory = `dist`
- [ ] 開啟 trinhnai.pages.dev 並看 F12 Console 有無錯誤
- [ ] 若仍空白，看畫面上是否出現錯誤邊界訊息（若有，依訊息與 Console 排查）

完成上述後若還是空白，把 **Console 錯誤全文**或**畫面上的錯誤訊息**貼給開發者，可進一步對症處理。
