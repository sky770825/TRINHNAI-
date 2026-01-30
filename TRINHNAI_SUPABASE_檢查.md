# Trinh Nai 專案 — Supabase 檢查說明

## 您的 Supabase 專案

| 項目 | 值 |
|------|-----|
| **專案 ID** | `cnzqtuuegdqwkgvletaa` |
| **Dashboard** | https://supabase.com/dashboard/project/cnzqtuuegdqwkgvletaa |
| **SQL 編輯器** | https://supabase.com/dashboard/project/cnzqtuuegdqwkgvletaa/sql/new |
| **Table Editor** | https://supabase.com/dashboard/project/cnzqtuuegdqwkgvletaa/editor |
| **Storage** | https://supabase.com/dashboard/project/cnzqtuuegdqwkgvletaa/storage/buckets |

本機 `.env` 已設定為此專案：
- `VITE_SUPABASE_URL` = `https://cnzqtuuegdqwkgvletaa.supabase.co`
- `VITE_SUPABASE_PROJECT_ID` = `cnzqtuuegdqwkgvletaa`

---

## 在 SQL 編輯器裡檢查

您提供的連結是此專案的 SQL 編輯器。請在該頁面：

1. **執行診斷**：打開專案裡的 `CHECK_STORAGE_SETUP.sql`，複製全部內容，貼到 SQL 編輯器後執行。
2. **看結果**：
   - 第一個查詢：若沒有資料 → `announcement-images` bucket 尚未建立（需建立後圖片上傳才會成功）。
   - 第二個查詢：會列出所有 Storage buckets。
   - 其餘查詢：可檢查 RLS 策略與權限。

若 `announcement-images` 不存在，請在 SQL 編輯器執行專案中的 **`CREATE_ANNOUNCEMENT_STORAGE_BUCKET.sql`**（只執行該 `.sql` 檔內容，不要執行 `.md`）。

---

## 專案預期會用到的資源

- **資料表**：`announcements`、`service_settings`、`store_settings`、`user_roles`、`bookings`、`keywords`、`bot_settings` 等（詳見 LINE_BOOKING_MANAGEMENT.md）。
- **Storage**：bucket 名稱 `announcement-images`（公告圖片）、`service-images`（若有用到服務圖片）。

以上檢查都在 **Trinh Nai 使用的 Supabase 專案** `cnzqtuuegdqwkgvletaa` 內完成即可。
