-- =============================================================================
-- 【僅限開發】允許未登入(anon)寫入資料與上傳照片
-- =============================================================================
-- 原因：VITE_SKIP_AUTH=true 時沒有登入，Supabase 以 anon 身分請求，
--       RLS 只允許 authenticated + admin，所以資料與照片都寫不進去。
--
-- 使用方式：在 Supabase Dashboard → SQL Editor 貼上並執行「本檔」。
-- 還原方式：執行本檔最下方的「還原區塊」即可移除這些 policy。
--
-- ⚠️ 勿在正式環境執行；僅限開發/測試用 Supabase 專案。
--
-- 照片上傳需先有 Storage bucket：announcement-images、service-images。
-- 若尚未建立，請先執行 CREATE_ANNOUNCEMENT_STORAGE_BUCKET.sql 或於 Dashboard 建立。
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. 公告 (announcements) — 允許 anon 新增/更新/刪除
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "DEV anon can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "DEV anon can delete announcements" ON public.announcements;

CREATE POLICY "DEV anon can insert announcements"
  ON public.announcements FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "DEV anon can update announcements"
  ON public.announcements FOR UPDATE TO anon USING (true);

CREATE POLICY "DEV anon can delete announcements"
  ON public.announcements FOR DELETE TO anon USING (true);

-- -----------------------------------------------------------------------------
-- 2. 服務項目 (service_settings) — 允許 anon 完整寫入
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon can manage service_settings" ON public.service_settings;
CREATE POLICY "DEV anon can manage service_settings"
  ON public.service_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. 分店設定 (store_settings) — 允許 anon 完整寫入
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon can manage store_settings" ON public.store_settings;
CREATE POLICY "DEV anon can manage store_settings"
  ON public.store_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3.0 預約與名單 (bookings, leads) — 開發時允許 anon 更新/刪除（Admin 狀態、刪除用）
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "DEV anon can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "DEV anon can delete leads" ON public.leads;

CREATE POLICY "DEV anon can update bookings"
  ON public.bookings FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "DEV anon can delete bookings"
  ON public.bookings FOR DELETE TO anon USING (true);

CREATE POLICY "DEV anon can delete leads"
  ON public.leads FOR DELETE TO anon USING (true);

-- -----------------------------------------------------------------------------
-- 3.1 網站設定 (site_assets, site_content) — 允許 anon 完整寫入
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon can manage site_assets" ON public.site_assets;
CREATE POLICY "DEV anon can manage site_assets"
  ON public.site_assets FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "DEV anon can manage site_content" ON public.site_content;
CREATE POLICY "DEV anon can manage site_content"
  ON public.site_content FOR ALL TO anon USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. Storage — 允許 anon 上傳/更新/刪除 公告、服務、網站資源圖片
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "DEV anon upload announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon upload service-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update service-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete service-images" ON storage.objects;

CREATE POLICY "DEV anon upload announcement-images"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'announcement-images');

CREATE POLICY "DEV anon update announcement-images"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'announcement-images');

CREATE POLICY "DEV anon delete announcement-images"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'announcement-images');

CREATE POLICY "DEV anon upload service-images"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "DEV anon update service-images"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'service-images');

CREATE POLICY "DEV anon delete service-images"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "DEV anon upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete site-assets" ON storage.objects;
CREATE POLICY "DEV anon upload site-assets"
  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "DEV anon update site-assets"
  ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'site-assets');
CREATE POLICY "DEV anon delete site-assets"
  ON storage.objects FOR DELETE TO anon USING (bucket_id = 'site-assets');

COMMIT;

-- =============================================================================
-- 【還原】正式環境請執行以下區塊，移除上述開發用 policy
-- =============================================================================
/*
BEGIN;
DROP POLICY IF EXISTS "DEV anon can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "DEV anon can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "DEV anon can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "DEV anon can manage service_settings" ON public.service_settings;
DROP POLICY IF EXISTS "DEV anon can manage store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "DEV anon upload announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete announcement-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon upload service-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update service-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete service-images" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon upload site-assets" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon delete site-assets" ON storage.objects;
DROP POLICY IF EXISTS "DEV anon can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "DEV anon can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "DEV anon can delete leads" ON public.leads;
DROP POLICY IF EXISTS "DEV anon can manage site_assets" ON public.site_assets;
DROP POLICY IF EXISTS "DEV anon can manage site_content" ON public.site_content;
COMMIT;
*/
