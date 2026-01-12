-- ============================================
-- 創建公告圖片 Storage Bucket SQL
-- 可以直接複製到 Supabase Dashboard SQL Editor 執行
-- ============================================

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
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

-- 允許認證用戶上傳
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcement-images');

-- 允許認證用戶更新
CREATE POLICY IF NOT EXISTS "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcement-images');

-- 允許認證用戶刪除
CREATE POLICY IF NOT EXISTS "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcement-images');

-- ============================================
-- 執行完成！
-- ============================================
-- 現在可以在後台管理頁面上傳公告圖片了
-- ============================================
