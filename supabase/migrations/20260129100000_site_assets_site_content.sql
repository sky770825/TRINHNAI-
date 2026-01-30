-- =============================================================================
-- bd 腳本：封面、Logo 與全站可編輯內容（方案 A，全部 public）
-- =============================================================================
-- 使用方式：Supabase Dashboard → SQL Editor 貼上執行，或 supabase db push
-- 建立：site_assets（Logo/封面 URL）、site_content（區塊文案）、Storage bucket site-assets
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. site_assets（Logo、封面、favicon 等單一資源）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  path        text,
  url         text,
  alt_text    text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_assets IS '全站靜態資源：logo、hero_cover、favicon 等，url 為對外顯示用';
CREATE INDEX IF NOT EXISTS idx_site_assets_key ON public.site_assets(key);

-- -----------------------------------------------------------------------------
-- 2. site_content（各頁各區塊可編輯文字／結構）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key    text NOT NULL,
  block_key   text NOT NULL,
  content     jsonb NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, block_key)
);

COMMENT ON TABLE public.site_content IS '全站可編輯區塊：page_key + block_key 對應前端區塊，content 為 JSON';
CREATE INDEX IF NOT EXISTS idx_site_content_page_block ON public.site_content(page_key, block_key);

-- -----------------------------------------------------------------------------
-- 3. updated_at 觸發
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_site_assets_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_site_content_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_assets_updated_at ON public.site_assets;
CREATE TRIGGER site_assets_updated_at
  BEFORE UPDATE ON public.site_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_site_assets_updated_at();

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_site_content_updated_at();

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 公開可讀（先刪除再建立，可重複執行）
DROP POLICY IF EXISTS "site_assets_select_public" ON public.site_assets;
DROP POLICY IF EXISTS "site_content_select_public" ON public.site_content;
CREATE POLICY "site_assets_select_public"
  ON public.site_assets FOR SELECT TO public USING (true);
CREATE POLICY "site_content_select_public"
  ON public.site_content FOR SELECT TO public USING (true);

-- 僅 admin 可寫（依既有 has_role）；先刪除再建立以便重複執行
DROP POLICY IF EXISTS "site_assets_update_admin" ON public.site_assets;
DROP POLICY IF EXISTS "site_assets_update_authenticated" ON public.site_assets;
DROP POLICY IF EXISTS "site_content_update_admin" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update_authenticated" ON public.site_content;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
    EXECUTE 'CREATE POLICY "site_assets_update_admin" ON public.site_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))';
    EXECUTE 'CREATE POLICY "site_content_update_admin" ON public.site_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))';
  ELSE
    CREATE POLICY "site_assets_update_authenticated" ON public.site_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "site_content_update_authenticated" ON public.site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Storage bucket: site-assets（Logo、封面等）
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "site-assets authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "site-assets authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "site-assets authenticated delete" ON storage.objects;

CREATE POLICY "site-assets public read"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'site-assets');

CREATE POLICY "site-assets authenticated upload"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');

CREATE POLICY "site-assets authenticated update"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');

CREATE POLICY "site-assets authenticated delete"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');

-- -----------------------------------------------------------------------------
-- 6. Seed：預設 site_assets 與 site_content
-- -----------------------------------------------------------------------------
INSERT INTO public.site_assets (key, path, url, alt_text)
VALUES
  ('logo', NULL, NULL, '品牌 Logo'),
  ('hero_cover', NULL, NULL, '首頁封面'),
  ('favicon', NULL, NULL, 'Favicon')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_content (page_key, block_key, content, sort_order)
VALUES
  ('global', 'logo_text', '"Trinhnai"', 1),
  ('global', 'nav_items', '[{"label":"服務","href":"#services"},{"label":"關於我們","href":"#about"},{"label":"作品集","href":"#gallery"},{"label":"常見問題","href":"#faq"}]', 2),
  ('global', 'footer', '{"copyright":"© Trinhnai. All rights reserved.","links":[]}', 3),
  ('index', 'hero', '{"badge":"精緻美甲 · 預約體驗","headline1":"指尖上的","headline2":"藝術","brand":"Trinhnai","services":"美甲 · 美睫 · 除毛","cta_booking":"立即預約","cta_line":"加入 LINE"}', 1),
  ('index', 'cta', '{"booking":"立即預約","contact":"聯絡我們"}', 2)
ON CONFLICT (page_key, block_key) DO NOTHING;

COMMIT;
