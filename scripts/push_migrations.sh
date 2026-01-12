#!/bin/bash
# 自動執行 migration 腳本
# 這個腳本會自動執行新的 migration，跳過已經存在的表

set -e

echo "🚀 開始自動執行 migration..."

cd "$(dirname "$0")/.."

# 檢查是否已登入
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ 未登入 Supabase，請先執行: supabase login"
    exit 1
fi

echo "✅ 已確認登入 Supabase"

# 查看 migration 狀態
echo "📋 查看 migration 狀態..."
supabase migration list

echo ""
echo "ℹ️  由於某些 migration 已經在資料庫中執行過，我們需要："
echo "   1. 使用 migration repair 標記已執行的 migration"
echo "   2. 或者直接使用 SQL Editor 執行新的 migration（announcements）"
echo ""

# 推薦使用 SQL Editor 執行新的 migration
echo "💡 推薦方式：使用 SQL Editor 執行 announcements migration"
echo "   1. 前往: https://supabase.com/dashboard/project/iofbmtjgfphictlmczas/sql/new"
echo "   2. 複製 supabase/migrations/20260112065349_create_announcements.sql 的內容"
echo "   3. 貼上並執行"
echo ""

# 如果需要自動化，可以使用 migration repair
echo "🔧 如果需要完全自動化，可以執行以下命令修復 migration 狀態："
echo "   supabase migration repair --status applied 20260111034619"
echo "   supabase migration repair --status applied 20260111044408"
echo "   # ... 等等，標記所有已執行的 migration"
echo "   然後執行: supabase db push"
echo ""

echo "📝 或者，直接使用 SQL Editor 執行 announcements migration 最簡單！"
