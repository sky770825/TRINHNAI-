# 後台登入進不去 — 排查步驟

登入頁：`https://你的網域/#/auth`  
帳號：`123@gmail.com`，密碼：`123456`

---

## 一、先確認「登入當下」發生什麼

### 情況 A：按登入後出現錯誤訊息（Toast 紅字）

| 訊息 | 可能原因 | 做法 |
|------|----------|------|
| **網路連線失敗** / Failed to fetch | 網站建置時沒帶 Supabase 變數，連到 placeholder | 到 Cloudflare → Settings → Environment variables 設好 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`，再到 Deployments → **Retry deployment**，等建置完成再試登入 |
| **電子郵件或密碼錯誤** | 帳密打錯，或 Supabase 裡沒有這個使用者 | 到 Supabase → Authentication → Users，確認有 `123@gmail.com`；沒有就「Add user」建立，密碼設 `123456` |
| **請先確認您的電子郵件** | Supabase 有開「須確認 email」 | Supabase → Authentication → Providers → Email，暫時關閉 **Confirm email**，或到 Users 點該使用者 → 手動 **Confirm** |

### 情況 B：登入成功（有「登入成功」Toast），但被帶到首頁而不是後台

代表**有登入，但沒有管理員權限**（`user_roles` 裡沒有 admin）。

**做法：**

1. **在 Supabase 建立使用者**（若還沒建）  
   Authentication → Users → Add user → Email: `123@gmail.com`，Password: `123456` → Create user。

2. **把該帳號設成管理員**  
   - 到 **SQL Editor**  
   - 貼上專案裡 **ADD_ADMIN_123.sql** 的 SQL（從 `INSERT INTO public.user_roles` 那行到結尾）  
   - 按 **Run**  
   - 若沒有錯誤，就代表已寫入

3. **重新登入**  
   到 `/#/auth` 登出（若有登出鈕）再登入，或開無痕視窗再登入一次。  
   有 admin 權限後會自動跳到 `/#/admin`。

---

## 二、在 Supabase 裡再確認一次

1. **Authentication → Users**  
   要有 `123@gmail.com`，且狀態正常（若需確認 email，要已確認）。

2. **Table Editor → user_roles**  
   要有一筆：  
   - `user_id` = 該使用者的 **UUID**（在 Authentication → Users 點進去可複製）  
   - `role` = `admin`

若沒有這筆，就再執行一次 **ADD_ADMIN_123.sql** 裡的 SQL（會依 email 自動對應到該使用者的 UUID）。

---

## 三、快速檢查表

- [ ] Cloudflare 已設 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`，且已 **Retry deployment**
- [ ] Supabase Authentication → Users 裡有 `123@gmail.com`，密碼為 `123456`
- [ ] Supabase SQL Editor 已執行 **ADD_ADMIN_123.sql**（`INSERT INTO public.user_roles ... WHERE email = '123@gmail.com'`）
- [ ] Table Editor → user_roles 有對應的 admin 一筆
- [ ] 若 Supabase 有開「Confirm email」，該使用者已確認或已關閉確認

完成後再試一次登入；若仍進不去，請把**畫面上的錯誤訊息**或 **Toast 文字**貼給開發者。
