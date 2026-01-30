# 封面、Logo 與全站可編輯內容 — 建議與資料結構

## 一、Logo 與封面照片的儲存方式

### 1.1 建議做法

| 項目 | 建議 |
|------|------|
| **儲存位置** | **Supabase Storage**，使用單一 bucket：`site-assets`。 |
| **路徑規範** | 建議前綴：`logo/`、`cover/`、`favicon/`，例如 `logo/main.png`、`cover/hero.jpg`。 |
| **資料庫** | 使用 **`site_assets`** 表記錄「鍵值 → 網址」：例如 key = `logo`、`hero_cover`、`favicon`，對應一筆 URL（與選填 alt_text）。上傳後由後台寫入 Storage，並更新 `site_assets` 的 `url`。 |
| **前端讀取** | 頁面載入時查 `site_assets`（或從 API 取得），Logo 用 `site_assets[key=logo].url`，封面用 `site_assets[key=hero_cover].url`；若無則沿用目前程式內預設（文字 Logo / 靜態 hero 圖）。 |

### 1.2 好處

- 圖片集中同一 bucket，權限與 RLS 一次管理。
- 表只存 key + url（+ alt），結構簡單，之後要加「favicon」「og_image」等只要多一筆 key。
- 前端一律依 key 取 URL，不寫死路徑。

---

## 二、全站文字、欄位、內容的設計位置

### 2.1 建議做法

| 類型 | 存放位置 | 說明 |
|------|----------|------|
| **多語系固定文案** | 維持現狀 **`LanguageContext`** + 翻譯 key（如 `t("hero.headline1")`）。 | 語系切換、固定欄位名稱。 |
| **可由後台編輯的區塊** | 新增 **`site_content`** 表：`page_key` + `block_key` + `content` (JSONB)。 | 例如首頁 hero 標題、導覽列項目、Footer 文案、CTA 按鈕文字等，後台改一筆就生效。 |
| **對應關係** | 見下表。 | 前端依 page_key + block_key 讀取，若無則 fallback 到 i18n 或程式預設。 |

### 2.2 建議的 page_key / block_key 對應（與前端區塊）

| page_key | block_key | 用途 | content 範例 (JSON) |
|----------|-----------|------|---------------------|
| `global` | `logo_text` | Header 品牌文字（無圖時） | `"Trinhnai"` 或 `{ "text": "Trinhnai" }` |
| `global` | `nav_items` | 導覽列項目 | `[{ "label": "服務", "href": "#services" }, ...]` |
| `global` | `footer` | Footer 文案、連結 | `{ "copyright": "...", "links": [...] }` |
| `index` | `hero` | Hero 區塊標題、副標、CTA 文字 | `{ "badge": "...", "headline1": "...", "headline2": "...", "cta_booking": "..." }` |
| `index` | `cta` | 全站 CTA 按鈕文字 | `{ "booking": "立即預約", "contact": "聯絡我們" }` |

- **封面、Logo 圖片**：不放在 `site_content`，而是 **`site_assets`**（key = `logo`、`hero_cover`），見上一節。
- 其餘「區塊級」可編輯文案、按鈕文字、導覽項目，統一用 **`site_content`**，一個區塊一筆或一個 page 一筆皆可，依 content 結構彈性設計。

### 2.3 前端使用方式建議

1. **單次載入**：App 或 Layout 啟動時取一次 `site_assets` + `site_content`（或依 page 取部分），放進 Context 或 state。
2. **優先順序**：若某區塊有對應 `site_content` 且 content 存在，則用 DB 內容；否則用 `t(...)` 或程式預設。
3. **型別**：為 content 定義 TypeScript 型別（如 `HeroContent`、`NavItem[]`），避免前後端結構不一致。

---

## 三、資料結構與 bd 腳本

- **資料庫**：所有表建在 **public**（方案 A）。
- **表**：
  - **`site_assets`**：key（唯一）、path、url、alt_text、updated_at。用於 Logo、封面、favicon 等「單一資源」。
  - **`site_content`**：page_key、block_key、content (JSONB)、sort_order、updated_at。用於各頁各區塊可編輯文字／結構。
- **Storage**：bucket `site-assets`，RLS 允許公開讀、後台（認證）可上傳。
- **bd 腳本**：**`supabase/migrations/20260129100000_site_assets_site_content.sql`**  
  - 內容：建立 `site_assets`、`site_content`、updated_at 觸發、RLS、Storage bucket `site-assets` 與其 RLS、Seed（預設 logo/hero_cover/favicon 與 global/index 區塊）。
  - 執行方式：Supabase Dashboard → SQL Editor 貼上整份執行，或於專案目錄執行 `supabase db push`。

上述結構建立後，後台即可：
- 在「網站設定」或「封面與 Logo」上傳 Logo、封面，寫入 Storage 並更新 `site_assets`；
- 在「全站內容」或各區塊編輯頁，編輯 `site_content` 的 content，前端依 page_key / block_key 顯示。
