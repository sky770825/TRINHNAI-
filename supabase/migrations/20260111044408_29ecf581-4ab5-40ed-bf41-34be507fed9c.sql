-- 擴充 leads 表，新增電話和來源追蹤欄位
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS line_id text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
ADD COLUMN IF NOT EXISTS notes text;