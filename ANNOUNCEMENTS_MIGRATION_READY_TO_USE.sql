-- ============================================
-- 公告功能 Migration SQL
-- 可以直接複製到 Supabase Dashboard SQL Editor 執行
-- ============================================
-- 此 migration 包含所有依賴檢查，會自動建立 app_role 和 has_role（如果不存在）
-- ============================================

-- Ensure app_role enum type exists
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Note: has_role function should already exist from migration 20260111084637
-- The function is defined as: has_role(_user_id uuid, _role app_role)
-- If the function doesn't exist, please ensure migration 20260111084637 has been executed first

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

-- Allow everyone to view active announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- Allow authenticated admin users to view all announcements
CREATE POLICY "Admins can view all announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), CAST('admin' AS public.app_role)));

-- Allow authenticated admin users to manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), CAST('admin' AS public.app_role)));

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), CAST('admin' AS public.app_role)));

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), CAST('admin' AS public.app_role)));

-- Create indexes (with IF NOT EXISTS equivalent using DO block)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
    CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority DESC);
    CREATE INDEX IF NOT EXISTS idx_announcements_dates ON public.announcements(start_date, end_date);
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_announcements_updated_at();

-- ============================================
-- Migration 執行完成！
-- ============================================
-- 下一步：
-- 1. 在 CRM 後台的「公告管理」標籤頁中新增公告
-- 2. 前端會自動顯示啟用的公告
-- ============================================
