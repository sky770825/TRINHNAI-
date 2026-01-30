# 專案 CLI / 自動化指令

所有指令都在專案根目錄執行（`npm run xxx` 或 `./scripts/xxx.sh`）。

---

## 開發與建置

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置正式版（輸出到 `dist/`） |
| `npm run build:dev` | 建置開發模式 |
| `npm run preview` | 預覽建置結果（本機開 `dist/`） |
| `npm run lint` | 執行 ESLint |
| `npm run check` | 等同 `npm run build`，用於部署前檢查 |
| `npm run release` | 先執行 `check`，通過後印出部署提醒 |

---

## Supabase（需先安裝 [Supabase CLI](https://supabase.com/docs/guides/cli)）

| 指令 | 說明 |
|------|------|
| `npm run supabase:link` | 連結到遠端 Supabase 專案（需 project ref） |
| `npm run supabase:status` | 查看本機 / 連結狀態 |
| `npm run supabase:db-push` | 推送 `supabase/migrations/` 到遠端 DB |
| `npm run supabase:functions-deploy` | 部署所有 Edge Functions 到遠端 |

**首次使用 Supabase CLI：**

1. 安裝：`brew install supabase/tap/supabase`（macOS）或見 [INSTALL_SUPABASE_CLI.md](INSTALL_SUPABASE_CLI.md)
2. 登入：`npx supabase login`
3. 連結：`npm run supabase:link`（依提示輸入 project ref）

---

## 腳本（scripts/）

| 腳本 | 說明 |
|------|------|
| `./scripts/check-and-build.sh` | 執行 `npm run build`，成功後印出部署與 Supabase 提醒 |
| `./scripts/push_migrations.sh` | 檢查登入與 migration 狀態（migration 仍建議用 Dashboard SQL Editor 或 `supabase db push`） |

執行前請先賦權：`chmod +x scripts/*.sh`

---

## 常見流程

**部署到 Cloudflare 前：**

```bash
npm run check
# 或
./scripts/check-and-build.sh
# 通過後 push 到 Git，或到 Cloudflare Dashboard 手動觸發部署
```

**更新 Supabase 資料庫（migration）：**

```bash
npm run supabase:db-push
```

**部署 Edge Functions：**

```bash
npm run supabase:functions-deploy
```

**一鍵檢查後準備上線：**

```bash
npm run release
```
