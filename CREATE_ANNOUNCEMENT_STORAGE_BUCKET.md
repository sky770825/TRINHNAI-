# 創建公告圖片 Storage Bucket 說明

## 問題
如果上傳公告圖片時出現錯誤，可能是因為 `announcement-images` Storage bucket 不存在。

## 解決步驟

### 方法 1：通過 Supabase Dashboard（推薦）

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 在左側選單中點擊 **Storage**
4. 點擊 **New bucket** 按鈕
5. 填寫以下資訊：
   - **Name**: `announcement-images`
   - **Public bucket**: ✅ **勾選**（重要！這樣前端才能訪問圖片）
   - **File size limit**: 5 MB（可選）
   - **Allowed MIME types**: `image/*`（可選）
6. 點擊 **Create bucket**

### 方法 2：通過 SQL（如果 Dashboard 無法使用）

在 Supabase Dashboard 的 **SQL Editor** 中執行：

```sql
-- 創建 announcement-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  true,  -- 公開訪問
  5242880,  -- 5MB 限制
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 設置 bucket 的 RLS 策略（允許所有人讀取）
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

-- 允許認證用戶上傳
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcement-images');

-- 允許認證用戶更新
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcement-images');

-- 允許認證用戶刪除
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcement-images');
```

## 驗證

創建完成後，您可以：

1. 在 Storage 頁面確認 `announcement-images` bucket 存在
2. 確認 bucket 是 **Public**（公開）
3. 嘗試在後台管理頁面上傳公告圖片

## 常見錯誤

### 錯誤：`Bucket not found`
- **原因**: bucket 不存在
- **解決**: 按照上述步驟創建 bucket

### 錯誤：`new row violates row-level security policy`
- **原因**: RLS 策略不正確
- **解決**: 執行方法 2 的 SQL 來設置正確的 RLS 策略

### 錯誤：`The resource already exists`
- **原因**: bucket 已存在
- **解決**: 檢查 bucket 是否已創建，如果已存在則跳過創建步驟

## 測試

創建 bucket 後，請：

1. 打開瀏覽器開發者工具（F12）
2. 切換到 **Console** 標籤
3. 嘗試上傳圖片
4. 查看控制台中的詳細日誌，確認上傳過程

如果仍有問題，請查看控制台的錯誤信息並提供給開發者。
