-- Add image_url column to announcements table
-- This migration adds support for announcement images

-- Add image_url column
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create index for image_url (optional, for filtering)
CREATE INDEX IF NOT EXISTS idx_announcements_image_url 
ON public.announcements(image_url) 
WHERE image_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.announcements.image_url IS 'URL of the announcement image (stored in Supabase Storage)';
