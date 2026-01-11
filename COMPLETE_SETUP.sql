-- ========================================
-- LINE 預約系統完整設定 SQL
-- ========================================

-- 1. 建立服務項目表
CREATE TABLE IF NOT EXISTS service_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_range TEXT NOT NULL,
  image_url TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '20:13',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立分店設定表
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  opening_time TEXT DEFAULT '09:00',
  closing_time TEXT DEFAULT '22:00',
  time_slot_duration INTEGER DEFAULT 60,
  available_days TEXT[] DEFAULT ARRAY['1','2','3','4','5','6','0'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 建立預約表
CREATE TABLE IF NOT EXISTS line_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  line_user_id TEXT NOT NULL,
  user_name TEXT,
  phone TEXT,
  service TEXT NOT NULL,
  store TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 建立預約時段封鎖表
CREATE TABLE IF NOT EXISTS booking_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  block_date DATE NOT NULL,
  block_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 建立索引
CREATE INDEX IF NOT EXISTS idx_service_settings_active ON service_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_store_settings_active ON store_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_line_bookings_line_user_id ON line_bookings(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_bookings_status ON line_bookings(status);
CREATE INDEX IF NOT EXISTS idx_line_bookings_date ON line_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_blocks_date ON booking_blocks(store_id, block_date);

-- 6. 啟用 RLS
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_blocks ENABLE ROW LEVEL SECURITY;

-- 7. 設定 RLS 政策
DROP POLICY IF EXISTS "Authenticated users can manage service_settings" ON service_settings;
CREATE POLICY "Authenticated users can manage service_settings" ON service_settings
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage store_settings" ON store_settings;
CREATE POLICY "Authenticated users can manage store_settings" ON store_settings
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage line_bookings" ON line_bookings;
CREATE POLICY "Authenticated users can manage line_bookings" ON line_bookings
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage booking_blocks" ON booking_blocks;
CREATE POLICY "Authenticated users can manage booking_blocks" ON booking_blocks
  FOR ALL USING (auth.role() = 'authenticated');

-- 8. 清除舊資料（如果需要重新開始）
TRUNCATE service_settings, store_settings RESTART IDENTITY CASCADE;

-- 9. 插入預設服務項目
INSERT INTO service_settings (service_id, name, description, price_range, image_url, aspect_ratio, is_active, sort_order) VALUES
  ('nail', '💅 美甲服務', '凝膠指甲 | 光療指甲 | 指甲彩繪', 'NT$ 150 - 990', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800', '20:13', true, 1),
  ('lash', '👁️ 美睫服務', '睫毛嫁接 | 美睫設計 | 睫毛保養', 'NT$ 790 - 1,290', 'https://images.unsplash.com/photo-1583001931096-959a1f0c12e8?w=800', '20:13', true, 2),
  ('tattoo', '✨ 紋繡服務', '霧眉 | 飄眉 | 眼線 | 美瞳線', 'NT$ 3,990 - 11,990', 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800', '20:13', true, 3),
  ('waxing', '🪶 熱蠟除毛', '全身除毛 | 私密除毛 | 專業服務', 'NT$ 590 - 2,559', 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800', '20:13', true, 4);

-- 10. 插入預設分店
INSERT INTO store_settings (store_id, name, address, opening_time, closing_time, time_slot_duration, available_days, is_active) VALUES
  ('yuanhua', '中壢元化店', '中壢區元化路（前站）', '09:00', '22:00', 60, ARRAY['1','2','3','4','5','6','0'], true),
  ('zhongfu', '中壢忠福店', '中壢區忠福路（黃昏市場對面）', '09:00', '22:00', 60, ARRAY['1','2','3','4','5','6','0'], true);

-- 11. 驗證資料
SELECT 'service_settings' as table_name, COUNT(*) as count FROM service_settings
UNION ALL
SELECT 'store_settings', COUNT(*) FROM store_settings
UNION ALL
SELECT 'line_bookings', COUNT(*) FROM line_bookings;

-- 完成！
