# 專案功能與模組化檢查

## 一、目前功能總覽

### 1. 對外網站（首頁）`/`

| 功能 | 說明 |
|------|------|
| **首頁區塊** | Hero、品牌、服務、作品集、優惠、留單、FAQ、Footer、Sticky CTA |
| **預約** | 點擊「預約」開啟 BookingModal，填寫後寫入 `leads` + `bookings` |
| **公告** | 進站後自動彈出 AnnouncementModal，內容來自 `announcements` |
| **語系** | LanguageContext 切換中/英（部分區塊） |
| **SEO** | StructuredData 結構化資料 |

**主要元件**：`Index.tsx`、`components/sections/*`、`BookingModal`、`AnnouncementModal`、`Header`、`Footer`、`StickyCTA`。

---

### 2. 登入頁 `/auth`

| 功能 | 說明 |
|------|------|
| **登入** | 信箱 + 密碼，Supabase Auth |
| **權限** | 透過 `user_roles` 判斷是否為 admin，供 Admin / CRM 使用 |

**主要元件**：`Auth.tsx`、`useAuth`。

---

### 3. 後台 Admin `/admin`

需登入且具 admin 角色（或開發時 `VITE_SKIP_AUTH` + `DEV_RLS`）。

| 分頁 | 功能 |
|------|------|
| **預約 (bookings)** | 列表、篩選（日期/分店/服務/狀態）、更新狀態、刪除預約；可走 admin-leads 或開發 fallback 直接寫 DB |
| **名單 (leads)** | 列表、篩選、刪除名單 |
| **公告 (announcements)** | 列表、新增/編輯/刪除、上傳圖片（Storage `announcement-images`）、拖曳排序 |
| **服務 (services)** | 列表、新增/編輯/刪除服務、上傳圖片（Storage `service-images`） |
| **分店 (stores)** | 列表、新增/編輯/刪除分店設定 |
| **網站設定 (site)** | Logo / 封面 / Favicon 上傳（`site_assets` + Storage `site-assets`）、全站區塊文案編輯（`site_content`，JSON 編輯、表格顯示文字摘要） |

**資料來源**：`bookings`、`leads`、`announcements`、`service_settings`、`store_settings`、`site_assets`、`site_content`。部分寫入經 Edge Function `admin-leads`（需 JWT 或密碼），開發時可改走直接 Supabase + DEV_RLS。

---

### 4. 後台 CRM `/crm`

需登入且具 admin 角色（或開發時略過登入 + 密碼／DEV 設定）。

| 分頁 | 功能 |
|------|------|
| **用戶 (users)** | LINE 用戶列表（`line_users`）、備註/標籤編輯、確認付款、發送付款確認、推播訊息 |
| **再行銷 (remarketing)** | RemarketingManager：依興趣後 N 小時發送訊息（`remarketing_messages`）的 CRUD |
| **關鍵字 (keywords)** | LINE 關鍵字回覆（`bot_keywords`）：文字、圖片、Flex、Quick Reply 等回覆類型 |
| **預約 (bookings)** | LINE 預約日曆（`line_bookings`）、確認/取消、發送確認通知 |
| **設定 (settings)** | LINE Bot 設定（`bot_settings`） |

**資料來源**：`line_users`、`line_bookings`、`bot_keywords`、`bot_settings`、`remarketing_messages`。寫入多數經 Edge Function `admin-leads`。

---

### 5. Edge Functions（後端）

| 函數 | 用途 |
|------|------|
| **admin-leads** | 後台主要 API：預約狀態更新/刪除、名單刪除、LINE 用戶/預約/再行銷/推播、getAdminData 等；驗證為 JWT（admin）或 body.password |
| **line-webhook** | 接收 LINE  webhook、關鍵字回覆、預約流程 |
| **send-booking-confirmation** | 發送預約確認（可被 admin-leads 或流程呼叫） |
| **send-lead-notification** | 留單通知 |
| **remarketing-cron** | 定時發送再行銷訊息 |
| **create-storage-bucket** | 建立 Storage bucket（工具用） |

---

### 6. 主要資料表（Supabase `public`）

- **對外 / 後台共用**：`announcements`、`service_settings`、`store_settings`、`leads`、`bookings`、`site_assets`、`site_content`
- **LINE / CRM**：`line_users`、`line_bookings`、`bot_keywords`、`bot_settings`、`remarketing_messages`、`remarketing_sent_log`
- **權限**：`user_roles`、`booking_blocks`（時段等）

---

## 二、模組化現況

### 做得好的部分

| 類型 | 位置 | 說明 |
|------|------|------|
| **UI 元件** | `src/components/ui/` | 按元件拆分（button、dialog、table、select 等），利於重用 |
| **區塊元件** | `src/components/sections/` | 首頁各區塊獨立（Hero、Services、Footer 等） |
| **業務元件** | `src/components/` | AdminGuard、BookingModal、RemarketingManager、AnnouncementModal 等獨立成檔 |
| **Hooks** | `src/hooks/` | useAuth、use-mobile、use-toast |
| **Context** | `src/contexts/` | LanguageContext |
| **工具** | `src/lib/`、`src/utils/` | utils、validations、errorHandler、adminLeads、connectionTest |
| **Supabase** | `src/integrations/supabase/` | client、types 集中 |
| **路由** | `src/App.tsx` | 路由級 lazy 載入（Index、Auth、Admin、CRM、NotFound） |
| **後端** | `supabase/functions/` | 依功能拆成多個 Edge Function |

### 不足的部分

| 項目 | 現況 |
|------|------|
| **Admin.tsx** | 單檔約 2700+ 行，含預約／名單／公告／服務／分店／網站設定全部邏輯與表單 |
| **CRM.tsx** | 單檔約 2000+ 行，含用戶／再行銷／關鍵字／預約／設定全部邏輯與表單 |
| **資料層** | 各頁面與元件直接 `supabase.from(...)` 或 `supabase.functions.invoke(...)`，沒有統一的 `api/` 或 `services/` 層 |
| **型別** | 頁面內仍有自訂 interface（Lead、Booking、BotKeyword 等），與 `types.ts` 部分重疊 |

---

## 三、總結

- **功能**：對外首頁（預約、公告、多區塊）、登入、Admin（預約/名單/公告/服務/分店/網站設定）、CRM（LINE 用戶/再行銷/關鍵字/預約/設定）、以及多支 Edge Functions，功能完整且邊界清楚。
- **模組化**：UI、區塊、部分業務元件、hooks、context、lib、路由與 Edge Functions 已模組化；**Admin / CRM 兩大頁面仍為單檔巨量組件，且缺少統一資料存取層**，後續建議優先：
  1. 抽出 **api / services 層**（例如 `announcements`、`bookings`、`keywords` 等），集中表名、欄位與錯誤處理。
  2. 將 **Admin / CRM 按分頁拆成子元件**（如 `BookingsTab`、`AnnouncementsTab`、`KeywordsTab` 等），單檔控制在數百行內，利於維護與測試。

更細的架構與資料政策可參考 `ARCHITECTURE_REVIEW.md`、`DATA_SCHEMA_POLICY.md`。
