# 公告功能測試指南

## 1. 執行 Migration

首先，請在 Supabase Dashboard 執行 migration：

1. 前往 Supabase Dashboard
2. 進入 SQL Editor
3. 執行 `supabase/migrations/20260112065349_create_announcements.sql` 中的 SQL
4. 確認表已建立：前往 Table Editor，應該能看到 `announcements` 表

## 2. 檢查資料表結構

確認 `announcements` 表有以下欄位：
- `id` (uuid, primary key)
- `title` (text, not null)
- `content` (text, not null)
- `is_active` (boolean, default true)
- `priority` (integer, default 0)
- `start_date` (timestamp with time zone, nullable)
- `end_date` (timestamp with time zone, nullable)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

## 3. 檢查 RLS 政策

確認以下 RLS 政策已建立：
- "Anyone can view active announcements" (SELECT, public)
- "Admins can view all announcements" (SELECT, authenticated)
- "Admins can insert announcements" (INSERT, authenticated)
- "Admins can update announcements" (UPDATE, authenticated)
- "Admins can delete announcements" (DELETE, authenticated)

## 4. 測試後台管理功能

### 4.1 新增公告

1. 登入 CRM 後台 (`/crm`)
2. 點擊「公告管理」標籤頁
3. 點擊「新增公告」按鈕
4. 填寫以下資訊：
   - 標題：測試公告
   - 內容：這是一個測試公告
   - 狀態：啟用（勾選）
   - 優先級：5
   - 開始日期：（選填，可不填）
   - 結束日期：（選填，可不填）
5. 點擊「儲存」
6. 檢查：
   - 是否顯示成功訊息
   - 公告是否出現在列表中

### 4.2 編輯公告

1. 在公告列表中點擊「編輯」圖標
2. 修改內容
3. 點擊「儲存」
4. 檢查是否成功更新

### 4.3 啟用/停用公告

1. 點擊公告狀態圖標（電源圖標）
2. 檢查狀態是否改變
3. 停用的公告不應在前端顯示

### 4.4 刪除公告

1. 點擊「刪除」圖標
2. 確認刪除
3. 檢查公告是否從列表中移除

## 5. 測試前端顯示

### 5.1 基本顯示

1. 前往首頁 (`/`)
2. 等待約 500ms
3. 檢查是否顯示公告彈窗
4. 彈窗應顯示：
   - 公告標題
   - 公告內容（支援換行）
   - 「我知道了」按鈕

### 5.2 日期範圍測試

1. 建立一個有開始日期的公告（開始日期設為未來）
2. 檢查前端是否不顯示（因為還沒到開始日期）
3. 建立一個有結束日期的公告（結束日期設為過去）
4. 檢查前端是否不顯示（因為已經過期）

### 5.3 優先級測試

1. 建立多個啟用的公告
2. 設定不同的優先級（例如：10, 5, 0）
3. 檢查前端是否只顯示優先級最高的公告

### 5.4 停用測試

1. 建立一個啟用的公告
2. 在後台停用該公告
3. 檢查前端是否不再顯示

## 6. 錯誤處理測試

### 6.1 權限錯誤

如果沒有管理員權限，應該顯示：
- "權限不足，請確認您有管理員權限"

### 6.2 表不存在錯誤

如果 migration 未執行，應該顯示：
- "公告表不存在，請先執行 migration"

### 6.3 必填欄位錯誤

如果不填寫標題或內容，應該顯示：
- "請填寫標題和內容"

## 7. 瀏覽器 Console 檢查

1. 開啟瀏覽器開發者工具（F12）
2. 前往 Console 標籤頁
3. 執行各種操作（新增、編輯、刪除公告）
4. 檢查是否有錯誤訊息
5. 如果儲存失敗，查看詳細錯誤訊息

## 8. 常見問題排查

### 問題：儲存失敗

**可能原因：**
1. Migration 未執行
2. 沒有管理員權限
3. RLS 政策設定錯誤

**解決方法：**
1. 執行 migration SQL
2. 檢查 `user_roles` 表中是否有您的 admin 角色
3. 檢查 RLS 政策是否正確建立

### 問題：前端不顯示公告

**可能原因：**
1. 沒有啟用的公告
2. 公告在日期範圍外
3. 有其他優先級更高的公告

**解決方法：**
1. 檢查公告狀態是否為「啟用」
2. 檢查開始/結束日期是否在有效範圍內
3. 檢查是否有其他優先級更高的公告

### 問題：前端顯示錯誤

**可能原因：**
1. 資料庫連接問題
2. RLS 政策限制

**解決方法：**
1. 檢查 Supabase 連接設定
2. 檢查 RLS 政策中的 "Anyone can view active announcements" 政策
