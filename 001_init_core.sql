-- =============================================================================
-- 001_init_core.sql — Supabase 後端初始化（triahni）
-- 使用方式：複製整份檔案內容，貼到 Supabase Dashboard → SQL Editor → 執行
-- =============================================================================
-- 【專案識別】
--   project_key: triahni
--   schema: app_triahni
--   storage_prefix: app/triahni/
--   tag_namespace: cs
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app_triahni;

-- -----------------------------------------------------------------------------
-- 2. Types (Enums)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE app_triahni.app_role AS ENUM ('admin', 'editor', 'staff', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE app_triahni.membership_tier_slug AS ENUM ('free', 'pro', 'vip');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Tables
-- -----------------------------------------------------------------------------

-- 3.1 membership_tiers（先建，profiles 會 FK）
CREATE TABLE IF NOT EXISTS app_triahni.membership_tiers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       app_triahni.membership_tier_slug NOT NULL UNIQUE,
  name       text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 profiles（對應 auth.users）
CREATE TABLE IF NOT EXISTS app_triahni.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text,
  full_name           text,
  avatar_url          text,
  role                app_triahni.app_role NOT NULL DEFAULT 'member',
  membership_tier_id   uuid REFERENCES app_triahni.membership_tiers(id) ON DELETE SET NULL,
  raw_user_meta       jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON app_triahni.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier_id ON app_triahni.profiles(membership_tier_id);

-- 3.3 tag_dictionary（標籤字典，格式 cs.<key>.<value>）
CREATE TABLE IF NOT EXISTS app_triahni.tag_dictionary (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace   text NOT NULL DEFAULT 'cs',
  key         text NOT NULL,
  value       text NOT NULL,
  label       text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (namespace, key, value)
);

CREATE INDEX IF NOT EXISTS idx_tag_dictionary_ns_key ON app_triahni.tag_dictionary(namespace, key);

-- 3.4 profile_tags（會員標籤）
CREATE TABLE IF NOT EXISTS app_triahni.profile_tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES app_triahni.profiles(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES app_triahni.tag_dictionary(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_tags_profile_id ON app_triahni.profile_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_tags_tag_id ON app_triahni.profile_tags(tag_id);

-- 3.5 site_settings（全站設定）
CREATE TABLE IF NOT EXISTS app_triahni.site_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  value       jsonb,
  value_type  text NOT NULL DEFAULT 'string',
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON app_triahni.site_settings(key);

-- 3.6 site_sections（page_key + section_key 可控內容）
CREATE TABLE IF NOT EXISTS app_triahni.site_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key    text NOT NULL,
  section_key text NOT NULL,
  content     jsonb,
  enabled     boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, section_key)
);

CREATE INDEX IF NOT EXISTS idx_site_sections_page_enabled ON app_triahni.site_sections(page_key, enabled);

-- 3.7 media_assets（統一媒體庫，Storage path 前綴 app/triahni/）
CREATE TABLE IF NOT EXISTS app_triahni.media_assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path        text NOT NULL UNIQUE,
  url         text,
  mime_type   text,
  alt_text    text,
  width       int,
  height      int,
  file_size   bigint,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_is_active ON app_triahni.media_assets(is_active);

-- -----------------------------------------------------------------------------
-- 4. updated_at 函數與觸發器
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_triahni.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_triahni
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles', 'membership_tiers', 'tag_dictionary', 'site_settings', 'site_sections', 'media_assets']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON app_triahni.%I;
       CREATE TRIGGER set_updated_at BEFORE UPDATE ON app_triahni.%I
       FOR EACH ROW EXECUTE FUNCTION app_triahni.set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5. 輔助函數：取得目前使用者的 app_triahni 角色
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_triahni.current_user_role()
RETURNS app_triahni.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app_triahni
AS $$
  SELECT role FROM app_triahni.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_triahni.is_admin_or_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app_triahni
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_triahni.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

-- -----------------------------------------------------------------------------
-- 6. auth.users 觸發：註冊時自動建立 profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_triahni.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_triahni
AS $$
DECLARE
  default_tier_id uuid;
BEGIN
  SELECT id INTO default_tier_id FROM app_triahni.membership_tiers WHERE slug = 'free' LIMIT 1;
  INSERT INTO app_triahni.profiles (id, email, full_name, avatar_url, raw_user_meta, membership_tier_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta->>'full_name', NEW.raw_user_meta->>'name'),
    NEW.raw_user_meta->>'avatar_url',
    NEW.raw_user_meta,
    default_tier_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_triahni ON auth.users;
CREATE TRIGGER on_auth_user_created_triahni
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION app_triahni.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. RLS
-- -----------------------------------------------------------------------------
ALTER TABLE app_triahni.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.membership_tiers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.tag_dictionary        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.profile_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.site_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.site_sections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_triahni.media_assets          ENABLE ROW LEVEL SECURITY;

-- membership_tiers: 公開可讀
CREATE POLICY "membership_tiers_select_public"
  ON app_triahni.membership_tiers FOR SELECT
  TO public USING (true);

-- tag_dictionary: 公開可讀
CREATE POLICY "tag_dictionary_select_public"
  ON app_triahni.tag_dictionary FOR SELECT
  TO public USING (true);

-- tag_dictionary: admin/editor CRUD
CREATE POLICY "tag_dictionary_insert_admin_editor"
  ON app_triahni.tag_dictionary FOR INSERT
  TO authenticated WITH CHECK (app_triahni.is_admin_or_editor());
CREATE POLICY "tag_dictionary_update_admin_editor"
  ON app_triahni.tag_dictionary FOR UPDATE
  TO authenticated USING (app_triahni.is_admin_or_editor());
CREATE POLICY "tag_dictionary_delete_admin_editor"
  ON app_triahni.tag_dictionary FOR DELETE
  TO authenticated USING (app_triahni.is_admin_or_editor());

-- profiles: 本人可讀寫；admin/editor 可讀全部
CREATE POLICY "profiles_select_own"
  ON app_triahni.profiles FOR SELECT
  TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_admin_editor"
  ON app_triahni.profiles FOR SELECT
  TO authenticated USING (app_triahni.is_admin_or_editor());
CREATE POLICY "profiles_update_own"
  ON app_triahni.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own"
  ON app_triahni.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- profile_tags: 本人可讀寫自己；admin/editor 可讀寫全部
CREATE POLICY "profile_tags_select_own"
  ON app_triahni.profile_tags FOR SELECT
  TO authenticated USING (
    profile_id = auth.uid() OR app_triahni.is_admin_or_editor()
  );
CREATE POLICY "profile_tags_insert_own"
  ON app_triahni.profile_tags FOR INSERT
  TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "profile_tags_insert_admin_editor"
  ON app_triahni.profile_tags FOR INSERT
  TO authenticated WITH CHECK (app_triahni.is_admin_or_editor());
CREATE POLICY "profile_tags_delete_own"
  ON app_triahni.profile_tags FOR DELETE
  TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "profile_tags_delete_admin_editor"
  ON app_triahni.profile_tags FOR DELETE
  TO authenticated USING (app_triahni.is_admin_or_editor());

-- site_settings: admin/editor CRUD（不開放公開讀，若需公開讀可再加 SELECT policy）
CREATE POLICY "site_settings_select_admin_editor"
  ON app_triahni.site_settings FOR SELECT
  TO authenticated USING (app_triahni.is_admin_or_editor());
CREATE POLICY "site_settings_insert_admin_editor"
  ON app_triahni.site_settings FOR INSERT
  TO authenticated WITH CHECK (app_triahni.is_admin_or_editor());
CREATE POLICY "site_settings_update_admin_editor"
  ON app_triahni.site_settings FOR UPDATE
  TO authenticated USING (app_triahni.is_admin_or_editor());
CREATE POLICY "site_settings_delete_admin_editor"
  ON app_triahni.site_settings FOR DELETE
  TO authenticated USING (app_triahni.is_admin_or_editor());

-- site_sections: 公開可讀 enabled=true；admin/editor CRUD
CREATE POLICY "site_sections_select_public_enabled"
  ON app_triahni.site_sections FOR SELECT
  TO public USING (enabled = true);
CREATE POLICY "site_sections_all_authenticated"
  ON app_triahni.site_sections FOR ALL
  TO authenticated USING (app_triahni.is_admin_or_editor())
  WITH CHECK (app_triahni.is_admin_or_editor());

-- media_assets: 公開可讀 is_active=true；admin/editor CRUD
CREATE POLICY "media_assets_select_public_active"
  ON app_triahni.media_assets FOR SELECT
  TO public USING (is_active = true);
CREATE POLICY "media_assets_all_admin_editor"
  ON app_triahni.media_assets FOR ALL
  TO authenticated USING (app_triahni.is_admin_or_editor())
  WITH CHECK (app_triahni.is_admin_or_editor());

-- site_settings 公開讀（若前端需要讀全站設定）
CREATE POLICY "site_settings_select_public"
  ON app_triahni.site_settings FOR SELECT
  TO public USING (true);

-- -----------------------------------------------------------------------------
-- 7.1 Schema 與表權限（Supabase 需對 app_triahni 授權）
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA app_triahni TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA app_triahni TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app_triahni TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app_triahni TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app_triahni TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_triahni TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. Seed
-- -----------------------------------------------------------------------------

-- 8.1 membership_tiers
INSERT INTO app_triahni.membership_tiers (slug, name, description, sort_order)
VALUES
  ('free', 'Free', '免費會員', 1),
  ('pro', 'Pro', '進階會員', 2),
  ('vip', 'VIP', 'VIP 會員', 3)
ON CONFLICT (slug) DO NOTHING;

-- 8.2 site_settings（1 筆）
INSERT INTO app_triahni.site_settings (key, value, value_type, description)
VALUES ('global', '{"site_name":"Triahni","tag_namespace":"cs"}'::jsonb, 'object', '全站通用設定')
ON CONFLICT (key) DO NOTHING;

-- 8.3 site_sections（global.nav, global.footer, global.floating_actions, global.mobile_bottom_bar）
INSERT INTO app_triahni.site_sections (page_key, section_key, content, enabled, sort_order)
VALUES
  ('global', 'nav', '{"items":[]}'::jsonb, true, 1),
  ('global', 'footer', '{"text":"","links":[]}'::jsonb, true, 2),
  ('global', 'floating_actions', '{"buttons":[]}'::jsonb, true, 3),
  ('global', 'mobile_bottom_bar', '{"items":[]}'::jsonb, true, 4)
ON CONFLICT (page_key, section_key) DO NOTHING;

-- 8.4 tag_dictionary（namespace=cs）
INSERT INTO app_triahni.tag_dictionary (namespace, key, value, label, sort_order)
VALUES
  ('cs', 'src', 'tiktok', 'TikTok', 1),
  ('cs', 'src', 'instagram', 'Instagram', 2),
  ('cs', 'src', 'facebook', 'Facebook', 3),
  ('cs', 'src', 'website', 'Website', 4),
  ('cs', 'src', 'line', 'LINE', 5),
  ('cs', 'intent', 'sell', '銷售', 1),
  ('cs', 'intent', 'buy', '購買', 2),
  ('cs', 'intent', 'service', '服務', 3),
  ('cs', 'intent', 'marketing', '行銷', 4),
  ('cs', 'area', 'yangmei', '楊梅', 1),
  ('cs', 'area', 'puxin', '埔心', 2),
  ('cs', 'area', 'zhongli', '中壢', 3),
  ('cs', 'area', 'pingzhen', '平鎮', 4),
  ('cs', 'area', 'longtan', '龍潭', 5),
  ('cs', 'stage', 'new', '新客', 1),
  ('cs', 'stage', 'followup', '追蹤', 2),
  ('cs', 'stage', 'visit', '到訪', 3),
  ('cs', 'stage', 'deal', '成交', 4),
  ('cs', 'stage', 'closed', '結案', 5),
  ('cs', 'level', 'hot', '熱', 1),
  ('cs', 'level', 'warm', '溫', 2),
  ('cs', 'level', 'cold', '冷', 3)
ON CONFLICT (namespace, key, value) DO NOTHING;

COMMIT;

-- =============================================================================
-- Storage 說明（需在 Dashboard 手動或另建 bucket）
-- Storage path 必須以 app/triahni/ 為前綴，例如：
--   app/triahni/media/xxx.jpg
--   app/triahni/uploads/yyy.png
-- 若使用單一 bucket，上傳時 path 請使用 app/triahni/... 即可。
-- =============================================================================
