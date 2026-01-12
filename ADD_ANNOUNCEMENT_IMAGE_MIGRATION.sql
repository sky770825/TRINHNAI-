-- ============================================
-- 公告圖片上傳功能 Migration SQL
-- 可以直接複製到 Supabase Dashboard SQL Editor 執行
-- ============================================

-- Add image_url column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create index for image_url (optional, for filtering)
CREATE INDEX IF NOT EXISTS idx_announcements_image_url 
ON public.announcements(image_url) 
WHERE image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.announcements.image_url IS 'URL of the announcement image (stored in Supabase Storage)';

-- ============================================
-- Migration 執行完成！
-- ============================================
-- 下一步：
-- 1. 確保 Supabase Storage 中有 'announcement-images' bucket（公開訪問）
-- 2. 在 CRM 後台可以上傳公告圖片
-- 3. 前端會自動顯示公告圖片
-- ============================================
