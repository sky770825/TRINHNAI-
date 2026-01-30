# 模組化完成說明

## 一、已完成的 API 層（`src/api/`）

所有建檔已建立並由 Admin / CRM / RemarketingManager 使用。

| 檔案 | 說明 |
|------|------|
| **types.ts** | 共用型別：Announcement、Booking、Lead、ServiceSetting、StoreSetting、SiteAssetRow、SiteContentRow、LineUser、LineBooking、BotKeyword、BotSetting、RemarketingMessage（對齊 DB） |
| **leads.ts** | `fetchLeads()`、`deleteLead()` |
| **bookings.ts** | `fetchBookings()`、`updateBookingStatus()`、`deleteBooking()` |
| **announcements.ts** | `fetchAnnouncements()`、`createAnnouncement()`、`updateAnnouncement()`、`deleteAnnouncement()`、`toggleAnnouncementActive()`、`uploadAnnouncementImage()`、`removeAnnouncementImage()`、`checkAnnouncementBucketExists()` |
| **services.ts** | `fetchServices()`、`createService()`、`updateService()`、`deleteService()`、`updateServiceSortOrder()`、`uploadServiceImage()`、`removeServiceImage()` |
| **stores.ts** | `fetchStores()`、`createStore()`、`updateStore()`、`deleteStore()`、`toggleStoreActive()` |
| **site.ts** | `fetchSiteAssets()`、`fetchSiteContent()`、`updateSiteAsset()`、`insertSiteAsset()`、`uploadSiteAsset()`、`updateSiteContent()` |
| **adminLeads.ts** | `invokeAdminLeads<T>(payload)`、`isAdminLeads401()`、`ADMIN_LEADS_401_MESSAGE`；payload 型別為 `AdminLeadsPayload`（updateStatus、deleteBooking、getLineUsers、broadcastMessage 等） |
| **index.ts** | 統一 export 上述模組 |

## 二、已調整的頁面／元件

- **Admin.tsx**：改為使用 `@/api`（fetchLeads、fetchBookings、invokeAdminLeads、apiUpdateBookingStatus、apiDeleteBooking、apiDeleteLead、apiFetchServices、apiFetchStores、fetchSiteAssets、fetchSiteContent、updateSiteAsset、insertSiteAsset、uploadSiteAsset、apiUpdateSiteContent、apiFetchAnnouncements、createAnnouncement、updateAnnouncement、apiDeleteAnnouncement、apiToggleAnnouncementActive、uploadAnnouncementImage、removeAnnouncementImage、checkAnnouncementBucketExists、createService、updateService、apiDeleteService、updateServiceSortOrder、uploadServiceImage、removeServiceImage、createStore、updateStore、apiDeleteStore、apiToggleStoreActive）。型別改為從 `@/api/types` 引入。
- **CRM.tsx**：改為使用 `invokeAdminLeads` 與 `ADMIN_LEADS_401_MESSAGE`，`LineUser` 型別從 `@/api/types` 引入。
- **RemarketingManager.tsx**：改為使用 `invokeAdminLeads` 與 `ADMIN_LEADS_401_MESSAGE`。

## 三、尚未拆分的部分（可之後再做）

- **Admin.tsx**：仍為單一檔案，僅改為透過 API 層操作；若要把「預約／名單／公告／服務／分店／網站設定」拆成獨立 Tab 元件（如 `Admin/BookingsTab.tsx`），可再從現有 Admin 抽出對應區塊與 props。
- **CRM.tsx**：同上，仍為單一檔案，僅改為透過 API 層；若要拆成 `CRM/UsersTab.tsx`、`CRM/KeywordsTab.tsx` 等，可依同樣方式逐步抽出。

## 四、使用方式

- 頁面或元件需要讀寫後台資料時，從 `@/api` 或 `@/api/types` 引入對應函式與型別，不再直接使用 `supabase.from(...)` 或 `supabase.functions.invoke("admin-leads", ...)`（admin-leads 一律經由 `invokeAdminLeads`）。
- 新增後台功能時，在 `src/api/` 新增或擴充模組，並在 `index.ts` 中 export。

## 五、建置與檢查

- `npm run build` 已通過。
- 若之後要進一步把 Admin / CRM 拆成多個 Tab 元件，可依 `PROJECT_FEATURES_AND_MODULES.md` 與 `ARCHITECTURE_REVIEW.md` 的建議逐步進行。
