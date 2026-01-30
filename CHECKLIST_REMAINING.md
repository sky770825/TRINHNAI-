# 目前還可調整或執行的項目

## 必須／建議（依環境）

### 1. 環境變數
- **本機開發**：專案根目錄要有 `.env` 或 `.env.local`，至少包含：
  - `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`
  - 若未登入又要用後台：`VITE_SKIP_AUTH=true`、`VITE_ADMIN_PASSWORD=你的密碼`（需與 Supabase Edge Function 的 `ADMIN_PASSWORD` 相同）
- **正式環境**：在 Vercel（或你的託管）設定同上變數，**不要**設 `VITE_SKIP_AUTH`。

### 2. Supabase
- **Migration**：若還沒跑過，在 Supabase Dashboard → SQL Editor 執行 `supabase/migrations/` 內需要的 migration（或使用 `supabase db push`）。
- **開發用 RLS**：若要未登入改預約狀態／刪除，已執行過 `DEV_RLS_allow_anon_writes.sql` 即可；正式環境不要跑這支。

### 3. 部署
- 前端部署到 Vercel/Netlify 等後，記得設好環境變數並重新部署。
- Edge Functions 部署：`supabase functions deploy`（需先 `supabase link`）。
- 詳見 `DEPLOYMENT.md`。

---

## 可選（內容／安全／維護）

### 4. 內容 placeholder
- `src/components/StructuredData.tsx` 內電話為 `+886-3-XXXX-XXXX`，可改成實際聯絡電話。

### 5. .gitignore
- 若 `.env` 含密鑰，建議加入 `.gitignore` 一行：`.env`，避免誤 commit（目前已有 `.env*.local`）。

### 6. 程式碼模組化（非必須）
- Admin / CRM 仍為單檔；若要拆成多個 Tab 元件（例如 `Admin/BookingsTab.tsx`），可依 `PROJECT_FEATURES_AND_MODULES.md`、`MODULARIZATION_DONE.md` 逐步做。

---

## 目前無需再執行的

- API 層已建好並接上，建置通過。
- 全站區塊文案表格已改為顯示文字摘要。
- 預約狀態更新在開發環境有 DEV_RLS + 直接寫入 fallback。
- admin-leads 401 時有 toast 與（開發時）console 提示。

若你接下來是「本機開發 / 上線部署 / 給別人接手」其中一種，可以說一下，我可以幫你列該情境的具體步驟。
