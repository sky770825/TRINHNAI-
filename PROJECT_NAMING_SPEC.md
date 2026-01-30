# 專案命名規範（Trinh Nai / triahni）

## 規範預覽

| 項目 | 值 |
|------|-----|
| **project_key** | `triahni` |
| **ns** | `cs` |
| **schema** | `app_triahni` |
| **storage_prefix** | `app/triahni/` |
| **標籤格式** | `cs.<key>.<value>` |
| **事件格式** | `cs.<event_name>` |
| **角色** | `admin` / `editor` / `staff` / `member` |

---

## 與目前專案對照

### 1. Schema（資料庫 schema）

- **規範**：`app_triahni`
- **目前**：使用 Supabase 預設 `public`（表如 `announcements`、`user_roles`、`service_settings` 等均在 `public`）
- **若要對齊**：需在 Supabase 建立 schema `app_triahni`，並遷移表／視圖／RPC 與 RLS，再更新前端與 Edge Functions 的查詢指定 `schema: 'app_triahni'`

### 2. Storage 路徑前綴

- **規範**：`storage_prefix: app/triahni/`
- **目前**：  
  - 公告圖片：bucket `announcement-images`，路徑 `{id}/{filename}`  
  - 服務圖片：bucket `service-images`，路徑同上  
  - 未使用 `app/triahni/` 前綴
- **若要對齊**：上傳時改為 `app/triahni/announcements/{id}/{filename}`、`app/triahni/services/{id}/{filename}` 等，或維持現有 bucket、在物件 path 前加 `app/triahni/`

### 3. 角色（app_role）

- **規範**：`admin` | `editor` | `staff` | `member`
- **目前**：DB 與 `src/integrations/supabase/types.ts` 為 `admin` | `moderator` | `user`；後台權限僅檢查 `role === 'admin'`
- **若要對齊**：  
  1. 在 Supabase 修改 enum `app_role` 為上述四種（或新增 schema 下的 enum）  
  2. 遷移既有 `user_roles.role` 資料（例如 moderator→editor、user→member）  
  3. 更新 `types.ts` 的 `app_role` 與 `Constants`  
  4. 依需求在 `useAuth`、AdminGuard、CRM/Admin 頁面區分 editor / staff / member 權限

### 4. 標籤與事件（分析／追蹤）

- **規範**：  
  - 標籤：`cs.<key>.<value>`  
  - 事件：`cs.<event_name>`
- **目前**：專案內尚未實作以 `cs` 為 namespace 的標籤或事件送出的程式碼
- **若要對齊**：在新增分析或追蹤時，依此格式命名（例如 `cs.page.view`、`cs.booking.submit`）

---

## 快速參考

- **專案 key**：對外識別用 `triahni`（注意拼寫為 triahni）
- **命名空間**：`cs`，用於標籤與事件前綴
- **DB**：目標 schema `app_triahni`（目前為 `public`）
- **Storage**：目標路徑前綴 `app/triahni/`（目前無此前綴）
- **角色**：目標為 admin / editor / staff / member（目前為 admin / moderator / user）
