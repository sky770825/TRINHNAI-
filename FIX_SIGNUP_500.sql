-- =============================================================================
-- 修復註冊時 500 錯誤（signup 失敗）
-- =============================================================================
-- 原因：auth.users 上有 trigger 會呼叫 app_triahni.handle_new_user()，
--       若專案沒有 app_triahni schema 或相關表，會導致 500。
-- 做法：暫時移除該 trigger，讓註冊可以成功。註冊後再用 ADD_ADMIN_123.sql 設管理員。
-- 在 Supabase SQL Editor 貼上下方 SQL → Run
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_triahni ON auth.users;
