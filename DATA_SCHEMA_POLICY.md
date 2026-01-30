# 資料與 Schema 政策（方案 A）

本專案採用 **方案 A**：全部資料嵌入同一個專案，並以 **單一 schema** 管理，避免格式或資料混淆。

---

## 採用方案

- **Schema**：僅使用 **`public`**。所有業務表、RLS、函數皆在 `public`。
- **新表**：一律在 **public** 新增，與現有表同一層（如 `announcements`、`service_settings`）。
- **不啟用**：不自訂 schema（如 `app_triahni`），前端與 Edge Functions 不查其他 schema。

---

## 目前 public 表（參考）

| 表名 | 用途 |
|------|------|
| `announcements` | 公告 |
| `service_settings` | 服務項目 |
| `store_settings` | 分店設定 |
| `leads` | 名單／Leads |
| `bookings` | 官網預約 |
| `line_bookings` | LINE 預約 |
| `bot_settings` | LINE 機器人設定 |
| `bot_keywords` | LINE 關鍵字回覆 |
| `user_roles` | 後台角色（admin 等） |
| **`site_assets`** | 全站靜態資源（Logo、封面、favicon 等 key → url） |
| **`site_content`** | 全站可編輯區塊（page_key + block_key → content JSON） |
| 其他 | 以 Supabase Table Editor 或 `supabase/migrations/` 為準 |

新增表時請在 **public** 建立，並在 `supabase/migrations/` 新增對應 migration。

---

## 相關文件

- 架構與模組化檢視：`ARCHITECTURE_REVIEW.md`
- 命名規範（若需對齊 triahni 命名）：`PROJECT_NAMING_SPEC.md`（不影響 schema，僅命名參考）
