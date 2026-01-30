# Trinhnai 專案知識庫

> Trinhnai 美甲美睫沙龍網站 — 常見問題、部署流程、API 與函式庫快速參考

---

## 一、常見問題與排除

### 1.1 部署相關

| 錯誤 / 現象 | 可能原因 | 解法 |
|-------------|----------|------|
| `supabaseUrl is required` | 建置時未設定 `VITE_SUPABASE_*` | 本機：`.env` 設 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`；Cloudflare：Dashboard → Environment variables 設好後 **Retry deployment** |
| `Failed to load module script... MIME type "application/octet-stream"` 或錯誤出現 **main.tsx** | Cloudflare 未使用建置輸出 | **Build output directory** 必須為 `dist`，**Build command** 為 `npm run build`，設好後 Retry deployment。詳見 [CLOUDFLARE_BLANK_FIX.md](CLOUDFLARE_BLANK_FIX.md) |
| `lockfile had changes, but lockfile is frozen` | Cloudflare 用 Bun 且 lockfile 版本不符 | 專案已改為 npm：`bun.lockb` 已刪除並列入 `.gitignore`，push 後 Cloudflare 會用 `package-lock.json` 建置 |
| `error occurred while running build command` | 建置失敗 | 到 Cloudflare Deployments → 該次部署 → Build log 看完整錯誤；確認 Build output directory = `dist` |
| favicon.ico 404 | 同上，未部署 `dist/` | 確保 Cloudflare 建置輸出目錄為 `dist`（`public/favicon.ico` 會一併複製到 dist） |
| `relation "xxx" does not exist` | 資料表尚未建立 | 在 Supabase Dashboard SQL Editor 執行對應 migration（見 `supabase/migrations/`）或 `001_init_core.sql` |
| Error 522 | 連線逾時 | 確認 Cloudflare 部署狀態；先試 `https://trinhnai.pages.dev` |
| 403 部署權限 | 無該專案存取權 | 使用擁有該專案權限的 Supabase / Cloudflare 帳號 |

### 1.2 環境變數

| 變數 | 用途 | 取得位置 |
|------|------|----------|
| `VITE_SUPABASE_URL` | Supabase API 網址 | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key（前端用） | 同上 |
| `VITE_ADMIN_PASSWORD` | 本機開發時 admin-leads 驗證（可選） | 自訂，與 Edge Function 內驗證密碼一致；見 `.env.example` |

### 1.3 Git 與安全

| 項目 | 說明 |
|------|------|
| `.env` | 永不提交，已列於 `.gitignore` |
| `.env.example` | 可提交，僅供範例，不含真實密鑰 |
| GitHub 私有 | 設為 private 可防止他人 clone 完整原始碼 |
| 網站公開 | GitHub 私有不影響 Cloudflare 網站對外開放 |

---

## 二、部署與自動化流程

### 2.1 推薦流程（Git + Cloudflare Pages）

本專案以 **Git 連動 Cloudflare Pages** 部署，無 Wrangler 指令：

```
1. 本機開發完成
2. npm run build          # 建置（有 .env 會載入）
3. git add / commit / push
4. Cloudflare 自動偵測 push，執行 npm install + npm run build，部署 dist/
```

**Cloudflare 必設：** Build command = `npm run build`，Build output directory = `dist`。

### 2.2 本專案指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置正式版（輸出到 `dist/`） |
| `npm run check` | 等同 `npm run build`，部署前檢查 |
| `npm run release` | 先執行 check，通過後印出部署提醒 |
| `npm run supabase:link` | 連結遠端 Supabase 專案 |
| `npm run supabase:status` | 查看本機 / 連結狀態 |
| `npm run supabase:db-push` | 推送 `supabase/migrations/` 到遠端 DB |
| `npm run supabase:functions-deploy` | 部署所有 Edge Functions |

### 2.3 腳本說明

| 腳本 | 路徑 | 用途 |
|------|------|------|
| 建置與部署提醒 | `scripts/check-and-build.sh` | 執行 `npm run build`，成功後印出 Git / Cloudflare 提醒 |
| 推送 migrations | `scripts/push_migrations.sh` | 檢查登入與 migration 狀態（migration 建議用 Dashboard SQL Editor 或 `supabase db push`） |
| 公告 migration | `scripts/execute_announcements_migration.sh` | 執行公告相關 SQL |
| 修復 migrations | `scripts/repair_all_migrations.sh` | 修復 migration 紀錄 |

執行前：`chmod +x scripts/*.sh`。詳見 [CLI_SCRIPTS.md](CLI_SCRIPTS.md)。

### 2.4 首次 Cloudflare 設定

1. Workers & Pages → Connect to Git → 選 GitHub 與本專案 repo
2. **Build command**：`npm run build`；**Build output directory**：`dist`
3. Environment variables 設 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`（Production 與 Preview）
4. 網址：`https://trinhnai.pages.dev`（或自訂專案名）

---

## 三、API 參考與連結

### 3.1 尋找 API 功能

| 用途 | 檔案 / 位置 | 說明 |
|------|-------------|------|
| 前端 API 層 | `src/api/` | 統一封裝 Supabase 與 Edge Function 呼叫：`index.ts`、`bookings.ts`、`leads.ts`、`announcements.ts`、`services.ts`、`stores.ts`、`site.ts`、`adminLeads.ts`、`types.ts` |
| Supabase 客戶端 | `src/integrations/supabase/client.ts` | 建立 Supabase 連線 |
| admin-leads 呼叫封裝 | `src/utils/adminLeads.ts` | `adminLeadsBody`、`invokeAdminLeads`、401 訊息等 |
| Edge Functions | `supabase/functions/` | `admin-leads`、`line-webhook`、`send-booking-confirmation`、`send-lead-notification`、`remarketing-cron`、`create-storage-bucket` |

### 3.2 API 官方文件連結

| 服務 | 說明 | 連結 |
|------|------|------|
| Supabase REST API | 資料表 CRUD | https://supabase.com/docs/reference/javascript/introduction |
| Supabase Auth | 登入 / 登出 / Session | https://supabase.com/docs/guides/auth |
| Supabase Edge Functions | 自訂 API 端點 | https://supabase.com/docs/guides/functions |
| Supabase Realtime | 即時訂閱 | https://supabase.com/docs/guides/realtime |

### 3.3 專案資料與 Edge Functions 對照

| 資源 | 說明 | 備註 |
|------|------|------|
| 預約 bookings | `src/api/bookings.ts` | public.bookings |
| 線索 leads | `src/api/leads.ts` | public.leads |
| 公告 announcements | `src/api/announcements.ts` | public.announcements + Storage |
| 服務/門市/全站文案 | `src/api/services.ts`、`stores.ts`、`site.ts` | public 對應表與 site_content |
| admin-leads Edge Function | 預約狀態更新、刪除預約/線索等需後端驗證的操作 | 由 `src/api/adminLeads.ts`、`src/utils/adminLeads.ts` 呼叫 |
| LINE Webhook | 接收 LINE 訊息 | `supabase/functions/line-webhook` |
| 預約/線索通知 | 寄信等 | `send-booking-confirmation`、`send-lead-notification` |

---

## 四、函式庫使用說明連結

### 4.1 核心框架

| 函式庫 | 用途 | 官方文件 |
|--------|------|----------|
| React | UI 框架 | https://react.dev |
| Vite | 建置工具 | https://vitejs.dev |
| TypeScript | 型別 | https://www.typescriptlang.org/docs |
| React Router | 路由 | https://reactrouter.com |

### 4.2 UI 與樣式

| 函式庫 | 用途 | 官方文件 |
|--------|------|----------|
| Tailwind CSS | 樣式 | https://tailwindcss.com/docs |
| Radix UI | 無障礙元件 | https://www.radix-ui.com/primitives |
| shadcn/ui | 元件庫（基於 Radix） | https://ui.shadcn.com |
| Lucide React | 圖示 | https://lucide.dev |
| class-variance-authority | 樣式變體 | https://cva.style/docs |

### 4.3 資料與表單

| 函式庫 | 用途 | 官方文件 |
|--------|------|----------|
| TanStack React Query | 資料取得 / 快取 | https://tanstack.com/query/latest |
| React Hook Form | 表單 | https://react-hook-form.com |
| Zod | Schema 驗證 | https://zod.dev |
| date-fns | 日期處理 | https://date-fns.org |

### 4.4 後端與儲存

| 函式庫 | 用途 | 官方文件 |
|--------|------|----------|
| Supabase JS | 資料庫、Auth、Storage | https://supabase.com/docs/reference/javascript |
| @supabase/supabase-js | 客戶端 SDK | https://github.com/supabase/supabase-js |

### 4.5 其他常用

| 函式庫 | 用途 | 官方文件 |
|--------|------|----------|
| Recharts | 圖表 | https://recharts.org |
| Sonner | Toast 通知 | https://sonner.emilkowal.ski |
| cmdk | 命令選單 | https://cmdk.paco.me |
| Vaul | Drawer 抽屜 | https://vaul.emilkowal.ski |

---

## 五、部署平台快速連結

| 平台 | Dashboard | 說明 |
|------|-----------|------|
| Cloudflare Pages | https://dash.cloudflare.com | Workers & Pages → 專案 → Settings（Build、Environment variables） |
| Supabase | https://supabase.com/dashboard | 專案 → API / Auth / SQL Editor / Storage |
| GitHub | https://github.com | Repo → Settings |

---

## 六、相關文件索引

| 文件 | 路徑 | 內容 |
|------|------|------|
| Cloudflare 空白頁 / MIME 排除 | [CLOUDFLARE_BLANK_FIX.md](CLOUDFLARE_BLANK_FIX.md) | Build output directory、環境變數、Console 檢查 |
| CLI 與腳本 | [CLI_SCRIPTS.md](CLI_SCRIPTS.md) | npm 指令、Supabase、scripts 說明 |
| 部署流程 | [DEPLOYMENT.md](DEPLOYMENT.md) | 部署步驟與注意事項 |
| 環境變數範例 | [.env.example](.env.example) | 本地與 Cloudflare 變數範例 |
| 404 排除 | [404_FIX.md](404_FIX.md) | SPA 路由與 404 設定 |
| 專案功能與模組 | [PROJECT_FEATURES_AND_MODULES.md](PROJECT_FEATURES_AND_MODULES.md) | 功能與目錄結構 |
| 資料與 Schema 政策 | [DATA_SCHEMA_POLICY.md](DATA_SCHEMA_POLICY.md) | 資料表與 public schema |

---

## 七、快速指令速查

```bash
# 開發
npm run dev

# 建置
npm run build

# 部署前檢查
npm run check
# 或
npm run release

# Supabase（需先 npx supabase login）
npm run supabase:link
npm run supabase:status
npm run supabase:db-push
npm run supabase:functions-deploy
```

部署：建置通過後 `git push`，由 Cloudflare Pages 自動建置並部署。

---

*最後更新：2026-01-30*
