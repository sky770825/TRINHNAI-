# 在 Cloudflare Pages 設定 Supabase 環境變數

出現 `Missing Supabase environment variables` 或 `placeholder.supabase.co ... ERR_NAME_NOT_RESOLVED` 時，代表**建置時**沒有帶入 Supabase 變數，必須在 Cloudflare 設定並**重新部署**。

---

## 步驟（約 2 分鐘）

1. **取得 Supabase 金鑰**
   - 打開 [Supabase Dashboard](https://supabase.com/dashboard) → 選你的專案
   - 左側 **Settings** → **API**
   - 複製：
     - **Project URL** → 這就是 `VITE_SUPABASE_URL`
     - **Project API keys** 裡的 **anon public** → 這就是 `VITE_SUPABASE_PUBLISHABLE_KEY`

2. **在 Cloudflare 新增變數**
   - 打開 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**
   - 點你的 **trinhnai** 專案（或你的 Pages 專案名）
   - 上方 **Settings** → 左側 **Environment variables**
   - 點 **Add variable** → **Add variable**（或 **Encrypt** 後再 Add）
   - 新增兩筆：

     | Variable name | Value |
     |---------------|--------|
     | `VITE_SUPABASE_URL` | 貼上你的 Project URL（例如 `https://xxxx.supabase.co`） |
     | `VITE_SUPABASE_PUBLISHABLE_KEY` | 貼上 anon public key |

   - **Production** 與 **Preview** 建議都勾選（或至少勾 Production）
   - 點 **Save** 儲存

3. **重新部署（必做）**
   - 上方 **Deployments**
   - 最新一次部署右側 **⋯**（三個點）→ **Retry deployment**
   - 等建置完成（約 1～2 分鐘）

4. **檢查**
   - 打開 https://trinhnai.pages.dev/（或你的網址）
   - 按 F12 → Console，不應再出現 `Missing Supabase` 或 `placeholder.supabase.co`

---

**重點**：環境變數是在「建置時」被 Vite 寫進 JS 的，所以**只改變數不重部署**不會生效，一定要 **Retry deployment**。
