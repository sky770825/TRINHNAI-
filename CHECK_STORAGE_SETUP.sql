-- ============================================
-- 檢查 Storage 設置 SQL
-- 用於診斷圖片上傳問題
-- ============================================

-- 1. 檢查 announcement-images bucket 是否存在
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'announcement-images';

-- 2. 檢查所有 buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- 3. 檢查 storage.objects 的 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 4. 檢查是否有針對 announcement-images bucket 的策略
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (qual::text LIKE '%announcement-images%' OR with_check::text LIKE '%announcement-images%');

-- 5. 檢查 storage.objects 表的權限
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'storage' 
  AND table_name = 'objects';

-- 6. 檢查當前用戶的認證狀態
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 7. 檢查用戶角色
SELECT 
  ur.user_id,
  ur.role,
  u.email
FROM user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = auth.uid();

-- ============================================
-- 如果 bucket 不存在，執行以下創建語句：
-- ============================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'announcement-images',
--   'announcement-images',
--   true,
--   5242880,
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;
-- ============================================

-- ============================================
-- 如果缺少 RLS 策略，執行以下語句：
-- ============================================
-- CREATE POLICY IF NOT EXISTS "Public Access for announcement-images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'announcement-images');
--
-- CREATE POLICY IF NOT EXISTS "Authenticated users can upload to announcement-images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'announcement-images');
--
-- CREATE POLICY IF NOT EXISTS "Authenticated users can update announcement-images"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'announcement-images');
--
-- CREATE POLICY IF NOT EXISTS "Authenticated users can delete announcement-images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'announcement-images');
-- ============================================
