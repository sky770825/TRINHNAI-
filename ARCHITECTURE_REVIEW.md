# 專案架構檢視報告

本文件針對「資料與 Supabase 是否獨立」、「程式碼模組化程度」做全局檢視，並給出維護與更新上的建議。

---

## 一、資料獨立：全部嵌入同一個專案，避免格式或資料混淆

**定義**：資料獨立 = **把資料全部放在同一個專案裡**（單一 Supabase 專案、單一 schema、統一命名與格式），避免日後格式或資料上的混淆。

### 1.1 現狀

| 項目 | 現況 |
|------|------|
| **專案** | 目前為**單一 Supabase 專案**（cnzqtuuegdqwkgvletaa），前後端都連同一個 DB。 ✅ |
| **Schema** | 業務表**全部在 `public`**：announcements、service_settings、store_settings、leads、bookings、bot_settings、bot_keywords、line_bookings、user_roles 等。 |
| **例外** | `001_init_core.sql` 另建了 **`app_triahni`** schema，但前端與 Edge Functions **尚未接用**，等於有兩套「資料定義」並存，容易造成格式或資料混淆。 ⚠️ |
| **Storage** | 使用 `announcement-images`、`service-images` 等 bucket，路徑尚未統一前綴。 |
| **SQL / Migration** | 根目錄與 `supabase/migrations/` 有多個零散 `.sql`，沒有單一清單說明「哪些是正式、哪些是手動、執行順序」。 |

**結論**：資料已在同一個專案內，但存在 **public vs app_triahni 兩套 schema** 的設計，若未來混用會增加格式與資料混淆的風險。要真正做到「資料獨立＝全部嵌入同一個專案、避免混淆」，需要**統一成單一 schema 與單一格式來源**。

### 1.2 建議：單一專案、單一 schema、統一格式

1. **以「同一個專案」為唯一資料來源**
   - 維持**一個 Supabase 專案**，所有表、Storage、Edge Functions 都在此專案內。
   - 不在別處再建一份「並行」的 DB 或 schema 定義，避免格式或資料分流。

2. **統一成單一 schema**（✅ **已採用方案 A**）
   - **方案 A**：**全部沿用 `public`**。  
     - 現有功能已全在 public，不需搬移。  
     - 若未來要加新表（如 site_sections、tag_dictionary），一律**在 public 裡新增**，與現有 announcements、service_settings 等同一層。  
     - **不啟用、不接用 `app_triahni`**，前端與 Edge Functions 只查 `public`，避免格式或資料混淆。
   - ~~方案 B~~：自訂 schema 不採用。

3. **統一命名與格式**
   - 表名、欄位命名風格一致（例如一律 snake_case）。
   - 型別以 **`integrations/supabase/types.ts`** 為單一來源，或由 `supabase gen types` 定期產生，避免各頁面自訂一份造成格式不一致。
   - Storage 路徑可約定單一前綴（例如 `app/` 或專案名），所有上傳都走同一套規則，減少「路徑格式」混淆。

4. **Migration / SQL 集中管理**
   - **正式結構變更**：一律透過 `supabase/migrations/`，檔名與順序清楚（例如 `YYYYMMDD_描述.sql`），避免在根目錄散落多個「手動執行」的 .sql 造成「到底有沒有跑過」的混淆。
   - **僅供手動或說明用的 SQL**：集中到例如 `docs/sql/` 或 `scripts/sql/`，並在 README 註明用途與執行時機（如：DEV_RLS、建立 bucket 等），不與正式 migration 混在一起。

---

## 二、程式碼模組化程度

### 2.1 已有、做得不錯的部分

| 類型 | 位置 | 說明 |
|------|------|------|
| **UI 元件** | `src/components/ui/` | 按元件拆分（button、input、dialog、table 等），利於重用與樣式一致。 |
| **區塊元件** | `src/components/sections/` | 首頁區塊拆分（Hero、Services、Footer、BookingModal 等），結構清楚。 |
| **業務元件** | `src/components/` | AdminGuard、BookingModal、RemarketingManager、AnnouncementModal 等獨立成檔。 |
| **Hooks** | `src/hooks/` | useAuth、use-mobile、use-toast，邏輯可重用。 |
| **Context** | `src/contexts/` | LanguageContext 集中語系狀態。 |
| **工具與型別** | `src/lib/`、`src/integrations/supabase/` | utils、validations、errorHandler；Supabase client + types 集中管理。 |
| **頁面** | `src/pages/` | 依路由拆分（Index、Admin、CRM、Auth、NotFound）。 |
| **Edge Functions** | `supabase/functions/` | 依功能拆成 admin-leads、line-webhook、send-booking-confirmation 等，邊界清楚。 |

### 2.2 不足、影響維護的部分

| 項目 | 現況 | 影響 |
|------|------|------|
| **Admin.tsx** | 約 **2450 行**，內含預約、公告、服務、分店、leads、Storage 上傳、表單、列表等全部邏輯。 | 單檔過大，改一功能易動到其他；測試與 code review 困難。 |
| **CRM.tsx** | 約 **2020 行**，內含用戶、關鍵字、預約、設定、推播、表單、列表等全部邏輯。 | 同上。 |
| **資料存取** | 各頁面與元件**直接** `supabase.from('...')`，沒有統一的 **api / services 層**。 | 表名、欄位、錯誤處理散落各處；若要換 API 或加 cache 需改很多檔案。 |
| **型別** | `integrations/supabase/types.ts` 為自動生成，頁面內仍有多處自訂 interface（如 Lead、BotKeyword）。 | 型別分散，與 DB 不同步時易出錯。 |
| **業務邏輯** | 與 UI、狀態、Supabase 呼叫混在同一頁面。 | 難以單獨測試業務規則；重用在其他頁面需複製貼上。 |

**結論：有做「介面層」的模組化（元件、hooks、context、lib），但「業務與資料層」幾乎都塞在 Admin / CRM 兩大頁面，模組化不足，不利長期更新與維護。**

---

## 三、建議的模組化方向（不影響現有功能為前提）

### 3.1 短期、可逐步做的

1. **抽出「資料存取」層（api / services）**
   - 新增目錄，例如 `src/api/` 或 `src/services/`。
   - 依領域建檔，例如：
     - `announcements.ts`：`fetchAnnouncements()`、`createAnnouncement()`、`updateAnnouncement()`、`deleteAnnouncement()`。
     - `services.ts`：`fetchServices()`、`saveService()`、`deleteService()`。
     - `stores.ts`、`bookings.ts`、`keywords.ts`、`botSettings.ts` 等類推。
   - 頁面與元件改為呼叫這些函式，不再直接 `supabase.from(...)`。
   - 好處：表名／欄位／錯誤處理集中；日後換成 REST 或加 cache 只需改一層。

2. **把 Admin / CRM 拆成「子模組」**
   - 例如 `src/pages/Admin/` 底下：
     - `Admin.tsx`：只負責 layout、Tabs、路由子頁。
     - `AnnouncementsTab.tsx`：公告列表 + 新增/編輯/刪除。
     - `ServicesTab.tsx`、`StoresTab.tsx`、`BookingsTab.tsx`、`LeadsTab.tsx` 等。
   - 同理 `src/pages/CRM/`：`CRM.tsx` + `UsersTab.tsx`、`KeywordsTab.tsx`、`BookingsTab.tsx`、`SettingsTab.tsx` 等。
   - 每個 Tab 只關心自己的狀態與呼叫對應的 api/service，單檔行數可壓到數百行內。

3. **型別集中**
   - 若保留 Supabase 為主要資料來源：以 `types.ts` 為準，頁面用 `Database['public']['Tables']['xxx']['Row']` 或從 types 再 export 別名（如 `type Announcement = Tables<'announcements'>`）。
   - 自訂的 DTO／表單型別可放在 `src/types/` 或各 `api/*.ts` 同檔案，避免在頁面裡重複定義。

### 3.2 中期、可與「資料獨立」一起規劃

1. **Schema 分離**
   - Trinh Nai 專用表遷到 `app_trinhnai`（或維持 public 但文件註明「Trinh Nai 專用」）。
   - triahni 專用一律使用 `app_triahni`，並在 api 層封裝 `schema('app_triahni')`，頁面不直接碰 schema 名稱。

2. **Feature 目錄（可選）**
   - 若希望「一個功能一個資料夾」，可採 feature 結構，例如：
     - `src/features/announcements/`：`AnnouncementsTab.tsx`、`api.ts`、`types.ts`。
     - `src/features/booking/`、`src/features/keywords/` 等。
   - 再在 `pages/Admin`、`pages/CRM` 裡組裝這些 feature，有助於權限與功能邊界對齊。

---

## 四、總結表

| 問題 | 現況 | 建議 |
|------|------|------|
| **資料獨立**（全部嵌入同一個專案、避免格式或資料混淆） | 已是**單一 Supabase 專案**；已採用**方案 A**：單一 schema = **public**。 | **方案 A 已採用**：全部沿用 public，新表一律建在 public；不啟用 app_triahni。型別與 migration 集中管理，Storage 路徑可統一前綴。 |
| **程式碼是否模組化？** | **部分**。元件／hooks／lib 有；業務與資料幾乎集中在 Admin / CRM 兩大頁面，無 api 層。 | 先抽 api/services 層、再拆 Admin/CRM 為 Tab 子模組；型別集中；有需要再採 feature 目錄。 |

依上述方向調整後，資料邊界會較清楚，日後更新與維護（含測試、重構、加新功能）會比較容易。若你希望，我可以從「先抽哪一個 api 模組」或「先拆哪一個 Tab」開始，給出具體檔案名與函式簽章範例。
