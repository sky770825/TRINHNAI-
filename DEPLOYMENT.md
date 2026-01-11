# 部署指南

## 重要說明

**Supabase 無法託管前端網站**  
Supabase 專案 ([uoymqlwjpxsspqslkezx](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx)) 只提供後端服務（資料庫、認證、儲存），不支援託管 React 前端應用。

## 部署架構

- **前端網站**：部署到 Vercel/Netlify（靜態網站託管）
- **後端服務**：使用 Supabase 專案（資料庫、認證、Edge Functions）

## 部署步驟

### 步驟 1：部署前端到 Vercel（推薦）

#### 方式 A：透過 Vercel Dashboard

1. 前往 [Vercel](https://vercel.com) 並登入
2. 點擊 "Add New Project"
3. 匯入您的 Git 倉庫
4. 設定專案：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. 設定環境變數：
   - `VITE_SUPABASE_URL`: 從 [Supabase Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api) 取得
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: 從 Supabase Dashboard 取得

6. 點擊 "Deploy"

#### 方式 B：使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel

# 生產環境部署
vercel --prod
```

### 步驟 2：部署 Supabase Edge Functions

```bash
# 安裝 Supabase CLI
npm i -g supabase

# 登入 Supabase
supabase login

# 連結到專案（使用 project ID: uoymqlwjpxsspqslkezx）
supabase link --project-ref uoymqlwjpxsspqslkezx

# 部署所有 Edge Functions
supabase functions deploy
```

或者個別部署：

```bash
supabase functions deploy admin-leads
supabase functions deploy send-lead-notification
supabase functions deploy send-booking-confirmation
supabase functions deploy line-webhook
supabase functions deploy remarketing-cron
```

### 步驟 3：設定 Supabase Edge Functions 環境變數

在 [Supabase Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/functions) 設定：

- `SUPABASE_URL`: 專案 URL
- `SUPABASE_ANON_KEY`: Anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `ADMIN_PASSWORD`: 管理員密碼（如需要）
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Bot access token
- `LINE_CHANNEL_SECRET`: LINE Bot secret
- `RESEND_API_KEY`: Resend API key（如需要）

## 其他部署平台選項

### Netlify

1. 前往 [Netlify](https://netlify.com)
2. 拖放 `dist` 資料夾或連接 Git 倉庫
3. 設定：
   - Build command: `npm run build`
   - Publish directory: `dist`

### Cloudflare Pages

1. 前往 [Cloudflare Pages](https://pages.cloudflare.com)
2. 連接 Git 倉庫
3. 設定：
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`

### GitHub Pages

需要額外設定 base path，詳見 [Vite 文檔](https://vitejs.dev/guide/static-deploy.html#github-pages)

## 取得 Supabase 環境變數

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/uoymqlwjpxsspqslkezx/settings/api)
2. 複製以下資訊：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

## 本地測試部署

```bash
# 建置專案
npm run build

# 預覽建置結果
npm run preview
```

## 檢查清單

- [ ] 前端已部署到 Vercel/Netlify
- [ ] 環境變數已正確設定
- [ ] Supabase Edge Functions 已部署
- [ ] Edge Functions 環境變數已設定
- [ ] 測試網站功能正常運作
