-- =============================================================================
-- 將後台管理員設為：123@gmail.com / 密碼 123456（需先建立該使用者）
-- =============================================================================
-- 步驟：
-- 1. Supabase Dashboard → Authentication → Users → Add user
--    Email: 123@gmail.com
--    Password: 123456
-- 2. 建立完成後，到 SQL Editor 貼上本檔下方 SQL → Run
-- =============================================================================

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = '123@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
