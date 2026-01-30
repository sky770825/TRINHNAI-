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

-- 設置 bucket 的 RLS 策略（先刪除再建立，可重複執行）
DROP POLICY IF EXISTS "Public Access for announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete announcement-images" ON storage.objects;

CREATE POLICY "Public Access for announcement-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated users can upload to announcement-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated users can update announcement-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'announcement-images');

CREATE POLICY "Authenticated users can delete announcement-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'announcement-images');

-- ============================================
-- 執行完成！
-- ============================================
-- 現在可以在後台管理頁面上傳公告圖片了
-- ============================================
